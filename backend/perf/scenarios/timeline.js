import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { BASE_URL, pickUser, login, authHeaders } from '../lib/auth.js';
import { buildOptions } from '../lib/scenarios-config.js';
import { buildSummary } from '../lib/report.js';

// シナリオ1: ログイン → タイムライン取得（カーソルページネーション）→ 新着件数ポーリング
// 最も典型的なユーザー行動を再現する。RaiseTimeLineで最も負荷がかかりやすい GET /api/posts が対象。

export const options = buildOptions('timeline');

export function handleSummary(data) {
    return buildSummary('timeline', data);
}

// モジュールスコープの変数はVUごとに1回だけ初期化され、以降のイテレーションで使い回される。
let token = null;

export default function () {
    // finally で必ず sleep(1) を実行する。エラー発生時に sleep を経由せず
    // 次のイテレーションへ即座に進むと、リトライ間隔ゼロの連打状態になり
    // サーバーへの負荷が指数的に悪化する（暴走ループ）ため。
    try {
        if (token === null) {
            const user = pickUser(exec.vu.idInTest);
            token = login(user);
            if (token === null) {
                return;
            }
        }
        const headers = authHeaders(token);

        // 初回タイムライン取得
        const firstPage = http.get(`${BASE_URL}/api/posts?limit=20`, { headers });
        const firstPageOk = check(firstPage, { 'timeline first page: status 200': (r) => r.status === 200 });
        if (!firstPageOk) {
            return;
        }

        const posts = firstPage.json();
        const oldestId = Array.isArray(posts) && posts.length > 0 ? posts[posts.length - 1].id : null;
        const newestId = Array.isArray(posts) && posts.length > 0 ? posts[0].id : null;

        // カーソルページネーション（無限スクロール）
        if (oldestId !== null) {
            const nextPage = http.get(`${BASE_URL}/api/posts?cursor=${oldestId}&limit=20`, { headers });
            check(nextPage, { 'timeline next page: status 200': (r) => r.status === 200 });
        }

        // 新着件数ポーリング（実際は30秒間隔だが、負荷テストでは毎イテレーション実行する）
        if (newestId !== null) {
            const newCount = http.get(`${BASE_URL}/api/posts/new-count?sinceId=${newestId}`, { headers });
            check(newCount, { 'new-count: status 200': (r) => r.status === 200 });
        }
    } finally {
        sleep(1);
    }
}
