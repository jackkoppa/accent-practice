#!/bin/bash
set -e

# Initial deployment script - handles the bootstrap problem where
# Lambda needs a Docker image, but ECR is created by Terraform.
#
# Run this ONCE for initial setup, then use deploy.sh for updates.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  AI Accent Coach - Initial Deployment"
echo "========================================"
echo ""
echo "This script handles first-time setup where we need to:"
echo "1. Create ECR repository (via Terraform)"
echo "2. Push Docker image to ECR"
echo "3. Create remaining infrastructure (Lambda, API Gateway, etc.)"
echo ""

#----------------------------------------------
# Load environment and check AWS auth
#----------------------------------------------
if [ ! -f ".env.deploy" ]; then
    echo "Error: .env.deploy file not found."
    echo "Please create it: cp env.deploy.example .env.deploy"
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
echo ""

#----------------------------------------------
# Check prerequisites
#----------------------------------------------
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found."
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform not found."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Error: Docker is not running. Please start Docker."
    exit 1
fi

echo "Prerequisites OK!"
echo ""

#----------------------------------------------
# Step 1: Apply Terraform to create ECR (will partially fail, that's OK)
#----------------------------------------------
echo "Step 1: Creating ECR repository..."
cd infrastructure

if [ ! -d ".terraform" ]; then
    echo "Initializing Terraform..."
    terraform init
fi

# Target just the ECR repository first
terraform apply -target=aws_ecr_repository.backend -target=aws_ecr_lifecycle_policy.backend -auto-approve

cd ..

#----------------------------------------------
# Step 2: Build and push Docker image
#----------------------------------------------
echo ""
echo "Step 2: Building and pushing Docker image..."

# Get ECR info
cd infrastructure
ECR_REPO_URL=$(terraform output -raw ecr_repository_url)
cd ..

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
AWS_REGION=$(aws configure get region --profile "$AWS_PROFILE" || echo "us-east-1")

echo "ECR Repository: $ECR_REPO_URL"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" | \
    docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build Docker image
# --provenance=false prevents Docker from adding attestation manifests that Lambda doesn't support
echo "Building Docker image (this may take a few minutes)..."
cd backend
docker build --platform linux/amd64 --provenance=false -t accent-practice-backend .
cd ..

# Tag and push
docker tag accent-practice-backend:latest "$ECR_REPO_URL:latest"

echo "Pushing to ECR..."
docker push "$ECR_REPO_URL:latest"

echo "Docker image pushed successfully!"

#----------------------------------------------
# Step 3: Apply full Terraform configuration
#----------------------------------------------
echo ""
echo "Step 3: Applying full Terraform configuration..."
echo "(This will take ~10-15 minutes for CloudFront distribution)"
echo ""

cd infrastructure
terraform apply -auto-approve
cd ..

#----------------------------------------------
# Step 4: Deploy frontend
#----------------------------------------------
echo ""
echo "Step 4: Deploying frontend..."
./deploy-frontend.sh

#----------------------------------------------
# Done!
#----------------------------------------------
echo ""
echo "========================================"
echo "  Initial Deployment Complete!"
echo "========================================"
echo ""

cd infrastructure
echo "Your app is now live at:"
echo "  $(terraform output -raw website_url)"
echo ""
echo "Cognito login portal:"
echo "  $(terraform output -raw cognito_domain)/login"
echo ""
echo "Users will receive temporary passwords via email."
echo ""
echo "For future deployments, use:"
echo "  ./deploy.sh          # Full redeploy"
echo "  ./deploy-backend.sh  # Backend only"
echo "  ./deploy-frontend.sh # Frontend only"
cd ..


