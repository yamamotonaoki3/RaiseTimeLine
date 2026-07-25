-- パフォーマンステスト用データの一括削除スクリプト
-- seed-perf-data.sql で投入したデータ、および k6 実行時にAPI経由で作成されたデータ
-- （teardown()で削除しきれなかった分を含む）を、識別用の目印をもとに安全に削除する。
--
-- 対象の見分け方:
--   - users.username / email が 'perfuser_%' / 'perf-test-user%'
--   - posts.content / comments.content が '[PERF_TEST]%'
--
-- 外部キー制約の都合上、子テーブルから順に削除する
-- （likes, comments -> posts, follows -> users）
--
-- 実行例: psql -h localhost -U postgres -d raisetimeline -f backend/perf/seed/cleanup.sql

BEGIN;

DELETE FROM likes
WHERE post_id IN (SELECT id FROM posts WHERE content LIKE '[PERF_TEST]%')
   OR user_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%');

DELETE FROM comments
WHERE content LIKE '[PERF_TEST]%'
   OR user_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%');

DELETE FROM posts
WHERE content LIKE '[PERF_TEST]%'
   OR user_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%');

DELETE FROM follows
WHERE follower_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%')
   OR followee_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%');

DELETE FROM users
WHERE username LIKE 'perfuser_%'
   OR email LIKE 'perf-test-user%@example.com';

COMMIT;

-- 削除後の残存確認（すべて 0 になっていることを確認する）
SELECT
    (SELECT count(*) FROM users WHERE username LIKE 'perfuser_%') AS remaining_users,
    (SELECT count(*) FROM posts WHERE content LIKE '[PERF_TEST]%') AS remaining_posts,
    (SELECT count(*) FROM comments WHERE content LIKE '[PERF_TEST]%') AS remaining_comments;
