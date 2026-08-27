resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "jwt" {
  name = "${var.project_name}/jwt-secret"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt_secret.result
}

# CloudFrontのオリジン用管理プレフィックスリストは「AWS全体のCloudFront」を許可するため、
# 他アカウントのCloudFrontディストリビューションがこのALBの公開DNS名をオリジンに設定して
# 到達できてしまう抜け道がある。このシークレットヘッダーの値をCloudFrontが付与し、
# ALBのリスナールールで一致を検証することで、このディストリビューション以外からの
# 到達を遮断する（AWS推奨のオリジンアクセス制御パターン）。
resource "random_password" "cloudfront_origin_verify" {
  length  = 32
  special = false
}
