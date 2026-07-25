import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { BASE_URL, pickUser, login, authHeaders } from '../lib/auth.js';
import { buildOptions } from '../lib/scenarios-config.js';
import { buildSummary } from '../lib/report.js';
import { multipartTextBody } from '../lib/multipart.js';

// シナリオ2: 投稿作成（POST /api/posts, multipart/form-data）
// 生成される投稿はすべて content 先頭に [PERF_TEST] タグを付与する。
// このタグにより cleanup.sql が seed データとこのシナリオで生成されたデータの両方を
// まとめて削除できるため、シナリオ側で個別の DELETE teardown は行わない。

export const options = buildOptions('post-create');

export function handleSummary(data) {
    return buildSummary('post-create', data);
}

let token = null;

export default function () {
    // finally で必ず sleep(1) を実行する（暴走ループ防止。timeline.js のコメント参照）。
    try {
        if (token === null) {
            const user = pickUser(exec.vu.idInTest);
            token = login(user);
            if (token === null) {
                return;
            }
        }
        const headers = authHeaders(token);

        // PostController は consumes = multipart/form-data のため、boundary付きで手動エンコードする
        const { body, contentTypeHeader } = multipartTextBody({
            content: `[PERF_TEST] created by VU ${exec.vu.idInTest} iter ${exec.vu.iterationInInstance}`,
        });
        const res = http.post(
            `${BASE_URL}/api/posts`,
            body,
            { headers: { ...headers, 'Content-Type': contentTypeHeader } },
        );
        check(res, { 'post create: status 201': (r) => r.status === 201 });
    } finally {
        sleep(1);
    }
}
