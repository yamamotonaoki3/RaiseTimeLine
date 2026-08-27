resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  tags = merge(local.common_tags, { Name = "${var.project_name}-cluster" })
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  # secretsで参照するARNだけではaws_secretsmanager_secret_version.jwtへの暗黙の依存が生まれず、
  # シークレットに値がまだ書き込まれる前にタスクが起動しうるため明示する。
  depends_on = [aws_secretsmanager_secret_version.jwt]

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true
      portMappings = [{
        containerPort = var.app_port
        protocol      = "tcp"
      }]
      environment = [
        { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
        { name = "DB_URL", value = "jdbc:postgresql://${aws_db_instance.main.endpoint}/raisetimeline" },
        { name = "DB_USERNAME", value = "raisetimeline_app" },
        { name = "CORS_ALLOWED_ORIGINS", value = var.cors_allowed_origins },
        { name = "AWS_S3_BUCKET_NAME", value = var.post_images_bucket_name },
        { name = "AWS_S3_REGION", value = var.aws_region },
      ]
      secrets = [
        { name = "DB_PASSWORD", valueFrom = "${aws_db_instance.main.master_user_secret[0].secret_arn}:password::" },
        { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt.arn },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])

  tags = local.common_tags
}

# 初回apply前に、var.backend_image_tagで指定したタグのイメージをECRへdocker pushしておくこと。
# 未pushの状態でもterraform apply自体は完了する（wait_for_steady_state未指定=false）が、
# タスクはCannotPullContainerErrorで起動に失敗し続ける。
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [for az in local.availability_zones : aws_subnet.private[az].id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  # ALB未接続。ALB追加のIssueでload_balancerブロックを追記する。

  tags = local.common_tags
}
