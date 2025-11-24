#!/bin/bash

# Deploy to production environment
# Usage: ./scripts/deploy-prod.sh

set -e

echo "🚀 Deploying to production environment..."

# Build the project
echo "📦 Building project..."
npm run build

# Get CloudFront distribution ID from Terraform
DIST_ID=$(cd terraform && terraform output -raw cloudfront_distribution_id)
BUCKET=$(cd terraform && terraform output -raw s3_bucket_name)

if [ -z "$DIST_ID" ] || [ -z "$BUCKET" ]; then
  echo "❌ Error: Could not get CloudFront distribution ID or S3 bucket name"
  exit 1
fi

echo "📤 Uploading to S3 bucket: $BUCKET"
aws s3 sync dist/ "s3://$BUCKET/" \
  --profile terraform-admin \
  --delete \
  --exclude "*.map" \
  --cache-control "public, max-age=3600"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --profile terraform-admin \
  --output json > /dev/null

echo "✅ Deployment complete!"
echo "🌐 Production site: https://secretpizza.org"

