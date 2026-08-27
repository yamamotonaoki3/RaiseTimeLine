output "availability_zones" {
  description = "使用する2つのAvailability Zone"
  value       = local.availability_zones
}

output "vpc_id" {
  description = "ECS Fargate・RDSが所属するVPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "ALBを配置するPublic subnet ID"
  value       = [for az in local.availability_zones : aws_subnet.public[az].id]
}

output "private_subnet_ids" {
  description = "ECSとRDSを配置するPrivate subnet ID"
  value       = [for az in local.availability_zones : aws_subnet.private[az].id]
}

output "public_route_table_id" {
  description = "Internet Gatewayへのdefault routeを持つRoute Table ID"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "インターネットへのdefault routeを持たないRoute Table ID"
  value       = aws_route_table.private.id
}

output "security_group_ids" {
  description = "ALB・ECS・RDS・VPCエンドポイント用のSecurity Group ID"
  value = {
    alb           = aws_security_group.alb.id
    ecs           = aws_security_group.ecs.id
    rds           = aws_security_group.rds.id
    vpc_endpoints = aws_security_group.vpc_endpoints.id
  }
}

output "s3_gateway_endpoint_id" {
  description = "Private subnetからS3へ到達するGateway endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "interface_endpoint_ids" {
  description = "有効化したInterface endpointのサービス名とID"
  value       = { for service, endpoint in aws_vpc_endpoint.interface : service => endpoint.id }
}

output "ecr_repository_url" {
  description = "バックエンドDockerイメージをpushするECRリポジトリURL"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "ECSからDB接続に使うRDSエンドポイント（ホスト:ポート）"
  value       = aws_db_instance.main.endpoint
}

output "rds_master_user_secret_arn" {
  description = "RDSが自動生成したマスターパスワードのSecrets Manager ARN"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "ecs_cluster_name" {
  description = "ECSクラスタ名"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECSサービス名"
  value       = aws_ecs_service.backend.name
}

output "alb_dns_name" {
  description = "ALBのDNS名（アプリへのアクセス先。後続でCloudFrontのオリジンにも使う）"
  value       = aws_lb.main.dns_name
}

