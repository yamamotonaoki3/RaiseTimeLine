resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # token.actions.githubusercontent.com が提示する証明書チェーンの最上位（ルート）のSHA1 fingerprint。
  # `echo | openssl s_client -servername token.actions.githubusercontent.com \
  #   -connect token.actions.githubusercontent.com:443 -showcerts` で確認できる。
  # 証明書の入れ替え（CA変更）が起きた場合はこの値を更新する必要がある。
  thumbprint_list = ["ab9d0263244dd0326eb67015705a667e79cfe998"]

  tags = local.common_tags
}

resource "aws_iam_role" "github_actions_ecr_push" {
  name = "${var.project_name}-github-actions-ecr-push"

  # mainブランチへのpushイベント由来のトークンのみ引き受ける（他ブランチ・他リポジトリからは不可）
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:yamamotonaoki3/RaiseTimeLine:ref:refs/heads/main"
        }
      }
    }]
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-github-actions-ecr-push" })
}

resource "aws_iam_role_policy" "github_actions_ecr_push" {
  name = "${var.project_name}-github-actions-ecr-push"
  role = aws_iam_role.github_actions_ecr_push.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:DescribeImages",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = aws_ecr_repository.backend.arn
      }
    ]
  })
}
