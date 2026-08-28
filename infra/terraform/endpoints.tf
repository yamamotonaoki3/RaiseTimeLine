resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "interface" {
  for_each = var.enable_interface_endpoints ? local.interface_endpoint_services : toset([])

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  # 学習目的でコスト優先のためシングルAZ（RDS・ECSと同じ方針）。
  # AZが1つでも、private_dns_enabledによりVPC内のどのAZからも到達できる
  # （そのAZが落ちた場合のみ利用不可になる、というトレードオフ）。
  subnet_ids         = [aws_subnet.private[local.availability_zones[0]].id]
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-${replace(each.value, ".", "-")}-endpoint"
    Service = each.value
  })
}

