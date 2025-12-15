# First Time Setup

Complete guide for deploying AI Accent Coach to a new AWS account.

## Prerequisites

Install these tools locally:
- [AWS CLI](https://aws.amazon.com/cli/)
- [Terraform](https://www.terraform.io/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 18+](https://nodejs.org/)

## Step 1: AWS Account & SSO Setup

1. Create an AWS account (or use existing)
2. Set up IAM Identity Center (SSO) with admin permissions
3. Configure local SSO profile:

```bash
aws configure sso --profile your-profile-name
# Follow prompts for SSO start URL, region, account, role
```

4. Create `.env.deploy` in project root:
```bash
cp env.deploy.example .env.deploy
# Edit and set: AWS_PROFILE=your-profile-name
```

## Step 2: Domain Setup

You need a domain with DNS managed by Route53.

### Option A: Subdomain delegation (if domain is elsewhere)

1. Create hosted zone for your subdomain:
```bash
export AWS_PROFILE=your-profile-name
aws route53 create-hosted-zone \
  --name yoursubdomain.yourdomain.com \
  --caller-reference "accent-$(date +%s)"
```

2. Get the 4 NS records:
```bash
aws route53 get-hosted-zone --id YOUR_ZONE_ID \
  --query 'DelegationSet.NameServers'
```

3. Add these NS records at your domain registrar pointing to the subdomain.

### Option B: Domain in Route53

If your domain is already in Route53, just note the hosted zone ID.

## Step 3: API Keys

<details>
<summary>Azure Speech Services Setup</summary>

1. Go to [Azure Portal](https://portal.azure.com)
2. Create resource → "Speech" (under Cognitive Services)
3. Select pricing tier (Free tier: 5 hours/month)
4. After creation, go to "Keys and Endpoint"
5. Copy **Key 1** and **Region**

</details>

<details>
<summary>OpenAI API Setup</summary>

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create new secret key
4. Add billing/credits to your account
5. Copy the key (starts with `sk-`)

</details>

## Step 4: Terraform Configuration

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
domain_name     = "yoursubdomain.yourdomain.com"
route53_zone_id = "Z0123456789ABC"  # From Step 2

azure_speech_key    = "your-azure-key"
azure_speech_region = "eastus"
openai_api_key      = "sk-your-openai-key"

cognito_users = [
  "user1@example.com",
  "user2@example.com",
]
```

## Step 5: Deploy

```bash
# Make sure you're logged in
aws sso login --profile your-profile-name

# Run initial deployment (handles bootstrap)
cd /path/to/accent-practice
./deploy-init.sh
```

This takes ~15-20 minutes (CloudFront distribution creation).

## Step 6: Verify

1. Visit your domain (e.g., `https://yoursubdomain.yourdomain.com`)
2. You should see the login screen
3. Check email for Cognito temporary password
4. Log in and test recording

## Cost Estimate

For 3-4 users with light usage:

| Service | Monthly Cost |
|---------|-------------|
| Route53 | ~$0.50 |
| Everything else | ~$0 (free tier) |

**Total: ~$0.50-2/month**

## Security Notes

- Only invited users can access (no self-registration)
- All API endpoints require JWT authentication
- API keys are stored in Lambda environment variables (encrypted)
- Terraform state contains secrets - keep `terraform.tfvars` and `.tfstate` files private

## Deployment Account Reference

For the `jackkoppa/accent-practice` deployment, account names and non-sensitive configuration are stored in: https://github.com/jackkoppa/accent-practice-private

## Next Steps

After initial setup, use [DEPLOYMENT.md](DEPLOYMENT.md) for regular deployments.

