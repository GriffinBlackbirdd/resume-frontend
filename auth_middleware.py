from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from auth_service import AuthService

# HTTP Bearer token security
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get the current authenticated user.
    This function will be used to protect routes that require authentication.
    """
    try:
        # Extract token from Authorization header
        token = credentials.credentials
        
        # Verify and decode the token
        payload = AuthService.verify_token(token)
        
        # Extract user information from token
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        full_name: str = payload.get("full_name")
        
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Return user information
        return {
            "id": user_id,
            "email": email,
            "full_name": full_name
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions from AuthService.verify_token
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any] | None:
    """
    Optional dependency to get the current user.
    Returns None if no token provided or token is invalid.
    Useful for endpoints that work with or without authentication.
    """
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None