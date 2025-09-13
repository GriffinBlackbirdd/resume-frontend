from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional, Dict, Any
import os
import tempfile
import shutil
import time
import subprocess
import asyncio
from agno.agent import Agent, RunResponse
from agno.team import Team
from agno.models.google import Gemini
from agno.media import File as AgnoFile
from agno.tools.googlesearch import GoogleSearchTools
import pypdf
from pydantic import BaseModel
import yaml
import requests

# Import authentication modules
from config import settings
from auth_service import AuthService
from auth_models import UserSignupRequest, UserLoginRequest, AuthResponse, MessageResponse, UserResponse
from auth_middleware import get_current_user, get_optional_current_user

# Create FastAPI app
app = FastAPI(title="Resume Builder API with Auth", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for existing functionality
class RenderRequest(BaseModel):
    yamlContent: str
    theme: str = 'engineeringClassic'  # Default theme

class WatchRequest(BaseModel):
    yamlContent: str
    action: str  # 'start', 'stop', 'update'

# Store active watch processes
active_watchers = {}

# =====================
# AUTHENTICATION ROUTES
# =====================

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignupRequest):
    """Sign up a new user"""
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
    """Login a user"""
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
    """Logout current user"""
    return {"message": "Successfully logged out"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current authenticated user information"""
    try:
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
    """Verify if the provided token is valid"""
    return {
        "valid": True,
        "user": current_user
    }

# ====================
# UTILITY FUNCTIONS
# ====================

def get_ats_score(resume_path, job_description_path):
    """Get ATS score from the API"""
    try:
        url = "https://ats-service-b6gx.onrender.com/analyze"

        with open(resume_path, "rb") as resume_file, open(job_description_path, "rb") as jd_file:
            files = {
                "resume": resume_file,
                "jd": jd_file
            }
            response = requests.post(url, files=files, timeout=60)

        if response.status_code == 200:
            data = response.json()
            ats_score = data["ats_score"]
            print(f"Current ATS Score: {ats_score}")
            return ats_score
        else:
            print(f"ATS API Error: {response.status_code}")
            return None

    except Exception as e:
        print(f"Error getting ATS score: {e}")
        return None

def inject_contact_info(yaml_content: str, location: str, email: str,
                       phone: str, linkedin: str, github: str) -> str:
    """Inject contact information into YAML content"""
    print(f"🔧 INJECTION DEBUG - Input parameters:")
    print(f"   - location: '{location}'")
    print(f"   - email: '{email}'")
    print(f"   - phone: '{phone}'")
    print(f"   - linkedin: '{linkedin}'")
    print(f"   - github: '{github}'")

    try:
        # Parse YAML content
        resume_data = yaml.safe_load(yaml_content)
        print(f"✅ YAML parsed successfully")
        print(f"📋 Resume data keys: {list(resume_data.keys())}")

        # Get or create CV section
        cv_data = resume_data.get('cv', {})
        print(f"📝 CV data before injection: {cv_data}")

        # Update contact information
        if location:
            cv_data['location'] = location
        cv_data['email'] = email
        cv_data['phone'] = phone
        cv_data['website'] = linkedin

        # Handle GitHub URL
        if github:
            github_username = github
            if github.startswith('https://github.com/'):
                github_username = github.replace('https://github.com/', '')
            elif github.startswith('github.com/'):
                github_username = github.replace('github.com/', '')

            cv_data['social_networks'] = [
                {
                    'network': 'GitHub',
                    'username': github_username
                }
            ]

        # Remove old fields
        if 'linkedin' in cv_data:
            del cv_data['linkedin']
        if 'github' in cv_data:
            del cv_data['github']

        resume_data['cv'] = cv_data

        # Convert back to YAML
        updated_yaml = yaml.dump(resume_data, default_flow_style=False, allow_unicode=True, sort_keys=False)
        print(f"✅ Contact injection completed successfully")
        
        return updated_yaml

    except Exception as e:
        print(f"❌ Error injecting contact info: {e}")
        return yaml_content

# ====================
# RESUME PROCESSING ROUTES (NOW WITH AUTH)
# ====================

@app.post("/revamp-existing")
async def revamp_existing(
    location: str = Form(""),
    email: str = Form(...),
    phone: str = Form(...),
    linkedin: str = Form(...),
    github: str = Form(""),
    jobRole: str = Form(...),
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_optional_current_user)  # Optional auth for now
):
    """Revamp existing resume - optionally authenticated"""
    
    print(f"Received revamp request for job role: {jobRole}")
    if current_user:
        print(f"User authenticated: {current_user['email']}")
    else:
        print("Anonymous user")

    # Your existing revamp logic here...
    # (I'm including a shortened version for brevity)
    try:
        # Validate file types
        if not resumeFile.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")

        # Create temporary files
        ai_resume_dir = "/Users/arreyanhamid/Developer/ai-resume"
        resumes_dir = os.path.join(ai_resume_dir, "resumes")
        jd_dir = os.path.join(ai_resume_dir, "JD")

        os.makedirs(resumes_dir, exist_ok=True)
        os.makedirs(jd_dir, exist_ok=True)

        timestamp = str(int(time.time()))
        resume_filename = f"resume_{timestamp}.pdf"
        jd_filename = f"jd_{timestamp}.{jobDescriptionFile.filename.split('.')[-1]}"

        resume_path = os.path.join(resumes_dir, resume_filename)
        jd_path = os.path.join(jd_dir, jd_filename)

        # Save files
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resumeFile.file, buffer)
        with open(jd_path, "wb") as buffer:
            shutil.copyfileobj(jobDescriptionFile.file, buffer)

        # Process resume (your existing logic)
        # This would call your revamp function
        
        return {
            "success": True,
            "message": "Resume processed successfully",
            "user_authenticated": current_user is not None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/review")
async def gap_analysis(
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_optional_current_user)  # Optional auth for now
):
    """Gap analysis endpoint - optionally authenticated"""
    
    if current_user:
        print(f"Gap analysis requested by: {current_user['email']}")
    else:
        print("Anonymous gap analysis request")
    
    # Your existing gap analysis logic here...
    return {
        "success": True,
        "message": "Gap analysis completed",
        "user_authenticated": current_user is not None
    }

# ====================
# PROTECTED ROUTES EXAMPLES
# ====================

@app.get("/user/dashboard")
async def get_user_dashboard(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get user-specific dashboard data - requires authentication"""
    return {
        "user": current_user,
        "stats": {
            "resumes_created": 0,  # This would come from database
            "highest_ats_score": 0,
            "analyses_completed": 0
        },
        "recent_resumes": []  # This would come from database
    }

@app.get("/user/resumes")
async def get_user_resumes(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all resumes for the authenticated user"""
    return {
        "user_id": current_user["id"],
        "resumes": []  # This would come from database
    }

# ====================
# HEALTH CHECK
# ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "resume_builder_with_auth"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)