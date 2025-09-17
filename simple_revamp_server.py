from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://stable-dane-quickly.ngrok-free.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/revamp-existing")
async def revamp_existing(
    email: str = Form(...),
    phone: str = Form(...),
    linkedin: str = Form(...),
    github: str = Form(...),
    jobRole: str = Form(...),
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...)
):
    print(f"Received revamp request for job role: {jobRole}")
    
    # Save files temporarily
    timestamp = str(int(time.time()))
    resume_path = f"/Users/arreyanhamid/Developer/ai-resume/resumes/resume_{timestamp}.pdf"
    jd_path = f"/Users/arreyanhamid/Developer/ai-resume/JD/jd_{timestamp}.pdf"
    
    # Save files
    with open(resume_path, "wb") as buffer:
        shutil.copyfileobj(resumeFile.file, buffer)
    with open(jd_path, "wb") as buffer:
        shutil.copyfileobj(jobDescriptionFile.file, buffer)
    
    print(f"Saved files: {resume_path}, {jd_path}")
    
    # Import and call revamp function
    import sys
    sys.path.append('/Users/arreyanhamid/Developer/ai-resume')
    from main import revamp
    
    # Call revamp function
    result = revamp(resume_path, jobRole, jd_path)
    
    # Read the generated YAML
    yaml_content = ""
    if os.path.exists("resume.yaml"):
        with open("resume.yaml", "r", encoding="utf-8") as f:
            yaml_content = f.read()
    
    # Clean up temp files
    try:
        os.unlink(resume_path)
        os.unlink(jd_path)
    except:
        pass
        
    return {
        "success": True,
        "yamlContent": yaml_content,
        "userData": {
            "email": email,
            "phone": phone,
            "linkedin": linkedin,
            "github": github,
            "jobRole": jobRole
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)