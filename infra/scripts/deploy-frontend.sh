#!/bin/bash
# フロントエンドのビルド成果物をS3へアップロードし、CloudFrontのキャッシュを無効化する。
#
# 前提: infra/terraform を一度でもterraform applyしていること
#      （frontend_bucket_name / cloudfront_distribution_id / cloudfront_domain_name の
#      outputsが存在すること）。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TERRAFORM_DIR="${REPO_ROOT}/infra/terraform"
FRONTEND_DIR="${REPO_ROOT}/frontend"

echo "==> フロントエンドをビルドします"
(cd "${FRONTEND_DIR}" && npm run build)

echo "==> Terraformのoutputsから接続先を取得します"
BUCKET_NAME=$(terraform -chdir="${TERRAFORM_DIR}" output -raw frontend_bucket_name)
DISTRIBUTION_ID=$(terraform -chdir="${TERRAFORM_DIR}" output -raw cloudfront_distribution_id)
DOMAIN_NAME=$(terraform -chdir="${TERRAFORM_DIR}" output -raw cloudfront_domain_name)

echo "==> S3へアップロードします（バケット: ${BUCKET_NAME}）"
# --delete: S3側にだけ存在する古いファイル（前回ビルドの残骸）を削除し、dist/の内容と完全に一致させる
aws s3 sync "${FRONTEND_DIR}/dist/" "s3://${BUCKET_NAME}/" --delete

echo "==> CloudFrontのキャッシュを無効化します（ディストリビューション: ${DISTRIBUTION_ID}）"
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"

echo "==> デプロイ完了: https://${DOMAIN_NAME}"
