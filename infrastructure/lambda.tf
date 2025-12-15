# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function
resource "aws_lambda_function" "backend" {
  function_name = "${var.app_name}-api"
  role          = aws_iam_role.lambda.arn

  package_type = "Image"
  image_uri    = "${aws_ecr_repository.backend.repository_url}:latest"

  # Memory and timeout settings
  memory_size = 1024 # 1GB - needed for audio processing
  timeout     = 60   # 60 seconds - audio analysis can take time

  # Environment variables
  environment {
    variables = {
      AZURE_SPEECH_KEY    = var.azure_speech_key
      AZURE_SPEECH_REGION = var.azure_speech_region
      OPENAI_API_KEY      = var.openai_api_key
    }
  }

  # Ensure ECR image exists before creating Lambda
  depends_on = [aws_ecr_repository.backend]

  tags = {
    Name = "${var.app_name}-lambda"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.app_name}-api"
  retention_in_days = 7 # Keep logs for 7 days to minimize costs

  tags = {
    Name = "${var.app_name}-lambda-logs"
  }
}

