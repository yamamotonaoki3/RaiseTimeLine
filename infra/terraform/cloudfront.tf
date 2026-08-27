resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# React Routerのクライアントサイドルーティング対応。
# custom_error_response（ステータスコードベースの書き換え）はディストリビューション全体に
# 効いてしまい、/api/*のバックエンドが返す正当な403/404まで書き換えてしまうため使えない。
# 代わりにCloudFront Functionsで、拡張子を含まない（=静的ファイルではない）パスへの
# リクエストだけをindex.htmlへ書き換える。default_cache_behavior（S3向け）にのみ適用するため
# /api/*には一切関与しない。
resource "aws_cloudfront_function" "spa_routing" {
  name    = "${var.project_name}-spa-routing"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      if (!request.uri.includes('.')) {
        request.uri = '/index.html';
      }
      return request;
    }
  EOT
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_200" # 日本を含むアジアのエッジロケーションを使うため100ではなく200

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # ALBはHTTPリスナーのみ（独自ドメイン取得後にHTTPS化する別Issueで対応予定）。
  # ブラウザは常にCloudFront（HTTPS）としか通信しないため、この内部区間だけHTTPでも
  # Mixed Content・Cookie(SameSite=None/Secure)の問題は発生しない。
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb-backend"

    # ALBのリスナールールでこの値を検証し、このディストリビューション以外からの
    # アクセスを遮断する（security-groups.tfのコメント参照）。
    custom_header {
      name  = "X-Origin-Verify"
      value = random_password.cloudfront_origin_verify.result
    }

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS managed: CachingOptimized

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing.arn
    }
  }

  # フロントとAPIを同一オリジン化することで、Mixed ContentとCookieのSameSite問題を回避する。
  # APIレスポンスはキャッシュしない。Cookie・Authorizationヘッダー・クエリ文字列はそのまま転送する。
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "alb-backend"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # AWS managed: CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AWS managed: AllViewer
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true # 独自ドメイン未取得のため既定の*.cloudfront.net証明書を使う
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-frontend" })
}
