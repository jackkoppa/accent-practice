# Agent Instructions

Guidelines for AI agents and developers working in this repository.

## Architecture Overview

Review the architecture diagram in [README.md](README.md) before making changes. Update the diagram if you modify:
- AWS infrastructure (Terraform files)
- Authentication flow
- API endpoints or data flow
- New external service integrations

## Key Principles

1. **Security first**: All API endpoints must require authentication. Unauthenticated users must not be able to trigger Azure/OpenAI API calls.

2. **Cost consciousness**: This is a personal project with 3-4 users. Avoid solutions that incur ongoing costs. Prefer AWS free tier services.

3. **Simplicity**: Don't over-engineer. No need for scalability beyond current users.

## File Organization

```
backend/          # Python FastAPI - all backend code here
frontend/src/     # React TypeScript - all frontend code here  
infrastructure/   # Terraform only - AWS resource definitions
docs/             # Markdown documentation
```

## Making Changes

### Backend changes
1. Modify files in `backend/`
2. Test locally: `uvicorn main:app --reload`
3. Deploy: `./deploy-backend.sh`

### Frontend changes
1. Modify files in `frontend/src/`
2. Test locally: `npm run dev`
3. Deploy: `./deploy-frontend.sh`

### Infrastructure changes
1. Modify `.tf` files in `infrastructure/`
2. Run `terraform plan` to preview
3. Run `terraform apply` to deploy
4. May need to redeploy backend/frontend after

## Environment Files (Not Committed)

- `.env.deploy` - AWS profile name
- `backend/.env` - API keys for local dev
- `infrastructure/terraform.tfvars` - Terraform variables with secrets

## Testing

Test locally before deploying. The app works in demo mode without API keys.

## Deployment

- First time: `./deploy-init.sh`
- Regular updates: `./deploy.sh` (or individual scripts)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

