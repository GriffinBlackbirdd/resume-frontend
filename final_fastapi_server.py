from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import tempfile
import shutil
import time
import subprocess
import asyncio
from typing import Optional, Dict, Any
from typing import Iterator
from agno.agent import Agent, RunResponse
from agno.team import Team
from agno.models.google import Gemini
from agno.media import File as AgnoFile
from agno.tools.googlesearch import GoogleSearchTools
import pypdf
from pydantic import BaseModel, EmailStr
import yaml
import json
import requests

# Authentication imports
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Resume Builder API with Auth", version="2.0.0")

# Authentication Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://buvnzjfspowdttkgohtb.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dm56amZzcG93ZHR0a2dvaHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODcxODMsImV4cCI6MjA3MjY2MzE4M30.QtTmwQ7-T16Vw9lqqxphi5yBOM0_oy8ep93KE5GzhMI")
# Service role key for database operations (bypasses RLS)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dm56amZzcG93ZHR0a2dvaHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA4NzE4MywiZXhwIjoyMDcyNjYzMTgzfQ.4Q-h3Gt1ja14lwCMiPxEe8oymO-lnrxC5JEC5ckwV_Y")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 hours

# Initialize Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)  # For auth operations
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)  # For database operations (bypasses RLS)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for auth
security = HTTPBearer()

# Authentication Models
class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    email_confirmed: bool = False

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class MessageResponse(BaseModel):
    message: str

# Resume Models
class RenderRequest(BaseModel):
    yamlContent: str
    theme: str = 'engineeringClassic'  # Default theme

class WatchRequest(BaseModel):
    yamlContent: str
    action: str  # 'start', 'stop', 'update'

# Database Models
class UserProfileRequest(BaseModel):
    location: Optional[str] = None
    email: str
    phone: str
    linkedin: str
    github: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    location: Optional[str] = None
    email: str
    phone: str
    linkedin: str
    github: Optional[str] = None
    created_at: str
    updated_at: str

class ResumeProjectResponse(BaseModel):
    id: str
    user_id: str
    job_role: str
    target_company: Optional[str] = None
    status: str
    ats_score: Optional[float] = None
    yaml_content: Optional[str] = None
    has_gap_analysis: Optional[bool] = None
    gap_analysis_files: Optional[list[str]] = None
    created_at: str
    updated_at: str
    test_field: Optional[str] = None

class DashboardStatsResponse(BaseModel):
    highest_ats_score: float
    highest_project_id: Optional[str] = None
    ats_change: str
    resumes_created: int
    resumes_change: str

class ATSByJobRoleResponse(BaseModel):
    job_role: str
    target_company: Optional[str] = None
    ats_score: float
    project_id: str

class DashboardResponse(BaseModel):
    stats: DashboardStatsResponse
    recent_projects: list[ResumeProjectResponse]
    ats_by_job_role: list[ATSByJobRoleResponse]

class PaginatedDashboardResponse(BaseModel):
    stats: DashboardStatsResponse
    recent_projects: list[ResumeProjectResponse]
    ats_by_job_role: list[ATSByJobRoleResponse]
    total_projects: int
    current_page: int
    total_pages: int
    projects_per_page: int

# Store active watch processes
active_watchers = {}

# =====================
# DATABASE HELPER FUNCTIONS
# =====================

async def get_or_create_user_profile(user_id: str, profile_data: UserProfileRequest = None) -> dict:
    """Get existing user profile or create new one"""
    try:
        # Try to get existing profile
        profile_response = supabase_admin.table("user_profiles").select("*").eq("user_id", user_id).execute()

        if profile_response.data:
            return profile_response.data[0]

        # Create new profile if doesn't exist and profile_data provided
        if profile_data:
            new_profile = {
                "user_id": user_id,
                "location": profile_data.location,
                "email": profile_data.email,
                "phone": profile_data.phone,
                "linkedin": profile_data.linkedin,
                "github": profile_data.github
            }

            create_response = supabase_admin.table("user_profiles").insert(new_profile).execute()
            if create_response.data:
                return create_response.data[0]

        return None
    except Exception as e:
        print(f"Error with user profile: {e}")
        return None

async def create_resume_project(user_id: str, job_role: str, target_company: str = None) -> dict:
    """Create a new resume project"""
    try:
        new_project = {
            "user_id": user_id,
            "job_role": job_role,
            "target_company": target_company,
            "status": "personal_info"
        }

        response = supabase_admin.table("resume_projects").insert(new_project).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error creating resume project: {e}")
        return None

async def update_project_status(project_id: str, status: str) -> bool:
    """Update project status"""
    try:
        response = supabase_admin.table("resume_projects").update({"status": status}).eq("id", project_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error updating project status: {e}")
        return False

async def update_project_gap_analysis(project_id: str, has_gap_analysis: bool) -> bool:
    """Update project gap analysis status"""
    try:
        response = supabase_admin.table("resume_projects").update({"has_gap_analysis": has_gap_analysis}).eq("id", project_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error updating project gap analysis status: {e}")
        return False

async def save_project_files(project_id: str, file_entries: list) -> bool:
    """Save multiple file entries for a project"""
    try:
        response = supabase_admin.table("project_files").insert(file_entries).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error saving project files: {e}")
        return False

async def save_project_results(project_id: str, yaml_content: str, ats_score: int = None, ats_details: dict = None) -> bool:
    """Save project results (YAML content and ATS score)"""
    try:
        result_data = {
            "project_id": project_id,
            "yaml_content": yaml_content,
            "ats_score": ats_score,
            "ats_analysis_details": ats_details,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # First try to update existing record
        update_response = supabase_admin.table("project_results").update(result_data).eq("project_id", project_id).execute()

        if update_response.data:
            print(f"✅ Updated existing project results for project {project_id}")
            return True
        else:
            # If no existing record, insert new one
            insert_response = supabase_admin.table("project_results").insert(result_data).execute()
            if insert_response.data:
                print(f"✅ Inserted new project results for project {project_id}")
                return True
            else:
                print(f"❌ Failed to insert project results for project {project_id}")
                return False

    except Exception as e:
        print(f"Error saving project results: {e}")
        return False

async def save_gap_analysis(project_id: str, analysis_content: str, missing_skills: list = None, recommendations: dict = None) -> bool:
    """Save gap analysis results"""
    try:
        gap_data = {
            "project_id": project_id,
            "analysis_content": analysis_content,
            "missing_skills": missing_skills,
            "recommendations": recommendations
        }

        response = supabase_admin.table("gap_analyses").insert(gap_data).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error saving gap analysis: {e}")
        return False

async def get_user_dashboard_data(user_id: str, page: int = 1, projects_per_page: int = 5) -> dict:
    """Get dashboard data for a user"""
    try:
        # Get user's projects with results
        projects_response = supabase_admin.table("resume_projects").select("""
            *,
            project_results(ats_score, yaml_content, generated_at)
        """).eq("user_id", user_id).order("created_at", desc=True).execute()

        projects = projects_response.data if projects_response.data else []

        # Debug: Log what we get from database
        print(f"🔍 DASHBOARD: Retrieved {len(projects)} projects from database")
        for p in projects[:2]:  # Log first 2 projects only to avoid spam
            print(f"🔍 PROJECT DB: {p.get('id')} - has_gap_analysis: {p.get('has_gap_analysis')} (type: {type(p.get('has_gap_analysis'))})")

        # Calculate stats with better null checking
        ats_scores = []
        highest_project_id = None
        for p in projects:
            project_results = p.get("project_results")
            if project_results and isinstance(project_results, dict):
                ats_score = project_results.get("ats_score")
                if ats_score and isinstance(ats_score, (int, float)):
                    ats_scores.append((ats_score, p.get("id")))

        if ats_scores:
            # Find the project with highest ATS score
            highest_ats, highest_project_id = max(ats_scores, key=lambda x: x[0])
        else:
            highest_ats = 0

        # Calculate pagination
        total_projects = len(projects)
        total_pages = (total_projects + projects_per_page - 1) // projects_per_page
        start_index = (page - 1) * projects_per_page
        end_index = start_index + projects_per_page

        # Format projects for response with pagination
        formatted_projects = []
        paginated_projects = projects[start_index:end_index]
        for project in paginated_projects:
            project_result = project.get("project_results", {}) or {}

            formatted_project = {
                "id": project.get("id", ""),
                "user_id": project.get("user_id", ""),
                "job_role": project.get("job_role", ""),
                "target_company": project.get("target_company"),
                "status": project.get("status", ""),
                "ats_score": project_result.get("ats_score") if isinstance(project_result, dict) else None,
                "yaml_content": project_result.get("yaml_content") if isinstance(project_result, dict) else None,
                "has_gap_analysis": project.get("has_gap_analysis", False),
                "gap_analysis_files": project.get("gap_analysis_files", []),
                "created_at": project.get("created_at", ""),
                "updated_at": project.get("updated_at", ""),
                "test_field": "BACKEND_UPDATED"  # Test to verify backend is running updated code
            }

            # Debug: Log what we're sending to frontend
            if project.get("id"):
                print(f"🔍 SENDING TO FRONTEND: {project.get('id')} - has_gap_analysis: {formatted_project['has_gap_analysis']} (type: {type(formatted_project['has_gap_analysis'])})")

            formatted_projects.append(formatted_project)

        # Calculate completed resumes with null checking
        completed_resumes = len([p for p in projects if p.get('status') == 'completed'])

        # Group ATS scores by job role + company combination for current page projects only
        job_role_scores = {}
        for p in paginated_projects:
            job_role = p.get("job_role")
            target_company = p.get("target_company")
            print(f"🔍 DASHBOARD DEBUG: Processing project {p.get('id')} - job_role: '{job_role}', target_company: '{target_company}'")
            
            if job_role:
                # Create unique key combining job_role and company
                role_company_key = f"{job_role}||{target_company or 'No Company'}"
                
                project_results = p.get("project_results")
                print(f"🔍 DASHBOARD DEBUG: Project results type: {type(project_results)}, value: {project_results}")
                
                if project_results and isinstance(project_results, dict):
                    ats_score = project_results.get("ats_score")
                    print(f"🔍 DASHBOARD DEBUG: ATS Score: {ats_score} (type: {type(ats_score)})")
                    
                    if ats_score and isinstance(ats_score, (int, float)):
                        print(f"🔍 DASHBOARD DEBUG: Adding to job_role_scores: key='{role_company_key}', score={ats_score}")
                        # Only update if this is a newer project or higher score for this role+company combination
                        if role_company_key not in job_role_scores or ats_score > job_role_scores[role_company_key]["score"]:
                            job_role_scores[role_company_key] = {
                                "score": ats_score,
                                "project_id": p.get("id"),
                                "job_role": job_role,
                                "target_company": target_company
                            }
                    else:
                        print(f"🔍 DASHBOARD DEBUG: Skipping project {p.get('id')} - no valid ATS score")
                else:
                    print(f"🔍 DASHBOARD DEBUG: Skipping project {p.get('id')} - no project_results or not dict")
            else:
                print(f"🔍 DASHBOARD DEBUG: Skipping project {p.get('id')} - no job_role")

        # Format job role scores for chart
        ats_by_role = [
            {
                "job_role": data["job_role"],
                "target_company": data["target_company"],
                "ats_score": data["score"],
                "project_id": data["project_id"]
            }
            for key, data in job_role_scores.items()
        ]

        # Sort by ATS score descending
        ats_by_role.sort(key=lambda x: x["ats_score"], reverse=True)

        # Create the response object
        response_data = {
            "stats": {
                "highest_ats_score": highest_ats,
                "highest_project_id": highest_project_id,
                "ats_change": "+5%",  # You can calculate this based on historical data
                "resumes_created": len(projects),
                "resumes_change": f"+{completed_resumes}"
            },
            "recent_projects": formatted_projects,
            "ats_by_job_role": ats_by_role,
            "total_projects": total_projects,
            "current_page": page,
            "total_pages": total_pages,
            "projects_per_page": projects_per_page
        }

        # 🔍 RAW RESPONSE DEBUG: Log exactly what we're returning
        print("🔍 RAW RESPONSE DEBUG: Full response object:")
        print(f"🔍 RAW RESPONSE: {json.dumps(response_data, indent=2, default=str)}")

        # Log specifically the recent_projects array
        print(f"🔍 RAW RESPONSE: recent_projects count: {len(formatted_projects)}")
        for i, project in enumerate(formatted_projects):
            print(f"🔍 RAW RESPONSE: Project {i}: has_gap_analysis = {project.get('has_gap_analysis')}")
            print(f"🔍 RAW RESPONSE: Project {i}: test_field = {project.get('test_field')}")

        return response_data
    except Exception as e:
        print(f"Error getting dashboard data: {e}")
        return {
            "stats": {"highest_ats_score": 0, "ats_change": "0%", "resumes_created": 0, "resumes_change": "0"},
            "recent_projects": [],
            "ats_by_job_role": [],
            "total_projects": 0,
            "current_page": page,
            "total_pages": 0,
            "projects_per_page": projects_per_page
        }

async def upload_file_to_storage(file_content: bytes, file_path: str, content_type: str = None) -> str:
    """Upload file to Supabase Storage and return the path"""
    try:
        # Determine bucket based on file path
        if "generated-content" in file_path:
            bucket = "generated-content"
        elif "gap_analysis" in file_path:
            bucket = "user-documents"  # Gap analysis files go to user-documents
        else:
            bucket = "user-documents"

        print(f"🔍 UPLOAD: Uploading to bucket '{bucket}' with path '{file_path}'")
        response = supabase_admin.storage.from_(bucket).upload(file_path, file_content, {
            "content-type": content_type or "application/octet-stream"
        })

        print(f"🔍 UPLOAD: Response: {response}")
        if response:
            print(f"✅ UPLOAD: Successfully uploaded to {file_path}")
            return file_path
        else:
            print(f"❌ UPLOAD: Upload failed, no response")
            return None
    except Exception as e:
        print(f"❌ UPLOAD: Exception uploading file to storage: {e}")
        return None

async def download_file_from_storage(file_path: str) -> bytes:
    """Download file from Supabase Storage and return the content"""
    try:
        # Determine bucket based on file path
        if "generated-content" in file_path:
            bucket = "generated-content"
        else:
            bucket = "user-documents"

        print(f"🔍 DOWNLOAD DEBUG: Downloading from bucket '{bucket}' with path '{file_path}'")

        # Use the storage download method
        try:
            response = supabase_admin.storage.from_(bucket).download(file_path)
            print(f"🔍 DOWNLOAD DEBUG: Download response type: {type(response)}")
            print(f"🔍 DOWNLOAD DEBUG: Download response size: {len(response) if response else 'None'}")
            return response
        except Exception as download_error:
            print(f"🔍 DOWNLOAD DEBUG: Direct download failed: {download_error}")

            # Try alternative: get signed URL and download via HTTP
            try:
                signed_url_response = supabase_admin.storage.from_(bucket).create_signed_url(file_path, 3600)  # 1 hour expiry
                if signed_url_response.get('signedURL'):
                    signed_url = signed_url_response['signedURL']
                    print(f"🔍 DOWNLOAD DEBUG: Using signed URL: {signed_url[:80]}...")

                    import requests
                    http_response = requests.get(signed_url)
                    if http_response.status_code == 200:
                        print(f"🔍 DOWNLOAD DEBUG: Successfully downloaded {len(http_response.content)} bytes via signed URL")
                        return http_response.content
                    else:
                        print(f"🔍 DOWNLOAD DEBUG: HTTP download failed with status {http_response.status_code}")

            except Exception as signed_url_error:
                print(f"🔍 DOWNLOAD DEBUG: Signed URL method failed: {signed_url_error}")

        return None
    except Exception as e:
        print(f"Error downloading file from storage: {e}")
        return None

# Authentication Helper Functions
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get the current authenticated user"""
    try:
        token = credentials.credentials
        payload = verify_token(token)

        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        full_name: str = payload.get("full_name")

        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": user_id,
            "email": email,
            "full_name": full_name
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """Optional authentication - returns None if not authenticated"""
    print(f"🔍 AUTH DEBUG: credentials = {credentials}")
    if credentials is None:
        print("🔍 AUTH DEBUG: No credentials provided")
        return None
    try:
        token = credentials.credentials
        print(f"🔍 AUTH DEBUG: Token received: {token[:20]}...")
        payload = verify_token(token)

        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        full_name: str = payload.get("full_name")

        print(f"🔍 AUTH DEBUG: Payload decoded - user_id: {user_id}, email: {email}")

        if user_id is None or email is None:
            print("🔍 AUTH DEBUG: Missing user_id or email in token")
            return None

        print(f"🔍 AUTH DEBUG: Authentication successful for user: {user_id}")
        return {
            "id": user_id,
            "email": email,
            "full_name": full_name
        }
    except Exception as e:
        print(f"🔍 AUTH DEBUG: Authentication failed: {e}")
        return None

def get_ats_score(resume_path, job_description_path):
    """Get ATS score from the API"""
    try:
        print(f"🔍 ATS API: Calling external ATS service...")
        print(f"🔍 ATS API: Resume file exists: {os.path.exists(resume_path)}")
        print(f"🔍 ATS API: JD file exists: {os.path.exists(job_description_path)}")

        url = "https://ats-service-b6gx.onrender.com/analyze"

        with open(resume_path, "rb") as resume_file, open(job_description_path, "rb") as jd_file:
            files = {
                "resume": resume_file,
                "jd": jd_file
            }
            print(f"🔍 ATS API: Making POST request to {url}")
            response = requests.post(url, files=files, timeout=60)

        print(f"🔍 ATS API: Response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            ats_score = data.get("ats_score")
            print(f"🔍 ATS API: Success! ATS Score: {ats_score}")
            return ats_score
        else:
            print(f"🔍 ATS API: Error response: {response.status_code}")
            try:
                error_data = response.json()
                print(f"🔍 ATS API: Error data: {error_data}")
            except:
                print(f"🔍 ATS API: Error text: {response.text}")
            return None

    except Exception as e:
        print(f"🔍 ATS API: Exception occurred: {e}")
        return None

def inject_contact_info(yaml_content: str, location: str, email: str,
                       phone: str, linkedin: str, github: str) -> str:
    """
    Inject contact information into YAML content
    Based on the logic from inject.py
    """
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
        print(f"📝 CV data keys before: {list(cv_data.keys())}")

        # Update contact information (preserve existing name from AI)
        if location:
            cv_data['location'] = location
        cv_data['email'] = email
        cv_data['phone'] = phone
        cv_data['website'] = linkedin  # LinkedIn goes in website field

        # Handle GitHub URL in social_networks format
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

        # Remove old fields that are no longer needed
        if 'linkedin' in cv_data:
            del cv_data['linkedin']
        if 'github' in cv_data:
            del cv_data['github']

        resume_data['cv'] = cv_data
        print(f"📝 CV data after injection: {cv_data}")
        print(f"📝 CV data keys after: {list(cv_data.keys())}")

        # Convert back to YAML string
        updated_yaml = yaml.dump(resume_data, default_flow_style=False, allow_unicode=True, sort_keys=False)
        print(f"✅ Contact injection completed successfully")
        print(f"📊 Original YAML length: {len(yaml_content)}")
        print(f"📊 Updated YAML length: {len(updated_yaml)}")

        return updated_yaml

    except Exception as e:
        print(f"❌ Error injecting contact info: {e}")
        import traceback
        traceback.print_exc()
        return yaml_content  # Return original if injection fails

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)
import os
import pypdf
def revamp(resumePath, jobRole, jobDescriptionPath):
    """
    Revamp function copied from /Users/arreyanhamid/Developer/ai-resume/main.py
    Handles both .txt and .pdf job description inputs.
    """

    # Load YAML template
    with open("/Users/arreyanhamid/Developer/ai-resume/template.yaml", "r", encoding="utf-8") as f:
        yamlContent = f.read()

    jobDescription = None

    if jobDescriptionPath:
        ext = os.path.splitext(jobDescriptionPath)[1].lower()

        if ext == ".txt":
            # Handle plain text files
            with open(jobDescriptionPath, "r", encoding="utf-8") as f:
                jobDescription = f.read()

        elif ext == ".pdf":
            # Handle PDF files
            with open(jobDescriptionPath, "rb") as f:
                reader = pypdf.PdfReader(f)
                jobDescription = "".join(page.extract_text() or "" for page in reader.pages)

        else:
            raise ValueError(f"Unsupported file type: {ext}. Please provide .txt or .pdf")


    import requests
    import json

    # Your endpoint
    url = "https://ats-service-b6gx.onrender.com/keywords"

    # Handle file upload - ATS service now accepts both .txt and .pdf files
    if jobDescriptionPath.endswith('.txt'):
        # For text files, send as text file directly
        files = {"jd": open(jobDescriptionPath, "rb")}
        print("📄 Sending .txt file directly to ATS service")
    else:
        # For PDF and other files, send in binary mode
        files = {"jd": open(jobDescriptionPath, "rb")}
        print("📄 Sending .pdf file to ATS service")

    # Send POST request with file
    response = requests.post(url, files=files)
    
    # Close file handles
    for file_obj in files.values():
        file_obj.close()
    
    # Check for success
    if response.status_code == 200:
        data = response.json()
        # Save JSON response into a file in ai-resume directory
        keywords_path = "/Users/arreyanhamid/Developer/ai-resume/keywords.json"
        with open(keywords_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print("✅ Response saved to keywords.json")
    else:
        print(f"❌ Request failed with status {response.status_code}: {response.text}")
        # Create fallback keywords file
        data = {"keywords": [], "required_skills": [], "preferred_skills": []}
        keywords_path = "/Users/arreyanhamid/Developer/ai-resume/keywords.json"
        with open(keywords_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print("Created fallback keywords.json")


    with open("/Users/arreyanhamid/Developer/ai-resume/keywords.json", "r", encoding="utf-8") as f:
        jsonContent = f.read()


    ATSOptimizerAgent = Agent(
        name="ATSOptimizer",
        model=Gemini(id="gemini-2.5-flash", api_key="AIzaSyAfwyPa6_YoiV5iFFn5jKvanA0M50FYalw", temperature=0),
        role="Creates an ATS-optimized YAML file based on resume and JD with guaranteed 85+ ATS score using strict keyword alignment and formatting rules.",
        instructions = [
            "Input: resume.pdf, JD.pdf, template.yaml",

            # YAML RULES
            "YAML STRICT RULES:",
            "- Colons (:) only for YAML separators. Forbidden in content text.",
            "- Replace content colons with connectors (and, with, for, by, including).",
            "- summary: must be a single bullet with one paragraph.",
            "- Skills: use 'details:' only, never 'summary:'.",
            "- Dates format: YYYY-MM, lowercase 'present'.",
            "- No fabricated dates. If start/end not in resume, omit them.",
            "- No fabricated dates for projects or experience → only include if explicitly present in the resume.",
            "- Standardize: 'Computer Science Engineering', certifications without colons.",
            "- Degrees must use short form (e.g., Bachelor of Technology → BTech).",
            "- Only include university-level degrees (Bachelor, Master, PhD).",
            "- No placeholders. No contact info.",
            "- Any mention of position of responsibility must be shifted to 'achievements:' with a brief explanation.",

            # STRICT ONE-PAGE RULE
            "- Resume must strictly fit one page in YAML export.",
            "- If content exceeds one page, aggressively shorten summary and experience bullets.",
            "- Shorten by removing filler words and redundant phrases but keep:",
            "   • All JD keywords (95% required + 90% preferred).",
            "   • CAR structure (Challenge–Action–Result).",
            "   • Quantified outcomes (numbers, %, metrics).",
            "- If space still exceeds one page:",
            "   • Prioritize JD keywords and quantified achievements over generic soft skills.",
            "   • Condense 2–3 related bullets into one concise CAR bullet with denser keyword usage.",
            "   • Shorten the summary first before cutting experience points.",
            "- No loss of required keywords or ATS alignment even when shortening.",

            # KEYWORD INTEGRATION
            "Extract all the keywords from the JSON file and include them in the resume, it's a must.",
            "If the JD has keywords such as: recommendation systems, transfer learning, etc, you can follow this example to include such phrases",
            "Your project says: Engineered an ML pipeline for Malicious URL Detection, achieving 92% accuracy. 👉 You could extend it slightly to: Engineered an ML pipeline for Malicious URL Detection, applying techniques similar to recommendation and classification systems, achieving 92% accuracy.",
            "The goal is to not lie, but still integrate those keywords.",
            "JD KEYWORDS (95%+ integration required):",
            "- Python (3–6 months req → resume shows 9+ months expert).",
            "- ML libraries (TensorFlow, OpenCV, scikit-learn).",
            "- AI orchestration (LangChain, CrewAI, Phidata).",
            "- AI agents, agentic systems/workflows.",
            "- SQL, ETL, data manipulation, preprocessing.",
            "- Healthcare applications, clinical outcomes, operational efficiency.",
            "- Analytical, problem-solving, teamwork, communication.",

            "Preferred Skills (90%+ where applicable):",
            "- Cloud platforms (Azure + mention AWS/GCP).",
            "- Data visualization (Matplotlib, Seaborn, Plotly).",
            "- DevOps/model deployment (Docker, production).",
            "- Version control (Git).",

            # WRITING STYLE
            "CAR Method for bullets (Challenge-Action-Result with JD skills).",
            "- Integrate 8–10 JD keywords per bullet.",
            "- Quantified results mandatory.",
            "- Maintain healthcare/efficiency context where possible.",
            "- Shortened bullets must still follow CAR method.",

            # SUMMARY
            "Summary must integrate 25–30 JD keywords naturally in one paragraph.",
            "- If too long, shorten while preserving keywords and role relevance.",

            # OUTPUT VALIDATION
            "Checklist before output:",
            "✓ Python expert level exceeds JD requirement.",
            "✓ 95% required + 90% preferred skills integrated.",
            "✓ Healthcare context maintained.",
            "✓ Keywords dense across summary, skills, experience, projects.",
            "✓ All bullets follow CAR method with metrics.",
            "✓ YAML format clean (no colons in content, skills use details:, dates consistent).",
            "✓ No fake dates. Omit if not present in original (applies to both projects and experience).",
            "✓ Resume strictly fits in one page → shortened bullet points or summary if needed, with keywords and CAR method intact.",
            "✓ Any position of responsibility is recorded under 'achievements:' with a brief explanation.",

            "Final Output: resume.yaml fully ATS-optimized, no formatting violations, guaranteed 85+ ATS score."
        ],
        add_datetime_to_instructions=True,
    )

    response = ATSOptimizerAgent.run(
        f"Revamp the uploaded resume with the Job Description uploaded by the user, I have also attached a jd_keywords.json file that contains all the main keywords from the JD, you need to include 100% of these keywords in the revamp resume. template.yaml: {yamlContent}, Job Role: {jobRole}, Job Description:\n{jobDescription}, JD Keywords:\n{jsonContent}", files=[AgnoFile(filepath=resumePath)]
    )
    print(response.content)
    resume_yaml_path = "/Users/arreyanhamid/Developer/ai-resume/resume.yaml"
    with open(resume_yaml_path, "w", encoding="utf-8") as f:
        f.write(response.content if response.content is not None else "")

    return response.content

def review(resumePath, jobDescriptionPath):
    """
    Review function copied from /Users/arreyanhamid/Developer/ai-resume/review.py
    """
    jobDescription_path = jobDescriptionPath
    if jobDescription_path:
        # Check file extension to determine how to read
        if jobDescription_path.endswith('.txt'):
            # Read text file directly
            with open(jobDescription_path, "r", encoding="utf-8") as f:
                jobDescription = f.read()
        else:
            # Read PDF file using pypdf
            import pypdf
            with open(jobDescription_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                jobDescription = ""
                for page in reader.pages:
                    jobDescription += page.extract_text()
    else:
        jobDescription = None

    resume_path = resumePath
    if resume_path:
        with open(resume_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            resumeDescription = ""
            for page in reader.pages:
                resumeDescription += page.extract_text()
    else:
        resumeDescription = None

    print(resumeDescription)
    print(jobDescription)

    gap_analyzer = Agent(
        name="Gap Analyzer",
        role="Compares required skills in JD to only those explicitly mentioned in the Resume",
        instructions=[
            "Given two lists: (1) SKILLS required in the Job Description (JD), and (2) SKILLS present in the candidate's Resume.",
            "For each skill listed in the JD (not the resume), check ONLY if that skill is directly, explicitly mentioned in the Resume's skills or experience.",
            "Do NOT include any skills that are not mentioned in the JD – the output must match the JD's skill list row-by-row.",
            "Output a Markdown table with these columns: 'Skill from JD', 'Present in Resume?' (Yes/No), and 'Gap Notes/How to Work on this Skill'.",
            "For each row: mark 'Yes' only if that skill is found in the resume text (skills, projects, work experience, etc.), otherwise 'No'.",
            "For every 'No', provide concrete, practical advice on how the candidate can start working towards mastering that skill.",
            "Judgement should be strictly based on literal text matches; do not infer skills from roles, education, or context unless the JD skill is stated or described in the resume.",
            "The table should help the candidate clearly see which required JD skills are missing from their resume."
        ],
        model=Gemini(id="gemini-2.0-flash", api_key="AIzaSyBaLirmENGf4Z-oHlQ1ecLCJN8Hdznzwo4", temperature=0),
        add_datetime_to_instructions=True,
    )

    upskilling_planner = Agent(
        name="Upskilling Planner",
        role="Creates a detailed, actionable upskilling roadmap",
        instructions=[
            "Given a list of missing skills, create a comprehensive upskilling plan for the candidate.",
            "For each missing skill:",
            "  - Split the plan into two timeframes: (1) Immediate (1-2 Weeks), (2) Extended (30-60 Days).",
            "  - For the 1-2 week plan, recommend high-impact learning resources such as courses, tutorials, articles, or bootcamps. Include direct web links for each recommended resource.",
            "  - Specify actionable steps, daily or weekly time commitments, and the key milestone(s) the candidate should achieve at the end of this phase (e.g., finish a course, build a small project, complete an assessment quiz).",
            "  - For the 30-60 day plan, outline in-depth progression: advanced resources (with links), real-world practice (e.g., projects or open-source contributions), group learning opportunities (e.g., forums, MOOC cohorts, mentorship), and regular self-assessment.",
            "  - Define concrete outputs or portfolio artifacts (e.g., GitHub project, article, certification, demo video) that the candidate should produce to tangibly demonstrate progress and proficiency.",
            "  - Prioritize reputable sources and structure the output so the candidate can easily follow the plan step-by-step.",
            "The final plan must be detailed, motivating, and immediately actionable."
        ],
        model=Gemini(id="gemini-2.0-flash", api_key="AIzaSyBaLirmENGf4Z-oHlQ1ecLCJN8Hdznzwo4", temperature=0),
        add_datetime_to_instructions=True,
    )

    project_finder = Agent(
        name="Project Finder",
        role="Finds trending and high-impact projects",
        instructions=[
            "Given a list of missing skills and the job domain, perform the following steps:",
            "1. Search the web for trending or highly recommended projects, real-world challenges, or open-source repositories that will help a candidate bridge the missing skills.",
            "2. For each suggested project, provide:",
            "   - Project Title",
            "   - Brief but detailed Project Description (what will be built, what real-world use case it solves, and which technologies are involved)",
            "   - Exact Missing Skills that the project will help cover or demonstrate (from the input skills list; be explicit)",
            "   - Type (Personal Project, Open Source, Competition/Hackathon, Corporate Challenge, etc.)",
            "   - Direct Web Link(s) to the project, existing repositories, hackathon pages, or sample implementations (if available).",
            "   - One to three sentences on why completing this project would impress recruiters for the given job domain in 2025.",
            "3. Output a list of at least 5 high-value, varied project opportunities—be specific and avoid overly generic/toy projects.",
            "4. Prefer projects that have active communities, mentoring, or project showcase platforms where the candidate can engage or seek support."
        ],
        model=Gemini(id="gemini-2.0-flash", api_key="AIzaSyBaLirmENGf4Z-oHlQ1ecLCJN8Hdznzwo4", temperature=0),
        add_datetime_to_instructions=True,
        tools=[GoogleSearchTools()],
    )

    team_leader = Team(
        name="Gap Analysis TeamLeader",
        mode="coordinate",
        model=Gemini(id="gemini-2.0-flash", api_key="AIzaSyBaLirmENGf4Z-oHlQ1ecLCJN8Hdznzwo4", temperature=0),
        members=[gap_analyzer, upskilling_planner, project_finder],
        description="Manages the gap analysis, upskilling planning, and project suggestion pipeline.",
        instructions=[
            "Receive extracted resume and JD, and send to Gap Analyzer.",
            "Use gap table (missing skills) for Upskilling Planner and Project Finder.",
            "Collect all outputs and compile a user-friendly, actionable report with gap analysis, learning plan, and project ideas.",
            "Final report should be motivating, specific, and actionable.",
        ],
        add_datetime_to_instructions=True,
        add_member_tools_to_system_message=False,
        enable_agentic_context=True,
        share_member_interactions=True,
        show_members_responses=True,
        markdown=True,
    )

    response = team_leader.run(f"Analyze my resume vs JD: give me a gap table, an actionable upskilling plan, and trending project ideas. JD: {jobDescription}, resume: {resumeDescription}")

    print(response.content)
    with open("review.md", "w", encoding="utf-8") as f:
      f.write(response.content)

# =====================
# AUTHENTICATION ENDPOINTS
# =====================

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignupRequest):
    """Sign up a new user"""
    try:
        # Sign up user with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })

        if response.user:
            # Create our JWT token with user data
            token_data = {
                "sub": response.user.id,
                "email": response.user.email,
                "full_name": user_data.full_name
            }
            access_token = create_access_token(token_data)

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": user_data.full_name,
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

@app.post("/auth/login", response_model=AuthResponse)
async def login(user_data: UserLoginRequest):
    """Login a user"""
    try:
        # Sign in with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })

        if response.user:
            # Create our JWT token
            token_data = {
                "sub": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name")
            }
            access_token = create_access_token(token_data)

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

@app.post("/auth/logout", response_model=MessageResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout current user"""
    return {"message": "Successfully logged out"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name"),
        "email_confirmed": True  # We'll assume email is confirmed for now
    }

@app.get("/auth/verify-token")
async def verify_token_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Verify if the provided token is valid"""
    return {
        "valid": True,
        "user": current_user
    }

# =====================
# USER PROFILE ENDPOINTS
# =====================

@app.post("/profile", response_model=UserProfileResponse)
async def create_or_update_profile(
    profile_data: UserProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create or update user profile"""
    try:
        user_id = current_user["id"]

        # Check if profile exists
        existing_profile = await get_or_create_user_profile(user_id)

        if existing_profile:
            # Update existing profile
            update_data = {
                "location": profile_data.location,
                "email": profile_data.email,
                "phone": profile_data.phone,
                "linkedin": profile_data.linkedin,
                "github": profile_data.github
            }

            response = supabase_admin.table("user_profiles").update(update_data).eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
        else:
            # Create new profile
            profile = await get_or_create_user_profile(user_id, profile_data)
            if profile:
                return profile

        raise HTTPException(status_code=500, detail="Failed to create/update profile")

    except Exception as e:
        print(f"Error in profile endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get user profile"""
    try:
        user_id = current_user["id"]
        profile = await get_or_create_user_profile(user_id)

        if profile:
            return profile
        else:
            raise HTTPException(status_code=404, detail="Profile not found")

    except Exception as e:
        print(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# =====================
# DASHBOARD ENDPOINTS
# =====================

@app.get("/dashboard", response_model=PaginatedDashboardResponse)
async def get_dashboard_data(
    page: int = 1,
    projects_per_page: int = 5,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get paginated dashboard data for the authenticated user"""
    try:
        user_id = current_user["id"]
        dashboard_data = await get_user_dashboard_data(user_id, page, projects_per_page)
        return dashboard_data

    except Exception as e:
        print(f"Error getting dashboard data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# =====================
# RESUME PROCESSING ENDPOINTS
# =====================

@app.post("/review")
async def gap_analysis(
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Endpoint to analyze resume gap against job description using the complete review.py workflow
    """


    print(f"Resume file: {resumeFile.filename}")
    print(f"JD file: {jobDescriptionFile.filename}")

    try:
        # Validate file types
        if not resumeFile.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")

        allowed_jd_extensions = ['.pdf', '.docx', '.txt']
        if not any(jobDescriptionFile.filename.endswith(ext) for ext in allowed_jd_extensions):
            raise HTTPException(status_code=400, detail="Job description must be PDF, DOCX, or TXT")

        # Create temporary files in the ai-resume directory structure
        ai_resume_dir = "/Users/arreyanhamid/Developer/ai-resume"
        resumes_dir = os.path.join(ai_resume_dir, "resumes")
        jd_dir = os.path.join(ai_resume_dir, "JD")

        # Ensure directories exist
        os.makedirs(resumes_dir, exist_ok=True)
        os.makedirs(jd_dir, exist_ok=True)

        # Save files with unique names
        timestamp = str(int(time.time()))

        resume_filename = f"resume_{timestamp}.pdf"
        jd_filename = f"jd_{timestamp}.{jobDescriptionFile.filename.split('.')[-1]}"

        resume_path = os.path.join(resumes_dir, resume_filename)
        jd_path = os.path.join(jd_dir, jd_filename)

        # Save uploaded files
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resumeFile.file, buffer)

        with open(jd_path, "wb") as buffer:
            shutil.copyfileobj(jobDescriptionFile.file, buffer)

        print(f"Saved resume to: {resume_path}")
        print(f"Saved JD to: {jd_path}")

        try:
            # Call the review function with the uploaded files
            print("Running analysis...")
            analysis_result = review(
                resumePath=resume_path,
                jobDescriptionPath=jd_path,
            )

            # For gap analysis, we'll create a project if the analysis was successful
            # This allows users to track their gap analyses in the dashboard
            if analysis_result:
                user_id = current_user["id"]

                # Create a project for this gap analysis (we'll use a generic job role)
                project = await create_resume_project(
                    user_id,
                    "Gap Analysis",  # Generic job role for gap analysis
                    "Analysis Only"  # Generic target company
                )

                if project:
                    project_id = project["id"]

                    # Save the analysis results to database
                    await save_gap_analysis(
                        project_id,
                        analysis_result,  # The full markdown content
                        [],  # We could parse out missing skills if needed
                        {}   # We could parse out recommendations if needed
                    )

                    # Update project status
                    await update_project_status(project_id, "completed")
                    print(f"✅ Gap analysis saved to project: {project_id}")

            return {
                "success": True,
                "analysis": analysis_result,
            }

        finally:
            # Clean up temporary files
            try:
                os.unlink(resume_path)
                os.unlink(jd_path)
            except Exception as e:
                print(f"Error cleaning up files: {e}")

    except Exception as e:
        print(f"Error in gap analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/revamp-existing")
async def revamp_existing(
    request: Request,
    location: str = Form(""),
    email: str = Form(...),
    phone: str = Form(...),
    linkedin: str = Form(...),
    github: str = Form(""),
    jobRole: str = Form(...),
    targetCompany: str = Form(""),
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: Optional[UploadFile] = File(None),
    jobDescriptionText: Optional[str] = Form(None),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """
    Endpoint to revamp existing resume using the complete main.py workflow
    """

    print("=" * 80)
    print("🚀 REVAMP ENDPOINT CALLED - DEBUG INFO")
    print("=" * 80)
    print(f"Received revamp request for job role: {jobRole}")
    print(f"Target company: {targetCompany if targetCompany else 'Not specified'}")
    print(f"Resume file: {resumeFile.filename}")

    # Validate job description input (either file or text must be provided)
    if not jobDescriptionFile and not jobDescriptionText:
        raise HTTPException(status_code=400, detail="Either job description file or text must be provided")
    if jobDescriptionFile and jobDescriptionText:
        raise HTTPException(status_code=400, detail="Provide either job description file OR text, not both")

    if jobDescriptionFile:
        print(f"JD file: {jobDescriptionFile.filename}")
    else:
        print(f"JD text: {len(jobDescriptionText)} characters provided")

    # Debug: Check request headers
    print(f"\n🔍 REQUEST DEBUG: Headers received:")
    auth_header_found = False
    for name, value in request.headers.items():
        if name.lower() == 'authorization':
            print(f"   ✅ AUTHORIZATION HEADER FOUND: {value[:30]}...")
            auth_header_found = True
        elif name.lower() in ['host', 'content-type', 'user-agent']:
            print(f"   {name}: {value}")

    if not auth_header_found:
        print("   ❌ NO AUTHORIZATION HEADER FOUND!")

    # Check if user is authenticated
    is_authenticated = current_user is not None
    user_id = current_user["id"] if is_authenticated else None
    print(f"\n🔍 AUTHENTICATION RESULT:")
    print(f"   - User authenticated: {is_authenticated}")
    print(f"   - User ID: {user_id}")
    print(f"   - Current user object: {current_user}")
    print("=" * 80)

    try:
        # Validate file types
        if not resumeFile.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")

        # Validate job description file type only if file is provided
        if jobDescriptionFile:
            allowed_jd_extensions = ['.pdf', '.docx', '.txt']
            if not any(jobDescriptionFile.filename.endswith(ext) for ext in allowed_jd_extensions):
                raise HTTPException(status_code=400, detail="Job description must be PDF, DOCX, or TXT")

        project_id = None
        resume_stored_path = None
        jd_stored_path = None
        timestamp = str(int(time.time()))  # Move timestamp outside the if block

        # Read file contents (needed for both authenticated and non-authenticated)
        resume_file_content = await resumeFile.read()

        # Handle job description - either from file or text
        if jobDescriptionFile:
            jd_file_content = await jobDescriptionFile.read()
            jd_filename = jobDescriptionFile.filename
            jd_content_type = jobDescriptionFile.content_type
        else:
            # Create content from text and set as txt file
            jd_file_content = jobDescriptionText.encode('utf-8')
            jd_filename = "jd.txt"
            jd_content_type = "text/plain"

        # Only save to database if user is authenticated
        if is_authenticated:
            # Step 1: Create or update user profile
            profile_data = UserProfileRequest(
                location=location,
                email=email,
                phone=phone,
                linkedin=linkedin,
                github=github
            )
            await get_or_create_user_profile(user_id, profile_data)

            # Step 2: Create resume project
            project = await create_resume_project(user_id, jobRole, targetCompany)
            if project:
                project_id = project["id"]
                print(f"Created project: {project_id}")

                # Step 3: Update project status to files_uploaded
                await update_project_status(project_id, "files_uploaded")

                # Step 4: Save files to Supabase Storage and track in database

                # Create storage paths - session-based with readable names
                session_id = project_id  # Using project_id as session identifier
                resume_storage_path = f"session_{session_id}/original_resume.pdf"
                # Determine job description file extension based on input type
                if jobDescriptionFile:
                    jd_extension = jobDescriptionFile.filename.split('.')[-1]
                else:
                    jd_extension = "txt"  # Text input always creates .txt file
                jd_storage_path = f"session_{session_id}/job_description.{jd_extension}"

                # Upload to Supabase Storage
                resume_stored_path = await upload_file_to_storage(
                    resume_file_content,
                    resume_storage_path,
                    "application/pdf"
                )
                jd_stored_path = await upload_file_to_storage(
                    jd_file_content,
                    jd_storage_path,
                    jd_content_type
                )

                # Save file records to database
                file_entries = []
                if resume_stored_path:
                    file_entries.append({
                        "project_id": project_id,
                        "file_type": "original_resume",
                        "file_name": resumeFile.filename,
                        "file_path": resume_stored_path,
                        "file_size": len(resume_file_content),
                        "mime_type": "application/pdf"
                    })

                if jd_stored_path:
                    file_entries.append({
                        "project_id": project_id,
                        "file_type": "job_description",
                        "file_name": jd_filename,
                        "file_path": jd_stored_path,
                        "file_size": len(jd_file_content),
                        "mime_type": jd_content_type
                    })

                if file_entries:
                    await save_project_files(project_id, file_entries)

        # Create temporary files for processing (backward compatibility with existing revamp function)
        ai_resume_dir = "/Users/arreyanhamid/Developer/ai-resume"
        resumes_dir = os.path.join(ai_resume_dir, "resumes")
        jd_dir = os.path.join(ai_resume_dir, "JD")

        # Ensure directories exist
        os.makedirs(resumes_dir, exist_ok=True)
        os.makedirs(jd_dir, exist_ok=True)

        resume_filename = f"resume_{timestamp}.pdf"
        # Determine job description filename based on input type
        if jobDescriptionFile:
            jd_extension = jobDescriptionFile.filename.split('.')[-1]
        else:
            jd_extension = "txt"  # Text input creates .txt file
        jd_filename = f"jd_{timestamp}.{jd_extension}"

        resume_path = os.path.join(resumes_dir, resume_filename)
        jd_path = os.path.join(jd_dir, jd_filename)

        # Write files to temp locations for processing
        with open(resume_path, "wb") as buffer:
            buffer.write(resume_file_content)

        with open(jd_path, "wb") as buffer:
            buffer.write(jd_file_content)

        print(f"Saved resume to: {resume_path}")
        print(f"Saved JD to: {jd_path}")

        try:
            # Update project status if authenticated
            if is_authenticated and project_id:
                await update_project_status(project_id, "yaml_generated")

            # Call the revamp function with the uploaded files (keywords handled internally)
            print("Running resume revamp...")
            revamp_result = revamp(
                resumePath=resume_path,
                jobRole=jobRole,
                jobDescriptionPath=jd_path
            )

            # Read the generated resume.yaml file
            yaml_content = ""
            ats_score = None
            original_ats_score = None
            resume_yaml_path = "/Users/arreyanhamid/Developer/ai-resume/resume.yaml"

            if os.path.exists(resume_yaml_path):
                with open(resume_yaml_path, "r", encoding="utf-8") as f:
                    raw_content = f.read()
                    # Strip markdown code fences if present
                    if raw_content.startswith("```yaml"):
                        yaml_content = raw_content.replace("```yaml", "").replace("```", "").strip()
                    else:
                        yaml_content = raw_content

                    print(f"Original YAML content length: {len(yaml_content)}")
                    print(f"Original YAML content preview: {yaml_content[:200]}...")

                    # Inject contact information into the YAML
                    yaml_content = inject_contact_info(
                        yaml_content=yaml_content,
                        location=location,
                        email=email,
                        phone=phone,
                        linkedin=linkedin,
                        github=github
                    )

                    print(f"✅ Contact information injected successfully")
                    print(f"Final YAML content length: {len(yaml_content)}")

                    # Calculate ATS score using the revamped resume (convert YAML to PDF first)
                    print("Converting revamped resume to PDF for ATS scoring...")

                    # Generate PDF from the revamped YAML content
                    import tempfile
                    import shutil
                    from pathlib import Path
                    import subprocess

                    try:
                        # Create temp directory for PDF generation
                        temp_dir = tempfile.mkdtemp()
                        yaml_temp_path = os.path.join(temp_dir, 'resume.yaml')

                        # Copy designs folder for rendering
                        source_designs_dir = '/Users/arreyanhamid/Developer/ai-resume/designs'
                        target_designs_dir = os.path.join(temp_dir, 'designs')

                        try:
                            shutil.copytree(source_designs_dir, target_designs_dir)
                        except Exception as copy_error:
                            print(f"Warning: Could not copy designs folder: {copy_error}")

                        # Write the revamped YAML content to temp file
                        with open(yaml_temp_path, 'w', encoding='utf-8') as f:
                            f.write(yaml_content)

                        # Render the revamped resume to PDF using RenderCV
                        try:
                            design_file = 'designs/engineeringClassic.yaml'  # Default design
                            command = ['rendercv', 'render', 'resume.yaml', '--design', design_file]

                            result = subprocess.run(
                                command,
                                cwd=temp_dir,
                                capture_output=True,
                                text=True,
                                timeout=60
                            )

                            if result.returncode == 0:
                                # Find the generated PDF
                                output_dir = os.path.join(temp_dir, 'rendercv_output')
                                if os.path.exists(output_dir):
                                    pdf_files = [f for f in os.listdir(output_dir) if f.endswith('.pdf')]
                                    if pdf_files:
                                        revamped_pdf_path = os.path.join(output_dir, pdf_files[0])
                                        print(f"✅ Revamped resume PDF generated: {revamped_pdf_path}")

                                        # First calculate original ATS score
                                        print("🔍 Calculating ORIGINAL ATS score...")
                                        original_ats_score = get_ats_score(resume_path, jd_path)
                                        print(f"✅ Original Resume ATS Score: {original_ats_score}")

                                        # Now calculate ATS score using the revamped PDF
                                        print("Calculating ATS score using revamped resume...")
                                        ats_score = get_ats_score(revamped_pdf_path, jd_path)
                                        print(f"✅ Revamped Resume ATS Score: {ats_score}")
                                    else:
                                        print("❌ No PDF files found in output directory")
                                        # Fallback to original resume
                                        print("Falling back to original resume ATS score...")
                                        ats_score = get_ats_score(resume_path, jd_path)
                                        original_ats_score = ats_score  # Same as current since we're using original
                                else:
                                    print("❌ Output directory not found")
                                    # Fallback to original resume
                                    print("Falling back to original resume ATS score...")
                                    ats_score = get_ats_score(resume_path, jd_path)
                                    original_ats_score = ats_score  # Same as current since we're using original
                            else:
                                print(f"❌ RenderCV failed: {result.stderr}")
                                # Fallback to original resume
                                print("Falling back to original resume ATS score...")
                                ats_score = get_ats_score(resume_path, jd_path)
                                original_ats_score = ats_score  # Same as current since we're using original

                        except subprocess.TimeoutExpired:
                            print("❌ PDF generation timed out")
                            # Fallback to original resume
                            print("Falling back to original resume ATS score...")
                            ats_score = get_ats_score(resume_path, jd_path)
                            original_ats_score = ats_score  # Same as current since we're using original
                        except Exception as render_error:
                            print(f"❌ Error rendering PDF: {render_error}")
                            # Fallback to original resume
                            print("Falling back to original resume ATS score...")
                            ats_score = get_ats_score(resume_path, jd_path)
                            original_ats_score = ats_score  # Same as current since we're using original

                        # Clean up temp directory
                        try:
                            shutil.rmtree(temp_dir)
                        except Exception as cleanup_error:
                            print(f"Warning: Could not clean up temp directory: {cleanup_error}")

                    except Exception as temp_error:
                        print(f"❌ Error setting up temp environment: {temp_error}")
                        # Fallback to original resume
                        print("Falling back to original resume ATS score...")
                        ats_score = get_ats_score(resume_path, jd_path)
                        original_ats_score = ats_score  # Same as current since we're using original

                    # Save to database only if authenticated
                    if is_authenticated and project_id:
                        # Step 6: Save YAML content to Supabase Storage and Database
                        yaml_storage_path = f"session_{project_id}/generated_yaml.yaml"
                        yaml_stored_path = await upload_file_to_storage(
                            yaml_content.encode('utf-8'),
                            yaml_storage_path,
                            "text/yaml"
                        )

                        if yaml_stored_path:
                            # Add YAML file entry to database
                            yaml_file_entry = {
                                "project_id": project_id,
                                "file_type": "generated_yaml",
                                "file_name": f"resume_{timestamp}.yaml",
                                "file_path": yaml_stored_path,
                                "file_size": len(yaml_content.encode('utf-8')),
                                "mime_type": "text/yaml"
                            }
                            await save_project_files(project_id, [yaml_file_entry])

                        # Save project results to database
                        await save_project_results(project_id, yaml_content, ats_score)

                        if ats_score:
                            await update_project_status(project_id, "ats_calculated")
                            print(f"✅ ATS Score saved: {ats_score}")

                        # Step 8: Mark project as completed
                        await update_project_status(project_id, "completed")
                        print(f"✅ Project {project_id} completed successfully")

            return {
                "success": True,
                "project_id": project_id,
                "yamlContent": yaml_content,
                "ats_score": ats_score,
                "original_ats_score": original_ats_score,
                "jobDescriptionPath": jd_stored_path or jd_path,
                "originalResumePath": resume_stored_path or resume_path,
            }

        finally:
            # Clean up temporary files
            try:
                # Keep both original resume and JD files for ATS scoring in editor
                # os.unlink(resume_path)  # Don't delete original resume file
                # os.unlink(jd_path)  # Don't delete JD file
                # Keep resume.yaml for the editor
                pass
            except Exception as e:
                print(f"Error cleaning up files: {e}")

    except Exception as e:
        print(f"Error in revamp: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/render-resume")
async def render_resume(request: RenderRequest):
    """
    Render resume YAML to PDF using RenderCV with custom design
    """
    print(f"🔍 DETAILED DEBUG - Received request:")
    print(f"   - Theme from request: '{request.theme}'")
    print(f"   - Theme type: {type(request.theme)}")
    print(f"   - YAML content length: {len(request.yamlContent)}")

    try:
        # Create temp directory for processing
        temp_dir = tempfile.mkdtemp()
        yaml_path = os.path.join(temp_dir, 'resume.yaml')

        # Copy entire designs folder to temp directory
        source_designs_dir = '/Users/arreyanhamid/Developer/ai-resume/designs'
        target_designs_dir = os.path.join(temp_dir, 'designs')

        try:
            shutil.copytree(source_designs_dir, target_designs_dir)
            print(f"Designs folder copied successfully to {target_designs_dir}")
        except Exception as copy_error:
            print(f"Error copying designs folder: {copy_error}")
            # Continue without design files - will use default

        # Write YAML content to file
        with open(yaml_path, 'w', encoding='utf-8') as f:
            f.write(request.yamlContent)

        try:
            # Execute RenderCV command with selected theme design
            design_file = f'designs/{request.theme}.yaml'
            command = ['rendercv', 'render', 'resume.yaml', '--design', design_file]
            print(f'🎨 THEME DEBUG: Received theme request: {request.theme}')
            print(f'📁 Design file path: {design_file}')
            print(f'📂 Working directory: {temp_dir}')
            print(f'💻 Executing command: {" ".join(command)}')

            # Check if the design file exists
            design_path = os.path.join(temp_dir, design_file)
            print(f'🔍 Design file exists: {os.path.exists(design_path)}')

            result = subprocess.run(
                command,
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=30
            )

            print('RenderCV stdout:', result.stdout)
            print('RenderCV stderr:', result.stderr)

            if result.returncode != 0:
                raise HTTPException(
                    status_code=500,
                    detail=f"RenderCV failed with return code {result.returncode}: {result.stderr}"
                )

            # Check for rendered PDF in rendercv_output directory
            rendercv_output_dir = os.path.join(temp_dir, 'rendercv_output')

            # Look for PDF files in the output directory
            possible_pdf_paths = [
                os.path.join(rendercv_output_dir, 'resume.pdf'),
                os.path.join(rendercv_output_dir, 'John_Doe_CV.pdf'),
                os.path.join(rendercv_output_dir, 'CV.pdf')
            ]

            pdf_path = None
            for possible_path in possible_pdf_paths:
                if os.path.exists(possible_path):
                    pdf_path = possible_path
                    break

            # If no PDF found in expected locations, search the entire output directory
            if not pdf_path and os.path.exists(rendercv_output_dir):
                for file in os.listdir(rendercv_output_dir):
                    if file.endswith('.pdf'):
                        pdf_path = os.path.join(rendercv_output_dir, file)
                        break

            if pdf_path and os.path.exists(pdf_path):
                print(f"PDF found at: {pdf_path}")
                # Read the PDF file
                with open(pdf_path, 'rb') as pdf_file:
                    pdf_content = pdf_file.read()

                # Return PDF as response
                return Response(
                    content=pdf_content,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": "inline; filename=resume.pdf",
                        "Content-Type": "application/pdf"
                    }
                )
            else:
                print('No PDF found in rendercv_output directory')
                raise HTTPException(status_code=500, detail="PDF generation failed - no output file found")

        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="RenderCV process timed out")
        except Exception as render_error:
            print(f'RenderCV Error: {render_error}')
            raise HTTPException(status_code=500, detail=f"Rendering failed: {str(render_error)}")

        finally:
            # Clean up temporary directory
            try:
                shutil.rmtree(temp_dir)
            except Exception as cleanup_error:
                print(f"Error cleaning up temp directory: {cleanup_error}")

    except Exception as error:
        print(f'API Error: {error}')
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(error)}")

@app.post("/render-resume-watch")
async def render_resume_watch(request: WatchRequest):
    """
    Start, stop, or update resume watch mode with custom design
    """
    try:
        # Create temp directory path (consistent across requests)
        temp_dir = tempfile.gettempdir()
        resume_temp_dir = os.path.join(temp_dir, 'resumecv_temp')
        os.makedirs(resume_temp_dir, exist_ok=True)

        yaml_path = os.path.join(resume_temp_dir, 'resume.yaml')

        if request.action == 'start':
            # Stop any existing watcher for this directory
            if resume_temp_dir in active_watchers:
                try:
                    active_watchers[resume_temp_dir].terminate()
                    active_watchers[resume_temp_dir].wait(timeout=5)
                except:
                    pass
                del active_watchers[resume_temp_dir]

            # Copy entire designs folder to temp directory
            source_designs_dir = '/Users/arreyanhamid/Developer/ai-resume/designs'
            target_designs_dir = os.path.join(resume_temp_dir, 'designs')

            try:
                if os.path.exists(target_designs_dir):
                    shutil.rmtree(target_designs_dir)
                shutil.copytree(source_designs_dir, target_designs_dir)
                print(f"✅ Designs folder copied to watch directory: {target_designs_dir}")
            except Exception as copy_error:
                print(f"❌ Error copying designs folder for watch: {copy_error}")

            # Write YAML content to file
            with open(yaml_path, 'w', encoding='utf-8') as f:
                f.write(request.yamlContent)

            try:
                # Start rendercv in watch mode with specific design
                print('🚀 Starting rendercv watch process...')
                design_path = 'designs/engineeringClassic.yaml'
                print(f'📁 Working directory: {resume_temp_dir}')
                print(f'🎨 Design file: {design_path}')
                print(f'📋 Full command: rendercv render resume.yaml --design {design_path} --watch')

                watch_process = subprocess.Popen([
                    'rendercv', 'render', 'resume.yaml',
                    '--design', design_path, '--watch'
                ], cwd=resume_temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

                # Store the process
                active_watchers[resume_temp_dir] = watch_process

                # Give the process a moment to start
                await asyncio.sleep(1)

                return {
                    "status": "Watch started",
                    "processId": watch_process.pid,
                    "outputDir": os.path.join(resume_temp_dir, 'rendercv_output')
                }

            except Exception as error:
                print(f'Failed to start watch process: {error}')
                raise HTTPException(status_code=500, detail='Failed to start watch process')

        elif request.action == 'stop':
            # Stop existing watcher
            if resume_temp_dir in active_watchers:
                try:
                    active_watchers[resume_temp_dir].terminate()
                    active_watchers[resume_temp_dir].wait(timeout=5)
                except:
                    pass
                del active_watchers[resume_temp_dir]
                return {"status": "Watch stopped"}
            else:
                return {"status": "No active watch process found"}

        elif request.action == 'update':
            # Update YAML content for existing watcher
            with open(yaml_path, 'w', encoding='utf-8') as f:
                f.write(request.yamlContent)
            return {"status": "YAML updated"}

        else:
            raise HTTPException(status_code=400, detail='Invalid action. Use "start", "stop", or "update"')

    except Exception as error:
        print(f'Watch API Error: {error}')
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(error)}')

@app.get("/render-resume-watch")
async def get_watch_status():
    """Get status of active watchers"""
    temp_dir = tempfile.gettempdir()
    resume_temp_dir = os.path.join(temp_dir, 'resumecv_temp')

    watcher = active_watchers.get(resume_temp_dir)

    return {
        "active": bool(watcher and watcher.poll() is None),
        "processId": watcher.pid if watcher and watcher.poll() is None else None,
        "outputDir": os.path.join(resume_temp_dir, 'rendercv_output')
    }

@app.get("/get-rendered-pdf")
async def get_rendered_pdf():
    """Get the latest rendered PDF from rendercv_output directory"""
    try:
        temp_dir = tempfile.gettempdir()
        resume_temp_dir = os.path.join(temp_dir, 'resumecv_temp')
        rendercv_output_dir = os.path.join(resume_temp_dir, 'rendercv_output')

        if not os.path.exists(rendercv_output_dir):
            raise HTTPException(status_code=404, detail='No rendercv_output directory found')

        # Look for the most recently modified PDF file in the output directory
        latest_pdf = None
        latest_time = 0

        try:
            for file in os.listdir(rendercv_output_dir):
                if file.endswith('.pdf'):
                    file_path = os.path.join(rendercv_output_dir, file)
                    file_stat = os.stat(file_path)

                    if file_stat.st_mtime > latest_time:
                        latest_time = file_stat.st_mtime
                        latest_pdf = file_path
        except Exception as error:
            print(f'Error reading rendercv_output directory: {error}')

        # If no PDF found with directory listing, try common names
        if not latest_pdf:
            possible_pdf_paths = [
                os.path.join(rendercv_output_dir, 'resume.pdf'),
                os.path.join(rendercv_output_dir, 'John_Doe_CV.pdf'),
                os.path.join(rendercv_output_dir, 'CV.pdf')
            ]

            for possible_path in possible_pdf_paths:
                if os.path.exists(possible_path):
                    latest_pdf = possible_path
                    break

        if latest_pdf and os.path.exists(latest_pdf):
            print(f'Serving PDF from: {latest_pdf}')
            with open(latest_pdf, 'rb') as pdf_file:
                pdf_content = pdf_file.read()

            file_name = os.path.basename(latest_pdf)

            return Response(
                content=pdf_content,
                media_type="application/pdf",
                headers={
                    "Content-Type": "application/pdf",
                    "Content-Disposition": f"inline; filename={file_name}",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
        else:
            print('No PDF file found in rendercv_output directory')
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "No PDF file found in rendercv_output directory",
                    "searchedDir": rendercv_output_dir,
                    "exists": os.path.exists(rendercv_output_dir)
                }
            )

    except Exception as error:
        print(f'Get PDF API Error: {error}')
        raise HTTPException(status_code=500, detail=f'Internal server error: {str(error)}')

@app.post("/get-ats-score")
async def get_ats_score_endpoint(
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...)
):
    """
    Endpoint to get ATS score for a resume against a job description (with file uploads)
    """
    try:
        # Validate file types
        if not resumeFile.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")

        allowed_jd_extensions = ['.pdf', '.docx', '.txt']
        if not any(jobDescriptionFile.filename.endswith(ext) for ext in allowed_jd_extensions):
            raise HTTPException(status_code=400, detail="Job description must be PDF, DOCX, or TXT")

        # Create temporary files
        temp_dir = tempfile.mkdtemp()

        # Save files with timestamp
        timestamp = str(int(time.time()))
        resume_filename = f"resume_{timestamp}.pdf"
        jd_filename = f"jd_{timestamp}.{jobDescriptionFile.filename.split('.')[-1]}"

        resume_path = os.path.join(temp_dir, resume_filename)
        jd_path = os.path.join(temp_dir, jd_filename)

        # Save uploaded files
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resumeFile.file, buffer)

        with open(jd_path, "wb") as buffer:
            shutil.copyfileobj(jobDescriptionFile.file, buffer)

        try:
            # Get ATS score
            ats_score = get_ats_score(resume_path, jd_path)

            if ats_score is not None:
                return {
                    "success": True,
                    "ats_score": ats_score
                }
            else:
                return {
                    "success": False,
                    "ats_score": 0,
                    "error": "Failed to get ATS score"
                }

        finally:
            # Clean up temporary files
            try:
                os.unlink(resume_path)
                os.unlink(jd_path)
                os.rmdir(temp_dir)
            except Exception as e:
                print(f"Error cleaning up files: {e}")

    except Exception as e:
        print(f"Error in ATS score endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/get-ats-score-with-stored-jd")
async def get_ats_score_with_stored_jd(
    resumeFile: UploadFile = File(...),
    jobDescriptionPath: str = Form(...)
):
    """
    Endpoint to get ATS score using a stored job description file path
    """
    try:
        # Validate resume file type
        if not resumeFile.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")

        # The jobDescriptionPath should be a local file path from the revamp process
        # Convert storage path format to local path format if needed
        if jobDescriptionPath.count('/') >= 1:  # It's a storage path like "session_id/job_description.ext"
            # Extract session info and construct local path
            storage_filename = jobDescriptionPath.split('/')[-1]  # Get filename
            session_id = jobDescriptionPath.split('/')[0].replace('session_', '')

            # New simple structure: "session_id/job_description.ext" -> Local: "jd_[session_id].ext"
            file_extension = storage_filename.split('.')[-1] if '.' in storage_filename else 'txt'
            local_filename = f"jd_{session_id}.{file_extension}"

            # Convert to local JD directory path
            local_jd_path = f"/Users/arreyanhamid/Developer/ai-resume/JD/{local_filename}"
        else:
            # It's already a local path
            local_jd_path = jobDescriptionPath

        print(f"Using local JD file path: {local_jd_path}")

        # Download JD file from storage to local path if it's a storage path
        if jobDescriptionPath.count('/') >= 1:  # It's a storage path
            try:
                print(f"📥 ATS: Downloading JD from storage: {jobDescriptionPath}")
                jd_content = await download_file_from_storage(jobDescriptionPath)
                os.makedirs(os.path.dirname(local_jd_path), exist_ok=True)
                with open(local_jd_path, 'wb') as f:
                    f.write(jd_content)
                print(f"✅ ATS: JD downloaded to {local_jd_path}")
            except Exception as e:
                print(f"❌ ATS: Error downloading JD from storage: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error downloading job description from storage: {str(e)}")

        # Check if local job description file exists
        if not os.path.exists(local_jd_path):
            raise HTTPException(status_code=404, detail=f"Job description file not found at: {local_jd_path}")

        # Create temporary file for resume only
        temp_dir = tempfile.mkdtemp()
        timestamp = str(int(time.time()))
        resume_filename = f"resume_{timestamp}.pdf"
        resume_path = os.path.join(temp_dir, resume_filename)

        # Save resume file
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resumeFile.file, buffer)

        try:
            # Get ATS score using local files
            ats_score = get_ats_score(resume_path, local_jd_path)

            if ats_score is not None:
                return {
                    "success": True,
                    "ats_score": ats_score
                }
            else:
                return {
                    "success": False,
                    "ats_score": 0,
                    "error": "Failed to get ATS score"
                }

        finally:
            # Clean up temporary resume file only (JD is using local file)
            try:
                os.unlink(resume_path)
                os.rmdir(temp_dir)
            except Exception as e:
                print(f"Error cleaning up files: {e}")

    except Exception as e:
        print(f"Error in ATS score endpoint with stored JD: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/get-original-ats-score")
async def get_original_ats_score(
    originalResumePath: str = Form(...),
    jobDescriptionPath: str = Form(...)
):
    """
    Endpoint to get ATS score for original resume using stored paths
    This endpoint is specifically designed for the frontend's "Original" ATS score display
    """
    try:
        print(f"🔍 ORIGINAL ATS DEBUG: Original resume path: {originalResumePath}")
        print(f"🔍 ORIGINAL ATS DEBUG: Job description path: {jobDescriptionPath}")

        # Check if original resume file exists locally
        if not os.path.exists(originalResumePath):
            raise HTTPException(status_code=404, detail=f"Original resume file not found at: {originalResumePath}")

        # Convert storage path format to local path format for JD
        if jobDescriptionPath.count('/') >= 1:  # It's a storage path like "session_id/job_description.ext"
            # Extract session info and construct local path
            storage_filename = jobDescriptionPath.split('/')[-1]  # Get filename
            session_id = jobDescriptionPath.split('/')[0].replace('session_', '')

            # New simple structure: "session_id/job_description.ext" -> Local: "jd_[session_id].ext"
            file_extension = storage_filename.split('.')[-1] if '.' in storage_filename else 'txt'
            local_filename = f"jd_{session_id}.{file_extension}"
            local_jd_path = f"/Users/arreyanhamid/Developer/ai-resume/JD/{local_filename}"
        else:
            local_jd_path = jobDescriptionPath

        print(f"🔍 ORIGINAL ATS DEBUG: Using local JD file path: {local_jd_path}")

        # Download JD file from storage to local path if it's a storage path
        if jobDescriptionPath.count('/') >= 1:  # It's a storage path
            try:
                print(f"📥 ORIGINAL ATS: Downloading JD from storage: {jobDescriptionPath}")
                jd_content = await download_file_from_storage(jobDescriptionPath)
                os.makedirs(os.path.dirname(local_jd_path), exist_ok=True)
                with open(local_jd_path, 'wb') as f:
                    f.write(jd_content)
                print(f"✅ ORIGINAL ATS: JD downloaded to {local_jd_path}")
            except Exception as e:
                print(f"❌ ORIGINAL ATS: Error downloading JD from storage: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error downloading job description from storage: {str(e)}")

        # Check if local job description file exists
        if not os.path.exists(local_jd_path):
            raise HTTPException(status_code=404, detail=f"Job description file not found at: {local_jd_path}")

        try:
            # Get ATS score using local files
            print(f"🔍 ORIGINAL ATS DEBUG: Calculating ATS score...")
            ats_score = get_ats_score(originalResumePath, local_jd_path)

            if ats_score is not None:
                print(f"🔍 ORIGINAL ATS DEBUG: Original ATS score: {ats_score}")
                return {
                    "success": True,
                    "ats_score": ats_score
                }
            else:
                return {
                    "success": False,
                    "ats_score": 0,
                    "error": "ATS service returned null score - external API may be down"
                }

        except Exception as ats_error:
            print(f"🔍 ORIGINAL ATS DEBUG: ATS calculation failed: {ats_error}")
            return {
                "success": False,
                "ats_score": 0,
                "error": f"ATS calculation failed: {str(ats_error)}"
            }

    except Exception as e:
        print(f"Error in original ATS score endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/get-original-resume/{file_path:path}")
async def get_original_resume(file_path: str):
    """
    Serve the original resume file from the stored path
    """
    try:
        # Security check: ensure the file path is within expected directories
        if not (file_path.startswith('/tmp/') or file_path.startswith('/Users/arreyanhamid/Developer/ai-resume/')):
            raise HTTPException(status_code=403, detail="Access denied")

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        with open(file_path, 'rb') as file:
            content = file.read()

        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": "inline; filename=original_resume.pdf"}
        )
    except Exception as e:
        print(f"Error serving original resume: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/project/{project_id}/yaml")
async def get_project_yaml(project_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get YAML content and ATS score for a specific project"""
    try:
        user_id = current_user["id"]

        # Get project results from database
        response = supabase_admin.table("project_results").select("yaml_content, ats_score").eq("project_id", project_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Project YAML not found")

        # Verify the project belongs to the user
        project_response = supabase_admin.table("resume_projects").select("user_id").eq("id", project_id).execute()

        if not project_response.data or project_response.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this project")

        project_result = response.data[0]
        yaml_content = project_result["yaml_content"]
        ats_score = project_result.get("ats_score")

        return {
            "yaml_content": yaml_content,
            "ats_score": ats_score
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting project YAML: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/project/{project_id}/calculate-ats")
async def calculate_project_ats(
    project_id: str,
    yaml_content: str = Form(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Calculate ATS score for a project using current YAML content and stored JD"""
    try:
        user_id = current_user["id"]

        # Verify the project belongs to the user
        project_response = supabase_admin.table("resume_projects").select("user_id").eq("id", project_id).execute()

        if not project_response.data or project_response.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this project")

        # Get the job description file from database
        files_response = supabase_admin.table("project_files").select("file_path").eq("project_id", project_id).eq("file_type", "job_description").execute()

        if not files_response.data:
            raise HTTPException(status_code=404, detail="Job description file not found for this project")

        jd_storage_path = files_response.data[0]["file_path"]

        # Download job description file from Supabase Storage
        try:
            jd_response = supabase_admin.storage.from_("user-documents").download(jd_storage_path)
            if not jd_response:
                raise HTTPException(status_code=404, detail="Job description file not found in storage")
        except Exception as storage_error:
            print(f"Error downloading JD from storage: {storage_error}")
            raise HTTPException(status_code=404, detail="Could not download job description file")

        # Create temporary files for processing
        import tempfile
        import shutil

        temp_dir = tempfile.mkdtemp()

        try:
            # Save job description to temp file
            jd_extension = jd_storage_path.split('.')[-1] if '.' in jd_storage_path else 'txt'
            jd_temp_path = os.path.join(temp_dir, f'job_description.{jd_extension}')

            with open(jd_temp_path, 'wb') as jd_file:
                jd_file.write(jd_response)

            print(f"✅ Job description saved to: {jd_temp_path}")

            # Generate PDF from current YAML content
            yaml_temp_path = os.path.join(temp_dir, 'resume.yaml')

            # Copy designs folder for rendering
            source_designs_dir = '/Users/arreyanhamid/Developer/ai-resume/designs'
            target_designs_dir = os.path.join(temp_dir, 'designs')

            try:
                shutil.copytree(source_designs_dir, target_designs_dir)
            except Exception as copy_error:
                print(f"Warning: Could not copy designs folder: {copy_error}")

            # Write YAML content to temp file
            with open(yaml_temp_path, 'w', encoding='utf-8') as f:
                f.write(yaml_content)

            print(f"✅ YAML content saved to: {yaml_temp_path}")

            # Render YAML to PDF using RenderCV
            import subprocess

            try:
                design_file = 'designs/engineeringClassic.yaml'
                command = ['rendercv', 'render', 'resume.yaml', '--design', design_file]

                result = subprocess.run(
                    command,
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.returncode == 0:
                    # Find the generated PDF
                    output_dir = os.path.join(temp_dir, 'rendercv_output')
                    if os.path.exists(output_dir):
                        pdf_files = [f for f in os.listdir(output_dir) if f.endswith('.pdf')]
                        if pdf_files:
                            resume_pdf_path = os.path.join(output_dir, pdf_files[0])
                            print(f"✅ Resume PDF generated: {resume_pdf_path}")

                            # Calculate ATS score
                            print("🔍 Calculating ATS score...")
                            ats_score = get_ats_score(resume_pdf_path, jd_temp_path)

                            if ats_score is not None:
                                print(f"✅ ATS Score calculated: {ats_score}")

                                # Update the project results with new ATS score and YAML content
                                try:
                                    result_saved = await save_project_results(
                                        project_id=project_id,
                                        yaml_content=yaml_content,
                                        ats_score=int(ats_score)
                                    )

                                    if result_saved:
                                        print(f"✅ Project results updated with new ATS score: {ats_score}")
                                    else:
                                        print("❌ Failed to update project results in database")

                                except Exception as db_error:
                                    print(f"❌ Database update error: {db_error}")
                                    # Don't fail the entire request if DB update fails

                                return {"ats_score": ats_score}
                            else:
                                raise HTTPException(status_code=500, detail="Failed to calculate ATS score")
                        else:
                            raise HTTPException(status_code=500, detail="No PDF generated from YAML")
                    else:
                        raise HTTPException(status_code=500, detail="PDF output directory not found")
                else:
                    print(f"❌ RenderCV failed: {result.stderr}")
                    raise HTTPException(status_code=500, detail=f"PDF generation failed: {result.stderr}")

            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=500, detail="PDF generation timed out")
            except Exception as render_error:
                print(f"❌ Error rendering PDF: {render_error}")
                raise HTTPException(status_code=500, detail=f"PDF generation error: {str(render_error)}")

        finally:
            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir)
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temp directory: {cleanup_error}")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating project ATS: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/run-gap-analysis")
async def run_gap_analysis(
    originalResumePath: str = Form(...),
    jobDescriptionPath: str = Form(...),
    project_id: Optional[str] = Form(None)
):
    """
    Execute gap analysis using the reviewCall.py script
    """
    try:
        print(f"🔍 GAP ANALYSIS: Starting analysis...")
        print(f"🔍 GAP ANALYSIS: Raw resume path: {originalResumePath}")
        print(f"🔍 GAP ANALYSIS: Raw JD path: {jobDescriptionPath}")

        # Convert storage paths to local paths if needed

        # Handle original resume path
        if originalResumePath.count('/') >= 1:  # It's a storage path like "session_id/original_resume.pdf"
            storage_filename = originalResumePath.split('/')[-1]
            # New simple structure: "session_id/original_resume.pdf" -> Local: stored in resumes folder
            local_resume_path = f"/Users/arreyanhamid/Developer/ai-resume/resumes/{storage_filename}"
            print(f"🔍 GAP ANALYSIS: Converted resume path: {originalResumePath} -> {local_resume_path}")
        else:
            local_resume_path = originalResumePath

        # Handle job description path
        if jobDescriptionPath.count('/') >= 1:  # It's a storage path like "session_id/job_description.ext"
            storage_filename = jobDescriptionPath.split('/')[-1]
            # New simple structure: "session_id/job_description.ext" -> Local: "jd_[session_id].ext"
            session_id = jobDescriptionPath.split('/')[0].replace('session_', '')
            file_extension = storage_filename.split('.')[-1] if '.' in storage_filename else 'txt'
            local_filename = f"jd_{session_id}.{file_extension}"
            local_jd_path = f"/Users/arreyanhamid/Developer/ai-resume/JD/{local_filename}"
            print(f"🔍 GAP ANALYSIS: Converted JD path: {jobDescriptionPath} -> {local_jd_path}")
        else:
            local_jd_path = jobDescriptionPath

        print(f"🔍 GAP ANALYSIS: Final resume path: {local_resume_path}")
        print(f"🔍 GAP ANALYSIS: Final JD path: {local_jd_path}")

        # Download files from storage to local paths if they don't exist locally
        try:
            # Download resume if it's a storage path
            if originalResumePath.count('/') >= 1:
                print(f"🔍 GAP ANALYSIS: Downloading resume from storage...")
                resume_content = await download_file_from_storage(originalResumePath)
                os.makedirs(os.path.dirname(local_resume_path), exist_ok=True)
                with open(local_resume_path, 'wb') as f:
                    f.write(resume_content)
                print(f"✅ GAP ANALYSIS: Resume downloaded to {local_resume_path}")

            # Download JD if it's a storage path
            if jobDescriptionPath.count('/') >= 1:
                print(f"🔍 GAP ANALYSIS: Downloading JD from storage...")
                jd_content = await download_file_from_storage(jobDescriptionPath)
                os.makedirs(os.path.dirname(local_jd_path), exist_ok=True)
                with open(local_jd_path, 'wb') as f:
                    f.write(jd_content)
                print(f"✅ GAP ANALYSIS: JD downloaded to {local_jd_path}")

        except Exception as e:
            print(f"❌ GAP ANALYSIS: Error downloading files: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error downloading files from storage: {str(e)}")

        # Check if files exist at local paths
        if not os.path.exists(local_resume_path):
            raise HTTPException(status_code=404, detail=f"Resume file not found at local path: {local_resume_path}")

        if not os.path.exists(local_jd_path):
            raise HTTPException(status_code=404, detail=f"Job description file not found at local path: {local_jd_path}")

        # Path to the gap analysis script
        script_path = "/Users/arreyanhamid/Developer/ai-resume/reviewCall.py"

        if not os.path.exists(script_path):
            raise HTTPException(status_code=500, detail="Gap analysis script not found")

        print(f"🔍 GAP ANALYSIS: Executing script with converted paths...")

        # Execute the gap analysis script with local file paths
        process = await asyncio.create_subprocess_exec(
            "python3", script_path, local_resume_path, local_jd_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd="/Users/arreyanhamid/Developer/ai-resume"
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            print(f"❌ GAP ANALYSIS: Script failed with return code {process.returncode}")
            print(f"❌ GAP ANALYSIS: Error: {stderr.decode()}")
            raise HTTPException(
                status_code=500,
                detail=f"Gap analysis failed: {stderr.decode()}"
            )

        print(f"✅ GAP ANALYSIS: Script completed successfully")
        print(f"✅ GAP ANALYSIS: Output: {stdout.decode()[:500]}...")

        # Check if output files were generated
        base_path = "/Users/arreyanhamid/Developer/ai-resume"
        expected_files = ["gap_analysis.md", "upskilling_plan.md", "project_recommendations.md"]
        generated_files = []

        for filename in expected_files:
            file_path = os.path.join(base_path, filename)
            if os.path.exists(file_path):
                generated_files.append(filename)
                print(f"✅ GAP ANALYSIS: Generated {filename}")
            else:
                print(f"⚠️ GAP ANALYSIS: Missing {filename}")

        # If project_id is provided, upload generated files to cloud storage
        if project_id and generated_files:
            try:
                print(f"🔍 GAP ANALYSIS: Uploading files to cloud for project {project_id}")

                # Extract session_id from storage paths if available
                session_id = None
                if originalResumePath.count('/') >= 1:
                    session_id = originalResumePath.split('/')[0].replace('session_', '')
                elif jobDescriptionPath.count('/') >= 1:
                    session_id = jobDescriptionPath.split('/')[0].replace('session_', '')

                # Use project_id as session_id if session_id is not available
                if not session_id:
                    session_id = project_id

                uploaded_files = []
                for filename in generated_files:
                    file_path = os.path.join(base_path, filename)

                    # Read file content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_content = f.read()

                    # Upload to cloud storage with session-based path
                    storage_path = f"session_{session_id}/gap_analysis/{filename}"
                    print(f"🔍 GAP ANALYSIS: Attempting to upload {filename} to {storage_path}")
                    print(f"🔍 GAP ANALYSIS: File content length: {len(file_content)} chars")

                    uploaded_path = await upload_file_to_storage(
                        file_content.encode('utf-8'),
                        storage_path,
                        "text/markdown"
                    )

                    if uploaded_path:
                        uploaded_files.append(uploaded_path)
                        print(f"✅ GAP ANALYSIS: Successfully uploaded {filename} to {storage_path}")
                    else:
                        print(f"❌ GAP ANALYSIS: Failed to upload {filename} to {storage_path}")

                print(f"🔍 GAP ANALYSIS: Total uploaded files: {len(uploaded_files)}")

                # Update project record to mark gap analysis as completed
                if uploaded_files:
                    try:
                        # Update projects table to mark gap analysis as available
                        update_data = {
                            "has_gap_analysis": True,
                            "gap_analysis_files": uploaded_files,
                            "updated_at": datetime.now().isoformat()
                        }

                        response = supabase_admin.table("resume_projects").update(update_data).eq("id", project_id).execute()

                        if response.data:
                            print(f"✅ GAP ANALYSIS: Updated project {project_id} with gap analysis status")
                        else:
                            print(f"⚠️ GAP ANALYSIS: Failed to update project {project_id}")

                    except Exception as db_error:
                        print(f"❌ GAP ANALYSIS: Database update failed: {str(db_error)}")
                        # Don't fail the entire request if DB update fails

                print(f"✅ GAP ANALYSIS: Successfully uploaded {len(uploaded_files)} files to cloud")

            except Exception as upload_error:
                print(f"❌ GAP ANALYSIS: Error uploading to cloud: {str(upload_error)}")
                # Don't fail the entire request if upload fails - gap analysis still completed locally

        return {
            "success": True,
            "message": "Gap analysis completed successfully",
            "generated_files": generated_files,
            "output": stdout.decode(),
            "cloud_uploaded": bool(project_id and generated_files)
        }

    except Exception as e:
        print(f"❌ GAP ANALYSIS: Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gap analysis error: {str(e)}")

@app.get("/get-gap-analysis-content/{file_type}")
async def get_gap_analysis_content(
    file_type: str,
    project_id: Optional[str] = None
):
    """
    Get gap analysis file content as JSON for rendering in the frontend
    """
    try:
        # Map file types to actual filenames and titles
        file_mapping = {
            "gap-analysis": {
                "filename": "gap_analysis.md",
                "title": "Gap Analysis"
            },
            "upskill": {
                "filename": "upskilling_plan.md",
                "title": "Upskilling Plan"
            },
            "project-recommendations": {
                "filename": "project_recommendations.md",
                "title": "Project Recommendations"
            }
        }

        if file_type not in file_mapping:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Available: {list(file_mapping.keys())}"
            )

        file_info = file_mapping[file_type]
        filename = file_info["filename"]
        title = file_info["title"]

        content = None

        # If project_id is provided, try to fetch from cloud storage first
        if project_id:
            try:
                print(f"🔍 GET CONTENT: Fetching from cloud for project {project_id}")

                # Try to find the file in cloud storage
                storage_path = f"session_{project_id}/{filename}"

                try:
                    content_bytes = await download_file_from_storage(storage_path)
                    content = content_bytes.decode('utf-8')
                    print(f"✅ GET CONTENT: Found {filename} in cloud storage")
                except Exception as storage_error:
                    print(f"⚠️ GET CONTENT: Cloud storage error: {str(storage_error)}")
                    # Fall back to local file if cloud storage fails
                    content = None

            except Exception as e:
                print(f"⚠️ GET CONTENT: Error accessing cloud storage: {str(e)}")
                content = None

        # If no content from cloud storage, try local file
        if content is None:
            file_path = f"/Users/arreyanhamid/Developer/ai-resume/{filename}"

            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"File {filename} not found. Run gap analysis first."
                )

            # Read file content from local file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"✅ GET CONTENT: Found {filename} in local storage")

        # Return content as JSON
        return {
            "success": True,
            "title": title,
            "content": content,
            "file_type": file_type
        }

    except Exception as e:
        print(f"❌ GET CONTENT: Error getting {file_type} content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Content retrieval error: {str(e)}")

@app.post("/run-gap-analysis-cloud")
async def run_gap_analysis_cloud(
    project_id: str = Form(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Execute gap analysis for a cloud project by fetching stored resume and JD
    """
    try:
        user_id = current_user["id"]
        print(f"🔍 CLOUD GAP ANALYSIS: Starting analysis for project {project_id}")

        # Get project details and stored files
        project_response = supabase_admin.table("resume_projects").select("*").eq("id", project_id).eq("user_id", user_id).execute()

        if not project_response.data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = project_response.data[0]
        print(f"🔍 CLOUD GAP ANALYSIS: Project data: {project}")

        # Files are stored in Supabase storage bucket with pattern: session_{project_id}/original_resume.pdf and session_{project_id}/job_description.{txt|pdf}
        session_folder = f"session_{project_id}"
        storage_resume_path = f"{session_folder}/original_resume.pdf"

        # Try to determine JD file extension by attempting to download each type
        jd_extension = None
        storage_jd_path = None
        jd_response = None
        
        # Try .txt first (for pasted text), then .pdf (for uploaded files)
        for ext in ['txt', 'pdf']:
            test_jd_path = f"{session_folder}/job_description.{ext}"
            try:
                print(f"🔍 CLOUD GAP ANALYSIS: Trying to download JD as .{ext} file...")
                test_response = supabase_admin.storage.from_("user-documents").download(test_jd_path)
                if test_response:
                    storage_jd_path = test_jd_path
                    jd_extension = ext
                    jd_response = test_response
                    print(f"✅ CLOUD GAP ANALYSIS: Found JD file with extension: .{ext}")
                    break
            except Exception as e:
                print(f"🔍 CLOUD GAP ANALYSIS: JD file not found as .{ext}: {e}")
                continue
                
        if not storage_jd_path:
            raise HTTPException(status_code=404, detail=f"Job description file not found in storage (tried both .txt and .pdf)")

        print(f"🔍 CLOUD GAP ANALYSIS: Storage resume path: {storage_resume_path}")
        print(f"🔍 CLOUD GAP ANALYSIS: Storage JD path: {storage_jd_path}")

        # Download files from Supabase storage to local temp paths
        import tempfile
        temp_dir = tempfile.mkdtemp()
        local_resume_path = os.path.join(temp_dir, "original_resume.pdf")
        local_jd_path = os.path.join(temp_dir, f"job_description.{jd_extension}")

        try:
            # Download resume from storage
            print("🔍 CLOUD GAP ANALYSIS: Downloading resume from storage...")
            resume_response = supabase_admin.storage.from_("user-documents").download(storage_resume_path)
            if resume_response:
                with open(local_resume_path, "wb") as f:
                    f.write(resume_response)
                print(f"✅ CLOUD GAP ANALYSIS: Resume downloaded to {local_resume_path}")
            else:
                raise HTTPException(status_code=404, detail=f"Resume file not found in storage: {storage_resume_path}")

            # Save the already-downloaded JD to local file
            print(f"🔍 CLOUD GAP ANALYSIS: Saving JD to local file: {local_jd_path}")
            with open(local_jd_path, "wb") as f:
                f.write(jd_response)
            print(f"✅ CLOUD GAP ANALYSIS: JD saved to {local_jd_path}")

        except Exception as download_error:
            print(f"❌ CLOUD GAP ANALYSIS: Error downloading files: {download_error}")
            raise HTTPException(status_code=404, detail=f"Could not download project files from storage: {str(download_error)}")

        # Use existing gap analysis framework
        print(f"🔍 CLOUD GAP ANALYSIS: Executing analysis using reviewCall.py...")

        # Import and use the existing reviewCall framework
        import sys
        sys.path.append("/Users/arreyanhamid/Developer/ai-resume")

        from reviewCall import run_with_custom_paths

        # Change to the correct working directory before running analysis
        original_cwd = os.getcwd()
        target_dir = "/Users/arreyanhamid/Developer/ai-resume"

        print(f"🔍 CLOUD GAP ANALYSIS: Changing to directory: {target_dir}")
        os.chdir(target_dir)

        try:
            # Run the gap analysis using your existing framework
            print(f"🔍 CLOUD GAP ANALYSIS: Running reviewCall with paths:")
            print(f"  Resume: {local_resume_path}")
            print(f"  Job Description: {local_jd_path}")

            final_result = run_with_custom_paths(local_resume_path, local_jd_path)
        finally:
            # Always restore the original working directory
            os.chdir(original_cwd)

        if final_result:
            print("✅ CLOUD GAP ANALYSIS: Analysis completed successfully using reviewCall framework")

            # The reviewCall framework should have generated the markdown files
            # Check if the files were created by the existing framework
            gap_analysis_dir = "/Users/arreyanhamid/Developer/ai-resume"
            expected_files = ["gap_analysis.md", "upskilling_plan.md", "project_recommendations.md"]

            # If files don't exist, create them with the final result
            if not os.path.exists(f"{gap_analysis_dir}/gap_analysis.md"):
                print("🔍 CLOUD GAP ANALYSIS: Creating gap_analysis.md from reviewCall result")
                with open(f"{gap_analysis_dir}/gap_analysis.md", "w", encoding="utf-8") as f:
                    f.write(str(final_result))

            # Ensure other files exist (they should be created by your review framework)
            if not os.path.exists(f"{gap_analysis_dir}/upskilling_plan.md"):
                print("🔍 CLOUD GAP ANALYSIS: upskilling_plan.md not found, creating placeholder")
                with open(f"{gap_analysis_dir}/upskilling_plan.md", "w", encoding="utf-8") as f:
                    f.write("# Upskilling Plan\n\nGenerated by reviewCall framework. Check main gap analysis for details.")

            if not os.path.exists(f"{gap_analysis_dir}/project_recommendations.md"):
                print("🔍 CLOUD GAP ANALYSIS: project_recommendations.md not found, creating placeholder")
                with open(f"{gap_analysis_dir}/project_recommendations.md", "w", encoding="utf-8") as f:
                    f.write("# Project Recommendations\n\nGenerated by reviewCall framework. Check main gap analysis for details.")
        else:
            print("❌ CLOUD GAP ANALYSIS: reviewCall framework returned no results")
            raise Exception("Gap analysis failed - reviewCall returned no results")

        # Update project in database to mark it has gap analysis
        print(f"🔍 CLOUD GAP ANALYSIS: Updating project {project_id} gap analysis status...")
        gap_analysis_updated = await update_project_gap_analysis(project_id, True)

        if gap_analysis_updated:
            print("✅ CLOUD GAP ANALYSIS: Project gap analysis status updated successfully")
        else:
            print("⚠️ CLOUD GAP ANALYSIS: Failed to update project gap analysis status")

        # Upload markdown files to cloud storage in session-specific folder
        print(f"🔍 CLOUD GAP ANALYSIS: Uploading markdown files to cloud storage...")
        session_folder = f"session_{project_id}"
        gap_analysis_dir = "/Users/arreyanhamid/Developer/ai-resume"
        markdown_files = ["gap_analysis.md", "upskilling_plan.md", "project_recommendations.md"]
        uploaded_files = []
        
        for filename in markdown_files:
            local_file_path = f"{gap_analysis_dir}/{filename}"
            if os.path.exists(local_file_path):
                try:
                    # Read the markdown file
                    with open(local_file_path, "rb") as f:
                        file_content = f.read()
                    
                    # Upload to cloud storage in session folder
                    storage_path = f"{session_folder}/{filename}"
                    upload_response = supabase_admin.storage.from_("user-documents").upload(
                        path=storage_path,
                        file=file_content,
                        file_options={"content-type": "text/plain", "upsert": "true"}
                    )
                    
                    if upload_response:
                        print(f"✅ CLOUD GAP ANALYSIS: Uploaded {filename} to {storage_path}")
                        uploaded_files.append(filename)
                    else:
                        print(f"⚠️ CLOUD GAP ANALYSIS: Failed to upload {filename}")
                        
                except Exception as upload_error:
                    print(f"❌ CLOUD GAP ANALYSIS: Error uploading {filename}: {upload_error}")
            else:
                print(f"⚠️ CLOUD GAP ANALYSIS: File not found: {local_file_path}")

        print("✅ CLOUD GAP ANALYSIS: Analysis completed and saved")

        return {
            "success": True,
            "message": "Gap analysis completed successfully",
            "project_id": project_id,
            "files_generated": uploaded_files,
            "storage_location": session_folder
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ CLOUD GAP ANALYSIS: Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cloud gap analysis error: {str(e)}")
    finally:
        # Clean up temporary directory
        try:
            if 'temp_dir' in locals():
                import shutil
                shutil.rmtree(temp_dir)
                print(f"🧹 CLOUD GAP ANALYSIS: Cleaned up temp directory: {temp_dir}")
        except Exception as cleanup_error:
            print(f"⚠️ CLOUD GAP ANALYSIS: Error cleaning up temp files: {cleanup_error}")

@app.get("/download-gap-analysis/{file_type}")
async def download_gap_analysis_file(file_type: str, project_id: Optional[str] = None):
    """
    Download generated gap analysis files from cloud storage or local backup
    """
    try:
        # Map file types to actual filenames
        file_mapping = {
            "gap-analysis": "gap_analysis.md",
            "upskill": "upskilling_plan.md",
            "project-recommendations": "project_recommendations.md"
        }

        if file_type not in file_mapping:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Available: {list(file_mapping.keys())}"
            )

        filename = file_mapping[file_type]
        content = None

        # Try to fetch from cloud storage first if project_id is provided
        if project_id:
            try:
                print(f"🔍 DOWNLOAD: Fetching {filename} from cloud storage for project {project_id}")
                storage_path = f"session_{project_id}/{filename}"
                
                # Download from cloud storage
                file_response = supabase_admin.storage.from_("user-documents").download(storage_path)
                if file_response:
                    content = file_response.decode('utf-8')
                    print(f"✅ DOWNLOAD: Found {filename} in cloud storage")
                else:
                    print(f"⚠️ DOWNLOAD: File not found in cloud storage: {storage_path}")
                    
            except Exception as storage_error:
                print(f"⚠️ DOWNLOAD: Cloud storage error: {storage_error}")

        # Fallback to local file if cloud storage fails or no project_id provided
        if content is None:
            print(f"🔍 DOWNLOAD: Trying local file for {filename}")
            file_path = f"/Users/arreyanhamid/Developer/ai-resume/{filename}"
            
            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"File {filename} not found in cloud storage or local directory. Run gap analysis first."
                )

            # Read file content from local file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"✅ DOWNLOAD: Found {filename} in local directory")

        # Return file for download
        return Response(
            content=content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except Exception as e:
        print(f"❌ DOWNLOAD: Error downloading {file_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

@app.get("/download-job-description/{project_id}")
async def download_job_description(project_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Download the job description file for a specific project
    """
    try:
        user_id = current_user["id"]

        # Verify project belongs to user
        project_response = supabase_admin.table("resume_projects").select("user_id").eq("id", project_id).execute()
        if not project_response.data or project_response.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this project")

        # Get the job description file from database
        files_response = supabase_admin.table("project_files").select("file_path, file_name").eq("project_id", project_id).eq("file_type", "job_description").execute()
        if not files_response.data:
            raise HTTPException(status_code=404, detail="Job description file not found for this project")

        jd_storage_path = files_response.data[0]["file_path"]
        jd_file_name = files_response.data[0]["file_name"]

        # Download job description file from Supabase Storage
        try:
            jd_response = supabase_admin.storage.from_("user-documents").download(jd_storage_path)
            if not jd_response:
                raise HTTPException(status_code=404, detail="Job description file not found in storage")
        except Exception as storage_error:
            print(f"Error downloading JD from storage: {storage_error}")
            raise HTTPException(status_code=404, detail="Could not download job description file")

        # Determine content type based on file extension
        file_extension = jd_file_name.split('.')[-1].lower() if '.' in jd_file_name else 'txt'
        content_type_mapping = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        content_type = content_type_mapping.get(file_extension, 'application/octet-stream')

        # Return file for download
        return Response(
            content=jd_response,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={jd_file_name}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DOWNLOAD JD: Error downloading job description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)