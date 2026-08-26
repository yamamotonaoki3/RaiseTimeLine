variable "aws_region" {
  type        = string
  description = "リソースを作成するAWSリージョン"
  default     = "ap-northeast-1"
}

variable "project_name" {
  type        = string
  description = "リソース名とタグに使用するプロジェクト名"
  default     = "raisetimeline"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_nameは半角小文字、数字、ハイフンだけで指定してください。"
  }
}

variable "vpc_cidr" {
  type        = string
  description = "VPC全体のIPv4 CIDR"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "異なる2AZに作成するPublic subnetのCIDR"
  default     = ["10.0.0.0/24", "10.0.1.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "public_subnet_cidrsには2つのCIDRを指定してください。"
  }
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "異なる2AZに作成するPrivate subnetのCIDR"
  default     = ["10.0.10.0/24", "10.0.11.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "private_subnet_cidrsには2つのCIDRを指定してください。"
  }
}

variable "app_port" {
  type        = number
  description = "ALBからECS Fargateタスクへ転送するアプリケーションポート"
  default     = 8080
}

variable "enable_interface_endpoints" {
  type        = bool
  description = "ECR、CloudWatch Logs、Secrets Managerの有料Interface endpointを作成するか"
  default     = false
}

variable "rds_instance_class" {
  type        = string
  description = "RDSインスタンスクラス"
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  type        = number
  description = "RDSの割り当てストレージ容量（GB）"
  default     = 20
}

variable "tags" {
  type        = map(string)
  description = "全リソースへ追加する共通タグ"
  default     = {}
}

