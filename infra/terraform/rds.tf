resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [for az in local.availability_zones : aws_subnet.private[az].id]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "17"

  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  storage_type      = "gp3"

  db_name  = "raisetimeline"
  username = "raisetimeline_app"

  # マスターパスワードはTerraform側で持たず、AWSがSecrets Managerへ自動生成・保存する。
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db"
  })
}
