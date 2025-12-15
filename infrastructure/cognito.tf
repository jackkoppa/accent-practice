# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-users"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # Disable self-registration - users must be created by admin
  admin_create_user_config {
    allow_admin_create_user_only = true

    invite_message_template {
      email_message = "Your AI Accent Coach account has been created. Your username is {username} and temporary password is {####}. Visit https://${var.domain_name} to log in."
      email_subject = "Welcome to AI Accent Coach"
      sms_message   = "Your AI Accent Coach username is {username} and temporary password is {####}"
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Account recovery via email only
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # User attributes
  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      max_length = "2048"
      min_length = "0"
    }
  }

  # Auto-verify email
  auto_verified_attributes = ["email"]

  tags = {
    Name = "${var.app_name}-user-pool"
  }
}

# Cognito User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.app_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito User Pool Client (for frontend)
resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.app_name}-frontend"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token validity
  access_token_validity  = 1  # 1 hour
  id_token_validity      = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # OAuth settings
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  callback_urls = [
    "https://${var.domain_name}",
    "https://${var.domain_name}/callback",
    "http://localhost:5173", # Local development
    "http://localhost:5173/callback",
  ]

  logout_urls = [
    "https://${var.domain_name}",
    "http://localhost:5173",
  ]

  supported_identity_providers = ["COGNITO"]

  # Enable SRP auth flow (secure password auth)
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  # Don't generate client secret (for public client / SPA)
  generate_secret = false

  prevent_user_existence_errors = "ENABLED"
}

# Create users specified in the variable
resource "aws_cognito_user" "users" {
  for_each = toset(var.cognito_users)

  user_pool_id = aws_cognito_user_pool.main.id
  username     = each.value

  attributes = {
    email          = each.value
    email_verified = true
  }

  # User will receive temporary password via email
  desired_delivery_mediums = ["EMAIL"]
}

