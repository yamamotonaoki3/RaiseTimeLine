-- パフォーマンステスト用シードデータ投入スクリプト
-- 手動実行専用（Flywayマイグレーションには含めない）
-- 実行例: psql -h localhost -U postgres -d raisetimeline -f backend/perf/seed/seed-perf-data.sql
--
-- 生成されるデータはすべて識別可能な形式にしている（cleanup.sql で確実に削除するため）
--   - users.username     : perfuser_001 〜 perfuser_100
--   - users.email        : perf-test-user001@example.com 〜 perf-test-user100@example.com
--   - posts.content      : 先頭に [PERF_TEST] タグを付与
--   - comments.content   : 先頭に [PERF_TEST] タグを付与

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. テストユーザー100名（全員共通パスワード: PerfTest123!）
INSERT INTO users (email, password_hash, display_name, username, bio, created_at)
SELECT
    'perf-test-user' || lpad(n::text, 3, '0') || '@example.com',
    crypt('PerfTest123!', gen_salt('bf')),
    'PerfUser' || lpad(n::text, 3, '0'),
    'perfuser_' || lpad(n::text, 3, '0'),
    '[PERF_TEST] load testing account',
    NOW() - (random() * interval '30 days')
FROM generate_series(1, 100) AS n;

-- 2. フォロー関係（各ユーザーが10〜30人をランダムにフォロー）
INSERT INTO follows (follower_id, followee_id, created_at)
SELECT DISTINCT ON (u.id, f.followee_id)
    u.id,
    f.followee_id,
    NOW() - (random() * interval '30 days')
FROM users u
CROSS JOIN LATERAL (
    SELECT id AS followee_id
    FROM users
    WHERE username LIKE 'perfuser_%'
      AND id <> u.id
    ORDER BY random()
    LIMIT (10 + floor(random() * 21)::int)
) f
WHERE u.username LIKE 'perfuser_%'
ON CONFLICT (follower_id, followee_id) DO NOTHING;

-- 3. 投稿10,000件（先頭50ユーザーに分散、過去30日間でばらつかせる）
INSERT INTO posts (user_id, content, created_at, updated_at)
SELECT
    u.id,
    '[PERF_TEST] load test post #' || n,
    ts,
    ts
FROM generate_series(1, 10000) AS n
CROSS JOIN LATERAL (
    SELECT id
    FROM users
    WHERE username LIKE 'perfuser_0%'
       OR username LIKE 'perfuser_1%'
       OR username LIKE 'perfuser_2%'
       OR username LIKE 'perfuser_3%'
       OR username LIKE 'perfuser_4%'
    ORDER BY random()
    LIMIT 1
) u
CROSS JOIN LATERAL (
    SELECT NOW() - (random() * interval '30 days') AS ts
) t;

-- 4. いいね20,000件（重複は無視）
INSERT INTO likes (post_id, user_id)
SELECT p.id, u.id
FROM (
    SELECT id FROM posts WHERE content LIKE '[PERF_TEST]%' ORDER BY random() LIMIT 20000
) p
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE username LIKE 'perfuser_%' ORDER BY random() LIMIT 1
) u
ON CONFLICT (post_id, user_id) DO NOTHING;

-- 5. コメント5,000件
INSERT INTO comments (post_id, user_id, content, created_at, updated_at)
SELECT
    p.id,
    u.id,
    '[PERF_TEST] load test comment #' || n,
    NOW() - (random() * interval '30 days'),
    NOW() - (random() * interval '30 days')
FROM generate_series(1, 5000) AS n
CROSS JOIN LATERAL (
    SELECT id FROM posts WHERE content LIKE '[PERF_TEST]%' ORDER BY random() LIMIT 1
) p
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE username LIKE 'perfuser_%' ORDER BY random() LIMIT 1
) u;

COMMIT;

-- 投入結果の確認
SELECT
    (SELECT count(*) FROM users WHERE username LIKE 'perfuser_%') AS users_count,
    (SELECT count(*) FROM posts WHERE content LIKE '[PERF_TEST]%') AS posts_count,
    (SELECT count(*) FROM follows WHERE follower_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%')) AS follows_count,
    (SELECT count(*) FROM likes WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perfuser_%')) AS likes_count,
    (SELECT count(*) FROM comments WHERE content LIKE '[PERF_TEST]%') AS comments_count;
