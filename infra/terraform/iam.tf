# --- ECSタスク実行ロール（ECR pull・CloudWatch Logs書き込み・Secrets Manager読み取り） ---
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = merge(local.common_tags, { Name = "${var.project_name}-ecs-task-execution" })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_db_instance.main.master_user_secret[0].secret_arn,
        aws_secretsmanager_secret.jwt.arn,
      ]
    }]
  })
}

# --- ECSタスクロール（アプリ実行時にS3へアクセスするための権限） ---
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = merge(local.common_tags, { Name = "${var.project_name}-ecs-task" })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.project_name}-ecs-task-s3"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
      Resource = "arn:aws:s3:::${var.post_images_bucket_name}/*"
    }]
  })
}
