from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from typing import Dict, Any

# Import our authentication modules
from config import settings
from auth_service import AuthService
from auth_models import UserSignupRequest, UserLoginRequest, AuthResponse, MessageResponse, UserResponse
from auth_middleware import get_current_user, get_optional_current_user

# Create FastAPI app
app = FastAPI(title="Resume Builder Auth API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP Bearer for swagger docs
security = HTTPBearer()

# Authentication Routes
@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignupRequest):
    """
    Sign up a new user
    """
    try:
        result = await AuthService.signup_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )

@app.post("/auth/login", response_model=AuthResponse)
async def login(user_data: UserLoginRequest):
    """
    Login a user
    """
    try:
        result = await AuthService.login_user(
            email=user_data.email,
            password=user_data.password
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@app.post("/auth/logout", response_model=MessageResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Logout current user
    """
    try:
        # In a JWT-based system, logout is typically handled client-side
        # by removing the token. We could implement token blacklisting here if needed.
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    try:
        # Get additional user data from Supabase if needed
        user_data = await AuthService.get_user_by_id(current_user["id"])
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )

@app.get("/auth/verify-token")
async def verify_token(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Verify if the provided token is valid
    Returns user info if valid, 401 if invalid
    """
    return {
        "valid": True,
        "user": current_user
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth"}

# Protected route example
@app.get("/protected")
async def protected_route(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Example protected route that requires authentication
    """
    return {
        "message": f"Hello {current_user['email']}, this is a protected route!",
        "user": current_user
    }

# Optional authentication route example
@app.get("/optional-auth")
async def optional_auth_route(current_user: Dict[str, Any] = Depends(get_optional_current_user)):
    """
    Example route that works with or without authentication
    """
    if current_user:
        return {
            "message": f"Hello {current_user['email']}, you are authenticated!",
            "authenticated": True,
            "user": current_user
        }
    else:
        return {
            "message": "Hello anonymous user!",
            "authenticated": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Using port 8001 to avoid conflict