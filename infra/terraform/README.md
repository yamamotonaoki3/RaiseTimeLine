# infra/terraform

RaiseTimeLineのAWSインフラ（EC2レス構成）をTerraformで管理するディレクトリ。

## 構成

S3+CloudFront（フロント配信）＋ ALB＋ECS Fargate（バックエンド実行）＋ RDS（データ永続化）を、
EC2を使わずに構築する。全体構成は [docs/details/system-architecture.md](../../docs/details/system-architecture.md) を参照。

VPC・サブネット・セキュリティグループ・VPCエンドポイント（`network.tf` / `security-groups.tf` / `endpoints.tf`）に加え、
ECR・RDS・ECS Fargate・ALB・S3+CloudFront（`ecr.tf` / `rds.tf` / `ecs.tf` / `iam.tf` / `secrets.tf` / `alb.tf` /
`s3-frontend.tf` / `cloudfront.tf`）まで一通り揃っている。

現在の設計判断（学習目的でコスト優先）:

- RDS・VPC Interface Endpointは可用性より低コストを優先し、シングルaz構成にしている。ECS Fargateは
  `desired_count = 1`（タスクは1つだけ）とすることでコストを抑えている（配置先のサブネットは2AZ分渡しており、
  どちらのAZにスケジュールされるかはECSが決める）
- ALBはHTTPリスナーのみ。独自ドメイン・ACM証明書が未取得のため、HTTPS化は別途ドメイン取得後の別Issueで対応する予定
  （ブラウザとの通信は常にCloudFront経由のHTTPSであり、ALBへの直接アクセスは`X-Origin-Verify`ヘッダーで遮断しているため、
  現状でもMixed Content等の問題は発生しない）
- 画像ストレージ用S3バケット（`var.post_images_bucket_name`）は、ローカルDocker検証時に手動作成した既存バケットで
  **このTerraformコードでは管理していない**。`terraform apply`で作成されず、`terraform destroy`でも削除されない

## 学習資料との関係

このディレクトリのコードは、`Learn/Learning/aws-terraform-infra/` で行ったAWS/Terraform学習の成果を
RaiseTimeLine用に持ち込んだもの。各サービスの役割・料金・設計判断の背景は学習資料側にまとめてあるので、
コードの意図を確認したいときはあわせて参照する。

- AWSサービス解説: `Learn/Learning/aws-terraform-infra/docs/01_aws-services/`
- Terraform基礎: `Learn/Learning/aws-terraform-infra/docs/02_terraform-basics/`

## 実行手順

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # 値を確認・調整する（.gitignore対象）
terraform init
terraform fmt -check
terraform validate
terraform plan -out=plan.tfplan
terraform apply plan.tfplan
```

## 注意事項

- `terraform.tfvars` / `*.tfstate` / `*.tfplan` / `.terraform/` はコミットしない（`.gitignore`済み）
- AWS認証情報はコード・tfvarsに書かず、環境変数またはAWS CLIプロファイルから供給する
- 課金が発生するリソース（Interface型VPCエンドポイント・ALB・ECS Fargate・RDS等）を追加した際は、
  不要になったら都度 `terraform destroy` するか、リソースを明示的に停止する
