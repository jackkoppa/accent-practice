variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "accent-practice"
}

variable "domain_name" {
  description = "Custom domain name for the application (e.g., accent.example.com)"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

variable "azure_speech_key" {
  description = "Azure Speech API key"
  type        = string
  sensitive   = true
}

variable "azure_speech_region" {
  description = "Azure Speech API region"
  type        = string
  default     = "eastus"
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

# Cognito user emails to create (manually managed)
variable "cognito_users" {
  description = "List of user emails to create in Cognito"
  type        = list(string)
  default     = []
}

