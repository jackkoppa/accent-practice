# Infrastructure Setup

This directory contains Terraform configuration for deploying the AI Accent Coach to AWS.

## Prerequisites

1. **AWS CLI** - Install and configure with your credentials
   ```bash
   brew install awscli  # macOS
   aws configure
   ```

2. **Terraform** - Install Terraform CLI
   ```bash
   brew install terraform  # macOS
   ```

3. **Docker** - Required for building Lambda container image

4. **Route53 Hosted Zone** - You need a domain registered and a hosted zone created in Route53
   - Go to AWS Route53 console
   - Create a hosted zone for your domain
   - Note the Zone ID

## Initial Setup

### 1. Configure Variables

Copy the example variables file and fill in your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your configuration:
- `domain_name` - Your custom domain (e.g., `accent.yourdomain.com`)
- `route53_zone_id` - Your Route53 hosted zone ID
- `azure_speech_key` - Azure Speech API key
- `azure_speech_region` - Azure Speech API region (e.g., `eastus`)
- `openai_api_key` - OpenAI API key
- `cognito_users` - List of email addresses for initial users

### 2. Initialize Terraform

```bash
cd infrastructure
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

This shows you what resources will be created.

### 4. Apply Infrastructure

```bash
terraform apply
```

Type `yes` to confirm. This creates:
- S3 bucket for frontend
- CloudFront distribution
- ACM certificate (auto-validated via DNS)
- ECR repository for backend Docker image
- Lambda function
- API Gateway with Cognito authorizer
- Cognito User Pool with hosted UI
- Route53 DNS records

**Note:** First deployment takes 10-15 minutes due to CloudFront distribution and ACM certificate validation.

### 5. Deploy Application Code

After Terraform creates the infrastructure, deploy the application:

```bash
cd ..  # Back to project root
./deploy.sh
```

Or deploy backend and frontend separately:
```bash
./deploy-backend.sh
./deploy-frontend.sh
```

## Managing Users

Users are created via Cognito. Terraform creates initial users from `cognito_users` variable.

### Add a New User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --desired-delivery-mediums EMAIL
```

The user will receive a temporary password via email.

### Delete a User

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username user@example.com
```

### Reset User Password

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username user@example.com \
  --password "NewTempPassword123!" \
  --permanent
```

## Outputs

After applying, view important outputs:

```bash
terraform output
```

Key outputs:
- `website_url` - The public URL of your app
- `api_url` - API Gateway URL (used internally)
- `cognito_domain` - Cognito hosted UI URL
- `cloudfront_distribution_id` - For cache invalidation
- `s3_bucket_name` - For frontend uploads

## Cost Estimate

For 3-4 users with light usage:

| Service | Monthly Cost |
|---------|-------------|
| Route53 | ~$0.50 |
| CloudFront | ~$0 (free tier) |
| S3 | ~$0 (free tier) |
| Lambda | ~$0 (free tier) |
| API Gateway | ~$0 (free tier) |
| Cognito | ~$0 (free tier) |
| ECR | ~$0 (free tier) |

**Total: ~$0.50-2/month** (mainly Route53 DNS)

## Updating

### Update Backend Code

```bash
./deploy-backend.sh
```

### Update Frontend Code

```bash
./deploy-frontend.sh
```

### Update Infrastructure

Edit the Terraform files, then:
```bash
cd infrastructure
terraform plan    # Review changes
terraform apply   # Apply changes
```

## Destroying

To tear down all AWS resources:

```bash
cd infrastructure
terraform destroy
```

**Warning:** This deletes everything including the S3 bucket contents.

## Troubleshooting

### Lambda Cold Starts

First request after inactivity may take 5-10 seconds. This is normal for Lambda with container images.

### Certificate Validation Taking Too Long

If ACM certificate validation is stuck:
1. Check Route53 for the CNAME record
2. Wait up to 30 minutes for DNS propagation
3. Check AWS Certificate Manager console for status

### CORS Errors

CORS is handled by CloudFront and API Gateway. If you see CORS errors:
1. Check CloudFront is routing `/api/*` to API Gateway
2. Verify API Gateway CORS settings in Terraform

### Auth Issues

1. Check Cognito user pool client settings
2. Verify callback URLs include your domain
3. Check browser console for specific errors

