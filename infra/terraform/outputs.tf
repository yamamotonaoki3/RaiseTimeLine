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

