# Deployment Instructions

## Prerequisites

Install these tools before deploying:

| Tool | Install | Version |
|------|---------|---------|
| AWS CLI | https://aws.amazon.com/cli/ | v2+ |
| AWS SAM CLI | `pip install aws-sam-cli` | 1.0+ |
| Node.js | https://nodejs.org/ | 20+ |
| Python | https://python.org/ | 3.12+ |
| Git | https://git-scm.com/ | any |

Configure AWS credentials:
```bash
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region (us-east-1), output format (json)
```

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/saspto/rally-analysis-app.git
cd rally-analysis-app
```

---

## Step 2 — Set environment variables

```bash
export RALLY_API_KEY=your_rally_zsessionid_key
export RALLY_WORKSPACE=your_workspace_name
export ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
export AWS_REGION=us-east-1
```

> **Tip:** Add these to `~/.bashrc` or `~/.zshrc` so you don't have to re-enter them each time.

---

## Step 3 — Deploy backend (Lambda + API Gateway + S3 + CloudFront)

```bash
# Build the Lambda functions
sam build --template infrastructure/template.yaml

# Deploy to AWS (first time — creates all resources)
sam deploy \
  --stack-name rally-analysis-app-dev \
  --s3-bucket sam-deploy-dev-$(aws sts get-caller-identity --query Account --output text) \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION \
  --parameter-overrides \
    RallyApiKey="$RALLY_API_KEY" \
    RallyWorkspace="$RALLY_WORKSPACE" \
    AnthropicApiKey="$ANTHROPIC_API_KEY" \
    Environment="dev"
```

At the end you'll see output like:
```
CloudFrontURL   = https://xxxxxxxxxxxx.cloudfront.net
ApiGatewayURL   = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
FrontendBucket  = rally-frontend-dev-123456789012
```

Save these values — you'll need them in Step 4.

---

## Step 4 — Build and deploy frontend

```bash
cd frontend

# Set the API URL from Step 3 output
cat > .env.production << EOF
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
VITE_USE_MOCK=false
EOF

# Install dependencies and build
npm install
npm run build

# Upload to S3 (replace bucket name with value from Step 3)
FRONTEND_BUCKET=rally-frontend-dev-$(aws sts get-caller-identity --query Account --output text)

aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$FRONTEND_BUCKET/index.html \
  --cache-control "no-cache,no-store,must-revalidate"

cd ..
```

---

## Step 5 — Open the app

Use the **CloudFrontURL** from Step 3:
```
https://xxxxxxxxxxxx.cloudfront.net
```

> CloudFront may take 2–5 minutes to propagate after the first deploy. If you see an error, wait a moment and refresh.

---

## Redeploying after code changes

### Backend changes only (Lambda code):
```bash
sam build --template infrastructure/template.yaml

sam deploy \
  --stack-name rally-analysis-app-dev \
  --s3-bucket sam-deploy-dev-$(aws sts get-caller-identity --query Account --output text) \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION \
  --parameter-overrides \
    RallyApiKey="$RALLY_API_KEY" \
    RallyWorkspace="$RALLY_WORKSPACE" \
    AnthropicApiKey="$ANTHROPIC_API_KEY" \
    Environment="dev" \
  --no-fail-on-empty-changeset
```

### Frontend changes only:
```bash
cd frontend
npm run build

FRONTEND_BUCKET=rally-frontend-dev-$(aws sts get-caller-identity --query Account --output text)

aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$FRONTEND_BUCKET/index.html \
  --cache-control "no-cache,no-store,must-revalidate"
cd ..
```

### Both backend and frontend (full redeploy):
```bash
# Run Step 3, then Step 4
```

---

## Switching to a different Rally workspace

Just change the environment variables and redeploy the backend (Step 3):
```bash
export RALLY_API_KEY=new_workspace_api_key
export RALLY_WORKSPACE=new_workspace_name
# Re-run Step 3
```

No code changes needed — credentials are environment variables only.

---

## Deploy to production

Use `Environment=prod` to create a separate isolated stack:
```bash
sam build --template infrastructure/template.yaml

sam deploy \
  --stack-name rally-analysis-app-prod \
  --s3-bucket sam-deploy-prod-$(aws sts get-caller-identity --query Account --output text) \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION \
  --parameter-overrides \
    RallyApiKey="$RALLY_API_KEY" \
    RallyWorkspace="$RALLY_WORKSPACE" \
    AnthropicApiKey="$ANTHROPIC_API_KEY" \
    Environment="prod" \
  --no-fail-on-empty-changeset
```

---

## Tear down / delete all resources

```bash
# Delete the CloudFormation stack (removes Lambda, API Gateway, CloudFront, S3 buckets)
aws cloudformation delete-stack --stack-name rally-analysis-app-dev --region $AWS_REGION

# Optionally delete the SAM deploy bucket
aws s3 rb s3://sam-deploy-dev-$(aws sts get-caller-identity --query Account --output text) --force
```

---

## Current deployment (reference)

| Resource | Value |
|----------|-------|
| CloudFront URL | https://d28e9pzfl4v2ga.cloudfront.net |
| API Gateway URL | https://sognoeck1f.execute-api.us-east-1.amazonaws.com/dev |
| Frontend S3 Bucket | rally-frontend-dev-064357173439 |
| Exports S3 Bucket | rally-exports-dev-064357173439 |
| CloudFormation Stack | rally-analysis-app-dev |
| AWS Region | us-east-1 |
| AWS Account | 064357173439 |
