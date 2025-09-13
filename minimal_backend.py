from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/gap-analysis")
async def gap_analysis(
    email: str = Form(...),
    phone: str = Form(...),
    linkedin: str = Form(...),
    github: str = Form(...),
    jobRole: str = Form(...),
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...)
):
    print(f"Received request for {jobRole}")
    
    # Save files temporarily
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as resume_tmp:
        resume_tmp.write(await resumeFile.read())
        resume_path = resume_tmp.name
    
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as jd_tmp:
        jd_tmp.write(await jobDescriptionFile.read())
        jd_path = jd_tmp.name
    
    try:
        # Call your existing review.py script
        # You'll need to modify this part to call your script properly
        result = subprocess.run([
            "python3", "/Users/arreyanhamid/Developer/ai-resume/review.py"
        ], capture_output=True, text=True, timeout=300)
        
        analysis = result.stdout if result.returncode == 0 else "Analysis failed"
        
        return {
            "success": True,
            "analysis": analysis,
            "userData": {"email": email, "jobRole": jobRole}
        }
    finally:
        # Clean up
        os.unlink(resume_path)
        os.unlink(jd_path)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)