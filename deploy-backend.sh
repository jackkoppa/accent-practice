#!/bin/bash
set -e

# Deploy backend to AWS Lambda via ECR
# Prerequisites:
#   - AWS CLI configured with SSO profile
#   - Docker running
#   - Terraform already applied (infrastructure exists)
#   - .env.deploy file with AWS_PROFILE set

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Deploying Backend to AWS Lambda ==="

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

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
AWS_REGION=$(aws configure get region --profile "$AWS_PROFILE" || echo "us-east-1")

# Get ECR repository URL from Terraform output
cd infrastructure
ECR_REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
LAMBDA_FUNCTION_NAME=$(terraform output -raw lambda_function_name 2>/dev/null || echo "")
cd ..

if [ -z "$ECR_REPO_URL" ]; then
    echo "Error: Could not get ECR repository URL from Terraform output."
    echo "Make sure you've run 'terraform apply' first."
    exit 1
fi

echo "ECR Repository: $ECR_REPO_URL"
echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "AWS Region: $AWS_REGION"
echo ""

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build Docker image
# --provenance=false prevents Docker from adding attestation manifests that Lambda doesn't support
echo "Building Docker image..."
cd backend
docker build --platform linux/amd64 --provenance=false -t accent-practice-backend .
cd ..

# Tag image for ECR
IMAGE_TAG="latest"
docker tag accent-practice-backend:latest "$ECR_REPO_URL:$IMAGE_TAG"

# Push to ECR
echo "Pushing image to ECR..."
docker push "$ECR_REPO_URL:$IMAGE_TAG"

# Update Lambda function to use new image
echo "Updating Lambda function..."
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --image-uri "$ECR_REPO_URL:$IMAGE_TAG" \
    --region "$AWS_REGION"

# Wait for update to complete
echo "Waiting for Lambda update to complete..."
aws lambda wait function-updated \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION"

echo ""
echo "=== Backend Deployment Complete ==="
echo "Lambda function '$LAMBDA_FUNCTION_NAME' updated successfully."

