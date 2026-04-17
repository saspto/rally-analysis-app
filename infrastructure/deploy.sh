#!/bin/bash
# Deploy Rally Analysis App to AWS
set -euo pipefail

ENVIRONMENT=${1:-dev}
STACK_NAME="rally-analysis-app-${ENVIRONMENT}"
AWS_REGION=${AWS_REGION:-us-east-1}

echo "==> Deploying Rally Analysis App (environment: $ENVIRONMENT)"
echo "    Stack: $STACK_NAME | Region: $AWS_REGION"

# Validate required env vars
for var in RALLY_API_KEY RALLY_WORKSPACE ANTHROPIC_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: Required environment variable $var is not set."
    exit 1
  fi
done

# Create SAM deploy bucket if it doesn't exist
DEPLOY_BUCKET="sam-deploy-${ENVIRONMENT}-$(aws sts get-caller-identity --query Account --output text)"
aws s3api create-bucket \
  --bucket "$DEPLOY_BUCKET" \
  --region "$AWS_REGION" \
  $([ "$AWS_REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$AWS_REGION" || true) \
  2>/dev/null || true

cd "$(dirname "$0")/.."

echo "==> Building SAM application"
sam build --template infrastructure/template.yaml

echo "==> Deploying SAM stack"
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" \
  --s3-bucket "$DEPLOY_BUCKET" \
  --s3-prefix "rally-analysis-app" \
  --capabilities CAPABILITY_IAM \
  --region "$AWS_REGION" \
  --parameter-overrides \
    RallyApiKey="$RALLY_API_KEY" \
    RallyWorkspace="$RALLY_WORKSPACE" \
    AnthropicApiKey="$ANTHROPIC_API_KEY" \
    Environment="$ENVIRONMENT" \
  --no-fail-on-empty-changeset

# Retrieve stack outputs
echo "==> Fetching stack outputs"
CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
  --output text)

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayURL`].OutputValue' \
  --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

# Build and deploy frontend
echo "==> Building frontend"
cd frontend
cat > .env.production << EOF
VITE_API_URL=${API_URL}
VITE_USE_MOCK=false
EOF
npm ci
npm run build

echo "==> Uploading frontend to S3"
aws s3 sync dist/ "s3://${FRONTEND_BUCKET}/" \
  --delete \
  --region "$AWS_REGION" \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html "s3://${FRONTEND_BUCKET}/index.html" \
  --region "$AWS_REGION" \
  --cache-control "no-cache,no-store,must-revalidate"

echo ""
echo "=========================================="
echo " Deployment complete!"
echo "=========================================="
echo " App URL:     $CF_URL"
echo " API URL:     $API_URL"
echo " S3 Bucket:   $FRONTEND_BUCKET"
echo "=========================================="
