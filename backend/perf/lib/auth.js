import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// backend/perf/seed/users.csv からシード投入済みのテストユーザーを読み込む。
// SharedArray で読み込むことで全VU間でメモリを共有し、VUごとに異なるユーザーを使わせて
// 特定ユーザーへの負荷集中を避ける。
const users = new SharedArray('perf test users', function () {
    const csv = open('../seed/users.csv');
    return papaparse.parse(csv, { header: true, skipEmptyLines: true }).data;
});

export function pickUser(vuId) {
    return users[vuId % users.length];
}

// ログインに失敗した場合は例外を投げず null を返す。
// 呼び出し側は null を「今回のイテレーションはスキップ」の合図として扱うこと。
// （高負荷時に例外を投げると sleep() を経由せず次のイテレーションへ即座に進んでしまい、
//   リトライの間隔がないまま連打状態になってサーバーへの実質的な高負荷を悪化させるため）
export function login(user) {
    const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers: { 'Content-Type': 'application/json' } },
    );
    const ok = check(res, { 'login succeeded': (r) => r.status === 200 });
    if (!ok) {
        return null;
    }
    return res.json('accessToken');
}

export function authHeaders(token) {
    return { Authorization: `Bearer ${token}` };
}
