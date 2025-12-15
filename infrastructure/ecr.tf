# ECR Repository for backend Docker image
resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # Disable to save costs
  }

  # Lifecycle policy to keep only last 3 images
  lifecycle {
    prevent_destroy = false
  }

  tags = {
    Name = "${var.app_name}-backend-ecr"
  }
}

# ECR Lifecycle Policy - keep only last 3 images to save storage costs
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only last 3 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 3
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

