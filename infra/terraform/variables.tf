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
  description = "ECR、CloudWatch Logs、Secrets Managerの有料Interface endpointを作成するか。ECS Fargateタスクがprivate subnetからこれらに到達する唯一の経路（NAT Gatewayは使わない方針）のため、既定でtrueにしている"
  default     = true
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

variable "ecs_task_cpu" {
  type        = number
  description = "ECSタスクのCPUユニット（Fargateの最小構成）"
  default     = 256
}

variable "ecs_task_memory" {
  type        = number
  description = "ECSタスクのメモリ（MiB）"
  default     = 512
}

variable "ecs_desired_count" {
  type        = number
  description = "ECSサービスの起動タスク数"
  default     = 1
}

variable "backend_image_tag" {
  type        = string
  description = "ECRにpushするバックエンドイメージのタグ。デプロイのたびに更新する"
  default     = "initial"
}

variable "cors_allowed_origins" {
  type        = string
  description = "バックエンドが許可するCORSオリジン（フロントのCloudFrontドメイン）。S3+CloudFront構築後に確定するまでは暫定値を使う"
}

# ローカルDocker検証時にAWS CLIで手動作成した既存バケットで、このTerraformコードでは管理していない。
# バケット自体のTerraform化（aws_s3_bucketリソース化・importの実施）はS3+CloudFront追加のIssueで行う。
variable "post_images_bucket_name" {
  type        = string
  description = "投稿・アバター画像を保存する既存S3バケット名（Terraform管理外）"
  default     = "raisetimeline-post-images"
}

variable "tags" {
  type        = map(string)
  description = "全リソースへ追加する共通タグ"
  default     = {}
}

