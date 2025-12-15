#!/bin/bash
set -e

# Full deployment script - deploys both backend and frontend
# Prerequisites:
#   - AWS CLI configured with SSO profile
#   - Docker running
#   - Node.js installed
#   - Terraform initialized
#   - .env.deploy file with AWS_PROFILE set

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  AI Accent Coach - Full Deployment"
echo "========================================"
echo ""

#----------------------------------------------
# Load environment variables from .env.deploy
#----------------------------------------------
if [ ! -f ".env.deploy" ]; then
    echo "Error: .env.deploy file not found."
    echo ""
    echo "Please create it from the example:"
    echo "  cp env.deploy.example .env.deploy"
    echo ""
    echo "Then edit .env.deploy and set your AWS_PROFILE."
    exit 1
fi

# Source the .env.deploy file
set -a
source .env.deploy
set +a

if [ -z "$AWS_PROFILE" ]; then
    echo "Error: AWS_PROFILE not set in .env.deploy"
    exit 1
fi

echo "Using AWS Profile: $AWS_PROFILE"
echo ""

#----------------------------------------------
# Check AWS SSO Authentication
#----------------------------------------------
echo "Checking AWS SSO authentication..."

if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
    echo ""
    echo "AWS SSO session expired or not logged in."
    echo ""
    echo "Please run the following command to login:"
    echo ""
    echo "  aws sso login --profile $AWS_PROFILE"
    echo ""
    echo "Then re-run this deploy script."
    exit 1
fi

# Display current identity
echo "Authenticated as:"
aws sts get-caller-identity --profile "$AWS_PROFILE" --output table
echo ""

# Export for child processes (Terraform, AWS CLI calls)
export AWS_PROFILE

#----------------------------------------------
# Check other prerequisites
#----------------------------------------------
echo "Checking other prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not found. Please install it first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found. Please install it first."
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform not found. Please install it first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install it first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Terraform state exists
if [ ! -f "infrastructure/terraform.tfstate" ] && [ ! -d "infrastructure/.terraform" ]; then
    echo "Error: Terraform not initialized. Run the following first:"
    echo "  cd infrastructure"
    echo "  terraform init"
    echo "  terraform apply"
    exit 1
fi

echo "Prerequisites OK!"
echo ""

# Deploy backend first
echo "Step 1/2: Deploying backend..."
echo "----------------------------------------"
./deploy-backend.sh
echo ""

# Deploy frontend
echo "Step 2/2: Deploying frontend..."
echo "----------------------------------------"
./deploy-frontend.sh
echo ""

echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""

# Print summary
cd infrastructure
echo "Resources:"
echo "  Website URL: $(terraform output -raw website_url 2>/dev/null || echo 'N/A')"
echo "  API URL: $(terraform output -raw api_url 2>/dev/null || echo 'N/A')"
echo ""
echo "Cognito Users:"
echo "  Login at: $(terraform output -raw cognito_domain 2>/dev/null || echo 'N/A')/login"
echo "  User Pool: $(terraform output -raw cognito_user_pool_id 2>/dev/null || echo 'N/A')"
echo ""
echo "To add a new user:"
echo "  aws cognito-idp admin-create-user \\"
echo "    --user-pool-id \$(terraform output -raw cognito_user_pool_id) \\"
echo "    --username user@example.com \\"
echo "    --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \\"
echo "    --desired-delivery-mediums EMAIL"
cd ..

