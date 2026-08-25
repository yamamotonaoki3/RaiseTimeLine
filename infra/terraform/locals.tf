locals {
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnets = {
    for index, az in local.availability_zones : az => var.public_subnet_cidrs[index]
  }

  private_subnets = {
    for index, az in local.availability_zones : az => var.private_subnet_cidrs[index]
  }

  interface_endpoint_services = toset([
    "ecr.api",
    "ecr.dkr",
    "logs",
    "secretsmanager",
  ])

  common_tags = merge(
    {
      Project   = var.project_name
      ManagedBy = "Terraform"
    },
    var.tags
  )
}

