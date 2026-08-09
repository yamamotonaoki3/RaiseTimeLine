-- アバター画像の保存先をローカルディスクからS3に統一するため、
-- 保存する値を「配信パス」から「object key」に変える。
--
-- 変更前: /avatars/<uuid>.png（Springの静的配信のパス）
-- 変更後: avatars/<uuid>.png（S3のobject key）
--
-- 値の変換はここでは行わない。実ファイルをS3へアップロードする必要があり、
-- SQLだけでは完結しないため、AvatarMigrationRunner が起動時に行う。
-- （投稿画像の V10 と違い、既存ファイルの移動を伴う点が異なる）

ALTER TABLE users RENAME COLUMN avatar_url TO avatar_key;
