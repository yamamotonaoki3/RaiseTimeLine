-- E2Eテストデータの一括削除スクリプト
--
-- globalSetup（投入前）と globalTeardown（実行後）の両方から呼ばれる。
-- 実行前にも流すことで、前回の異常終了でデータが残っていても再実行できる（冪等）。
--
-- 対象の見分け方:
--   - users.username が 'e2euser_%' / email が 'e2e-test-user%@example.com'
--   - posts.content / comments.content が '[E2E_TEST]%'
--
-- 外部キー制約の都合上、子テーブルから順に削除する
-- （likes, comments -> posts, follows -> users, refresh_tokens -> users）

BEGIN;

DELETE FROM likes
WHERE post_id IN (SELECT id FROM posts WHERE content LIKE '[E2E_TEST]%')
   OR user_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\_%');

DELETE FROM comments
WHERE content LIKE '[E2E_TEST]%'
   OR user_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\_%');

DELETE FROM posts
WHERE content LIKE '[E2E_TEST]%'
   OR user_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\_%');

DELETE FROM follows
WHERE follower_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\_%')
   OR followee_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\_%');

DELETE FROM refresh_tokens
WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\_%');

DELETE FROM users
WHERE username LIKE 'e2euser\_%'
   OR email LIKE 'e2e-test-user%@example.com';

COMMIT;

-- 削除後の残存確認（すべて 0 になっていることを確認する）
SELECT
    (SELECT count(*) FROM users WHERE username LIKE 'e2euser\_%') AS remaining_users,
    (SELECT count(*) FROM posts WHERE content LIKE '[E2E_TEST]%') AS remaining_posts,
    (SELECT count(*) FROM comments WHERE content LIKE '[E2E_TEST]%') AS remaining_comments;
