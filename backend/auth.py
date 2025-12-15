"""
JWT authentication middleware for FastAPI.

In production with API Gateway + Cognito authorizer, JWT validation happens at the API Gateway level.
This middleware provides:
1. Defense in depth (optional additional validation)
2. User context extraction from JWT claims
3. Local development support

For Lambda behind API Gateway, the authorizer validates the JWT before the request reaches Lambda,
so the backend can trust requests that make it through.
"""

import os
import json
import base64
from typing import Optional
from functools import wraps
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# Check if we're running in Lambda (API Gateway handles auth)
IS_LAMBDA = bool(os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

# Check if auth should be enforced locally
ENFORCE_AUTH_LOCALLY = os.environ.get("ENFORCE_AUTH", "false").lower() == "true"


def decode_jwt_payload(token: str) -> dict:
    """
    Decode JWT payload without verification.
    Verification is handled by API Gateway's Cognito authorizer in production.
    """
    try:
        # JWT format: header.payload.signature
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        
        # Decode payload (middle part)
        payload = parts[1]
        # Add padding if needed
        payload += "=" * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception:
        return {}


class AuthUser:
    """Represents an authenticated user."""
    def __init__(self, sub: str, email: str = None, claims: dict = None):
        self.sub = sub  # Cognito user ID
        self.email = email
        self.claims = claims or {}


def get_current_user(request: Request) -> Optional[AuthUser]:
    """
    Extract user information from the request.
    
    In Lambda with API Gateway:
    - JWT is validated by API Gateway Cognito authorizer
    - User info may be in requestContext (from authorizer)
    - We can also extract from Authorization header
    
    In local development:
    - We decode the JWT (if present) but don't verify signature
    - This allows testing the auth flow without Cognito
    """
    # Try to get user from API Gateway authorizer context (Lambda)
    if IS_LAMBDA:
        # API Gateway v2 (HTTP API) puts authorizer claims in requestContext
        event = request.scope.get("aws.event", {})
        authorizer = event.get("requestContext", {}).get("authorizer", {})
        jwt_claims = authorizer.get("jwt", {}).get("claims", {})
        
        if jwt_claims:
            return AuthUser(
                sub=jwt_claims.get("sub", ""),
                email=jwt_claims.get("email"),
                claims=jwt_claims
            )
    
    # Fall back to extracting from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        payload = decode_jwt_payload(token)
        if payload:
            return AuthUser(
                sub=payload.get("sub", ""),
                email=payload.get("email"),
                claims=payload
            )
    
    return None


def require_auth(func):
    """
    Decorator to require authentication for an endpoint.
    
    In production (Lambda), API Gateway handles auth, so this is mainly
    for local development and defense in depth.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Find the request object in args/kwargs
        request = kwargs.get("request")
        if request is None:
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
        
        if request is None:
            raise HTTPException(status_code=500, detail="Request not found")
        
        # In Lambda, trust API Gateway authorizer
        if IS_LAMBDA:
            return await func(*args, **kwargs)
        
        # In local dev, check if auth enforcement is enabled
        if not ENFORCE_AUTH_LOCALLY:
            return await func(*args, **kwargs)
        
        # Validate auth header exists
        user = get_current_user(request)
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )
        
        return await func(*args, **kwargs)
    
    return wrapper

