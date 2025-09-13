from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client, Client
from fastapi import HTTPException, status
from config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    async def signup_user(email: str, password: str, full_name: str = None) -> Dict[str, Any]:
        """Sign up a new user using Supabase Auth"""
        try:
            # Sign up user with Supabase Auth
            response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name
                    }
                }
            })
            
            if response.user:
                # Create our JWT token with user data
                token_data = {
                    "sub": response.user.id,
                    "email": response.user.email,
                    "full_name": full_name
                }
                access_token = AuthService.create_access_token(token_data)
                
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "full_name": full_name,
                        "email_confirmed": response.user.email_confirmed_at is not None
                    }
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user"
                )
                
        except Exception as e:
            if "already registered" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Signup failed: {str(e)}"
                )
    
    @staticmethod
    async def login_user(email: str, password: str) -> Dict[str, Any]:
        """Login a user using Supabase Auth"""
        try:
            # Sign in with Supabase
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Create our JWT token
                token_data = {
                    "sub": response.user.id,
                    "email": response.user.email,
                    "full_name": response.user.user_metadata.get("full_name")
                }
                access_token = AuthService.create_access_token(token_data)
                
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "full_name": response.user.user_metadata.get("full_name"),
                        "email_confirmed": response.user.email_confirmed_at is not None
                    }
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
        except Exception as e:
            if "invalid login credentials" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Login failed: {str(e)}"
                )
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Dict[str, Any]:
        """Get user information by ID from Supabase"""
        try:
            # Get user from Supabase
            response = supabase.auth.admin.get_user_by_id(user_id)
            
            if response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": response.user.user_metadata.get("full_name"),
                    "email_confirmed": response.user.email_confirmed_at is not None,
                    "created_at": response.user.created_at
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get user: {str(e)}"
            )
    
    @staticmethod
    async def logout_user(token: str) -> Dict[str, Any]:
        """Logout user (in this implementation, we just invalidate on client side)"""
        try:
            # Verify the token is valid
            payload = AuthService.verify_token(token)
            
            # In a production app, you might want to blacklist the token
            # For now, we'll just return success and let the client handle token removal
            return {"message": "Successfully logged out"}
            
        except HTTPException:
            # Token is already invalid
            return {"message": "Successfully logged out"}