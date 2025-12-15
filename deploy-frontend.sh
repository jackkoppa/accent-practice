#!/bin/bash
set -e

# Deploy frontend to S3 and invalidate CloudFront cache
# Prerequisites:
#   - AWS CLI configured with SSO profile
#   - Node.js installed
#   - Terraform already applied (infrastructure exists)
#   - .env.deploy file with AWS_PROFILE set

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Deploying Frontend to S3/CloudFront ==="

#----------------------------------------------
# Load environment and check AWS auth
#----------------------------------------------
if [ ! -f ".env.deploy" ]; then
    echo "Error: .env.deploy file not found."
    echo "Please create it: cp .env.deploy.example .env.deploy"
    exit 1
fi

set -a
source .env.deploy
set +a

if [ -z "$AWS_PROFILE" ]; then
    echo "Error: AWS_PROFILE not set in .env.deploy"
    exit 1
fi

# Check AWS SSO authentication
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
    echo ""
    echo "AWS SSO session expired or not logged in."
    echo "Please run: aws sso login --profile $AWS_PROFILE"
    exit 1
fi

export AWS_PROFILE
echo "Using AWS Profile: $AWS_PROFILE"

# Get S3 bucket and CloudFront distribution from Terraform output
cd infrastructure
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id 2>/dev/null || echo "")
COGNITO_DOMAIN=$(terraform output -raw cognito_domain 2>/dev/null || echo "")
WEBSITE_URL=$(terraform output -raw website_url 2>/dev/null || echo "")
AWS_REGION=$(terraform output -raw 2>/dev/null aws_region || aws configure get region || echo "us-east-1")
cd ..

if [ -z "$S3_BUCKET" ]; then
    echo "Error: Could not get S3 bucket name from Terraform output."
    echo "Make sure you've run 'terraform apply' first."
    exit 1
fi

echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront Distribution: $CLOUDFRONT_ID"
echo "Website URL: $WEBSITE_URL"
echo ""

# Create .env file for the build
echo "Creating frontend .env file..."
cat > frontend/.env << EOF
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN
VITE_REDIRECT_URI=$WEBSITE_URL
VITE_AWS_REGION=$AWS_REGION
EOF

# Build frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Upload to S3
echo "Uploading to S3..."
aws s3 sync frontend/dist/ "s3://$S3_BUCKET/" \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML and JSON files with shorter cache
aws s3 sync frontend/dist/ "s3://$S3_BUCKET/" \
    --delete \
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "*.json"

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text
fi

echo ""
echo "=== Frontend Deployment Complete ==="
echo "Website: $WEBSITE_URL"
echo ""
echo "Note: CloudFront invalidation may take a few minutes to propagate."

