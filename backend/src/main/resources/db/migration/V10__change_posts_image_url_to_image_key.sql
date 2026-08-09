-- 投稿画像をpresigned URL方式に変更するため、保存する値を「公開URL」から「object key」に変える。
--
-- 変更前: https://<bucket>.s3.<region>.amazonaws.com/posts/<uuid>.jpg
-- 変更後: posts/<uuid>.jpg
--
-- 公開URLをDBに持つと、バケットを公開しない限り画像を表示できない。
-- keyだけを保存し、表示のたびに期限付きURLを発行する方式に寄せる。
-- あわせてカラム名も image_key に変え、中身がURLでないことをスキーマ上で明示する。

-- 1. 既存データを key に変換する（リネーム前に実施する）
UPDATE posts
SET image_url = substring(
        image_url FROM position('.amazonaws.com/' IN image_url) + length('.amazonaws.com/')
    )
WHERE image_url LIKE '%.amazonaws.com/%';

-- 2. カラム名を変更する
ALTER TABLE posts RENAME COLUMN image_url TO image_key;
