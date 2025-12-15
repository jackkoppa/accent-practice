"""
Lambda handler wrapper for FastAPI using Mangum.
This allows the FastAPI application to run in AWS Lambda.
"""

import os
from mangum import Mangum

# Set environment variables before importing main
# Lambda provides these via environment configuration
os.environ.setdefault("AZURE_SPEECH_KEY", "")
os.environ.setdefault("AZURE_SPEECH_REGION", "")
os.environ.setdefault("OPENAI_API_KEY", "")

from main import app

# Create the Mangum handler
# lifespan="off" is recommended for Lambda to avoid startup/shutdown issues
handler = Mangum(app, lifespan="off")

