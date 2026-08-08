import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { BASE_URL, getValidToken, authHeaders } from '../lib/auth.ts';
import { buildOptions } from '../lib/scenarios-config.ts';
import { buildSummary } from '../lib/report.ts';

// シナリオ3: いいね・コメント投稿（書き込み系の同時実行）
// 対象の投稿はタイムラインから取得したものを使う（シードデータの投稿がヒットする）。
// 生成されるコメントは content 先頭に [PERF_TEST] タグを付与し、cleanup.sql で削除する。
// いいねはシードユーザー（perfuser_%）が行うため、cleanup.sql の user_id 条件で削除される。

interface PostSummary {
    id: number;
}

export const options = buildOptions('like-comment');

export function handleSummary(data: object) {
    return buildSummary('like-comment', data);
}

export default function (): void {
    // finally で必ず sleep(1) を実行する（暴走ループ防止。timeline.ts のコメント参照）。
    try {
        const token = getValidToken(exec.vu.idInTest);
        if (token === null) {
            return;
        }
        const headers = authHeaders(token);

        const timeline = http.get(`${BASE_URL}/api/posts?limit=20`, { headers });
        const timelineOk = check(timeline, { 'timeline: status 200': (r) => r.status === 200 });
        if (!timelineOk) {
            return;
        }

        const posts = timeline.json() as PostSummary[];
        if (!Array.isArray(posts) || posts.length === 0) {
            return;
        }
        const targetPostId = posts[Math.floor(Math.random() * posts.length)].id;

        const likeRes = http.post(`${BASE_URL}/api/posts/${targetPostId}/like`, null, { headers });
        check(likeRes, { 'like: status 204 or 409': (r) => r.status === 204 || r.status === 409 });

        const commentRes = http.post(
            `${BASE_URL}/api/posts/${targetPostId}/comments`,
            JSON.stringify({ content: `[PERF_TEST] comment by VU ${exec.vu.idInTest}` }),
            { headers: { ...headers, 'Content-Type': 'application/json' } },
        );
        check(commentRes, { 'comment: status 201': (r) => r.status === 201 });
    } finally {
        sleep(1);
    }
}
