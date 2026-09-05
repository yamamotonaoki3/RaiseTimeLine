# infra/terraform

RaiseTimeLineのAWSインフラ（EC2レス構成）をTerraformで管理するディレクトリ。

## 構成

S3+CloudFront（フロント配信）＋ ALB＋ECS Fargate（バックエンド実行）＋ RDS（データ永続化）を、
EC2を使わずに構築する。全体構成は [docs/details/system-architecture.md](../../docs/details/system-architecture.md) を参照。

VPC・サブネット・セキュリティグループ・VPCエンドポイント（`network.tf` / `security-groups.tf` / `endpoints.tf`）に加え、
ECR・RDS・ECS Fargate・ALB・S3+CloudFront（`ecr.tf` / `rds.tf` / `ecs.tf` / `iam.tf` / `secrets.tf` / `alb.tf` /
`s3-frontend.tf` / `cloudfront.tf` / `s3-images.tf`）まで一通り揃っている。

現在の設計判断（学習目的でコスト優先）:

- RDS・VPC Interface Endpointは可用性より低コストを優先し、シングルaz構成にしている。ECS Fargateは
  `desired_count = 1`（タスクは1つだけ）とすることでコストを抑えている（配置先のサブネットは2AZ分渡しており、
  どちらのAZにスケジュールされるかはECSが決める）
- ALBはHTTPリスナーのみ。独自ドメイン・ACM証明書が未取得のため、HTTPS化は別途ドメイン取得後の別Issueで対応する予定
  （ブラウザとの通信は常にCloudFront経由のHTTPSであり、ALBへの直接アクセスは`X-Origin-Verify`ヘッダーで遮断しているため、
  現状でもMixed Content等の問題は発生しない）
- 画像ストレージ用S3バケット（`s3-images.tf`）は、ローカルDocker検証時に手動作成した旧バケット（空だったため）とは
  別に、`random_id`でユニーク化した新しいバケットとしてTerraform管理下に作成する。旧バケットは管理外のまま残るため、
  不要になったら手動で削除すること

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

## フロントエンドのデプロイ

`terraform apply` 済みであれば、以下でフロントエンドのビルド成果物をS3へアップロードし、CloudFrontのキャッシュを無効化できる。

```bash
./infra/scripts/deploy-frontend.sh
```

## バックエンドのCI/CD（ECRへの自動push）

`.github/workflows/deploy-backend.yml` が、`main` への push（`backend/**` に変更がある場合のみ）を
トリガーに、Dockerイメージをビルドして自動でECRへpushする。認証は静的なアクセスキーではなく、
OIDC連携（`github-oidc.tf`）でAWSの一時的な認証情報を取得する方式にしている。

**ECS側への反映（デプロイ）は自動化していない。** ワークフロー実行後、GitHub ActionsのStep Summaryに
新しいイメージタグ（Gitコミットハッシュ短縮形）が表示されるので、それを
`infra/terraform/terraform.tfvars` の `backend_image_tag` に手動で反映し、`terraform apply` する。
自動化せず手動にしているのは、再現性を保ちミスを減らすため。

### 初回セットアップ（`terraform apply` 後に1回だけ）

```bash
terraform output -raw github_actions_role_arn
```

で得られる値を、GitHubリポジトリの Settings → Secrets and variables → Actions に、
`AWS_ECR_PUSH_ROLE_ARN` という名前のRepository secretとして登録する。

## 注意事項

- `terraform.tfvars` / `*.tfstate` / `*.tfplan` / `.terraform/` はコミットしない（`.gitignore`済み）
- AWS認証情報はコード・tfvarsに書かず、環境変数またはAWS CLIプロファイルから供給する
- 課金が発生するリソース（Interface型VPCエンドポイント・ALB・ECS Fargate・RDS等）を追加した際は、
  不要になったら都度 `terraform destroy` するか、リソースを明示的に停止する
