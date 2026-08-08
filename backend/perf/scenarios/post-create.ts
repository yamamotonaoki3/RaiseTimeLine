import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { BASE_URL, getValidToken, authHeaders } from '../lib/auth.ts';
import { buildOptions } from '../lib/scenarios-config.ts';
import { buildSummary } from '../lib/report.ts';
import { multipartTextBody } from '../lib/multipart.ts';

// シナリオ2: 投稿作成（POST /api/posts, multipart/form-data）
// 生成される投稿はすべて content 先頭に [PERF_TEST] タグを付与する。
// このタグにより cleanup.sql が seed データとこのシナリオで生成されたデータの両方を
// まとめて削除できるため、シナリオ側で個別の DELETE teardown は行わない。

export const options = buildOptions('post-create');

export function handleSummary(data: object) {
    return buildSummary('post-create', data);
}

export default function (): void {
    // finally で必ず sleep(1) を実行する（暴走ループ防止。timeline.ts のコメント参照）。
    try {
        const token = getValidToken(exec.vu.idInTest);
        if (token === null) {
            return;
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
