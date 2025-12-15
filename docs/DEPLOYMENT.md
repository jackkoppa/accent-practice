# Regular Deployments

For deploying code changes after initial setup is complete.

## Prerequisites

- AWS SSO profile configured (see [FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md))
- `.env.deploy` file with your `AWS_PROFILE`
- Docker running

## Deploy Commands

```bash
# Login to AWS SSO (if session expired)
aws sso login --profile YOUR_PROFILE_NAME

# Deploy everything (backend + frontend)
./deploy.sh

# Or deploy separately:
./deploy-backend.sh   # Backend only (Lambda)
./deploy-frontend.sh  # Frontend only (S3/CloudFront)
```

## What Each Script Does

### `./deploy-backend.sh`
1. Builds Docker image with `--provenance=false` (Lambda compatibility)
2. Pushes to ECR
3. Updates Lambda function

### `./deploy-frontend.sh`
1. Creates `.env` with Cognito config from Terraform outputs
2. Builds React app (`npm run build`)
3. Syncs to S3
4. Invalidates CloudFront cache

### `./deploy.sh`
Runs both backend and frontend deployments in sequence.

## Adding New Cognito Users

```bash
cd infrastructure

aws cognito-idp admin-create-user \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --desired-delivery-mediums EMAIL
```

User will receive a temporary password via email.

## Viewing Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/accentcoach-api --follow

# Or in AWS Console:
# CloudWatch > Log groups > /aws/lambda/accentcoach-api
```

## Troubleshooting

**Docker build fails:** Make sure Docker Desktop is running.

**AWS auth errors:** Run `aws sso login --profile YOUR_PROFILE_NAME`

**Lambda errors:** Check CloudWatch logs (see above).

**CloudFront still showing old content:** Wait a few minutes for cache invalidation, or check the invalidation status in AWS Console.

