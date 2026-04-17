# Rally Analysis App

Export Rally (CA Agile Central) data to S3 and generate AI-powered summaries using Claude.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                     │
│                                                                      │
│  User  ──▶  CloudFront  ──▶  S3 (Frontend)                          │
│                                                                      │
│  User  ──▶  API Gateway  ──▶  Lambda: export_handler                │
│                          ──▶  Lambda: summary_handler  ──▶  Claude  │
│                          ──▶  Lambda: download_url_handler           │
│                                                                      │
│  EventBridge (daily 3pm EST)  ──▶  Lambda: export_handler           │
│                                                                      │
│  All Lambdas  ──▶  S3 (Exports bucket)                              │
│                    ├── exports/YYYY/MM/rally_export_YYYYMMDD.csv    │
│                    └── summaries/YYYY/MM/summary_YYYYMMDD.json      │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

- **Daily auto-export** — Lambda runs at 3 PM EST, exports all Features/User Stories/Tasks for current FY/Q (states: Defined, In-Progress, Completed, Accepted) to CSV in S3
- **Manual export trigger** — Button in UI to trigger on-demand export
- **AI summaries** — Claude claude-opus-4-7 generates weekly/monthly/quarterly narrative summaries from Rally data
- **Executive summary** — Concise C-suite summary with portfolio health status
- **Download options** — PDF, DOCX, Excel for all summary types
- **Mock mode** — Full UI demo without live Rally/AWS connections

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `RALLY_API_KEY` | Rally ZSESSIONID API key | Yes |
| `RALLY_WORKSPACE` | Rally workspace name | Yes |
| `EXPORT_BUCKET` | S3 bucket for exports | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |
| `AWS_REGION` | AWS region (default: us-east-1) | No |
| `VITE_API_URL` | API Gateway URL (frontend) | Yes (prod) |
| `VITE_USE_MOCK` | Use mock data (frontend) | No |

## Local Development

### Frontend (mock mode — no AWS needed)

```bash
cd frontend
cp ../.env.example .env.local
# Edit .env.local: set VITE_USE_MOCK=true
npm install
npm run dev
# Open http://localhost:5173
```

### Backend tests

```bash
cd backend
pip install -r requirements.txt pytest
pytest tests/ -v
```

### Frontend tests

```bash
cd frontend
npm install
npm test
```

## Deployment

### Prerequisites
- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`brew install aws-sam-cli`)
- Node.js 20+, Python 3.13+

### Deploy

```bash
export RALLY_API_KEY=your_rally_api_key
export RALLY_WORKSPACE=your_workspace_name
export ANTHROPIC_API_KEY=sk-ant-your_key

# Deploy to dev
./infrastructure/deploy.sh dev

# Deploy to prod
./infrastructure/deploy.sh prod
```

The script will:
1. Build and deploy the SAM stack (Lambda, API Gateway, S3, CloudFront)
2. Build the React frontend with the correct API URL
3. Upload frontend to S3
4. Print the CloudFront URL

### Switching workspaces

Update the `RALLY_API_KEY` and `RALLY_WORKSPACE` environment variables and redeploy. No code changes needed.

## Mock Data

Demo CSV: `mock-data/rally_export_mock.csv`  
Demo summary: `mock-data/summary_mock.json`

Set `VITE_USE_MOCK=true` in `.env.local` to use these in the frontend without any AWS connection.

## Fiscal Year Logic

- FY starts **February 1**
- Q1: Feb–Apr | Q2: May–Jul | Q3: Aug–Oct | Q4: Nov–Jan
- Exports fetch all items created within the current FY quarter
