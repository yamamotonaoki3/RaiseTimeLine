# 以前ローカルDocker検証時に手動作成した既存バケット（raisetimeline-post-images）は空だったため、
# importせず、frontendバケットと同じ方式（random_idでユニーク化）で新規に作り直す。
# 旧バケットはTerraform管理外のまま残るので、不要になったら手動で削除すること。
resource "random_id" "post_images_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "post_images" {
  bucket = "${var.project_name}-post-images-${random_id.post_images_bucket_suffix.hex}"
  # force_destroyは指定しない（既定false）。中身はユーザーがアップロードした実データであり、
  # 他のインフラ（ECR・フロント配信用バケット等の再生成可能なもの）と同列にterraform destroyで
  # まとめて消えてしまわないようにする。このバケットを本当に削除したい場合は、
  # 中のオブジェクトを空にしてから明示的にdestroyする。

  tags = merge(local.common_tags, { Name = "${var.project_name}-post-images" })
}

resource "aws_s3_bucket_public_access_block" "post_images" {
  bucket = aws_s3_bucket.post_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 元はPrincipal:"*"でs3:GetObjectを許可する公開ポリシーだった
# （presigned URL方式を採用しているS3StorageServiceの設計意図と矛盾していた）。
# 公開読み取りは廃止し、非HTTPS通信を拒否するポリシーに置き換える。
resource "aws_s3_bucket_policy" "post_images" {
  bucket = aws_s3_bucket.post_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource = [
        aws_s3_bucket.post_images.arn,
        "${aws_s3_bucket.post_images.arn}/*"
      ]
      Condition = {
        Bool = { "aws:SecureTransport" = "false" }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.post_images]
}
