from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import shutil
import pypdf
import asyncio
import json
from typing import Optional

# Import the agent workflow components
import sys
sys.path.append('/Users/arreyanhamid/Developer/ai-resume')

from agno.agent import Agent, RunResponse
from agno.team import Team
from agno.models.google import Gemini
from agno.media import File as AgnoFile
from agno.tools.googlesearch import GoogleSearchTools

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF file"""
    with open(file_path, "rb") as f:
        reader = pypdf.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text

def run_gap_analysis_workflow(resume_text: str, job_description: str, job_role: str, user_data: dict) -> str:
    """Run the gap analysis workflow using the agent team"""
    
    # Gap analyzer agent
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

    user_info = f"Email: {user_data.get('email', '')}, Phone: {user_data.get('phone', '')}, LinkedIn: {user_data.get('linkedin', '')}, GitHub: {user_data.get('github', '')}"
    
    response = team_leader.run(
        f"Analyze my resume vs JD for {job_role} role: give me a gap table, an actionable upskilling plan, and trending project ideas. "
        f"User info: {user_info}. "
        f"JD: {job_description}, "
        f"Resume: {resume_text}"
    )
    
    return response.content

@app.post("/gap-analysis")
async def analyze_gap(
    email: str = Form(...),
    phone: str = Form(...),
    linkedin: str = Form(...),
    github: str = Form(...),
    jobRole: str = Form(...),
    resumeFile: UploadFile = File(...),
    jobDescriptionFile: UploadFile = File(...)
):
    """
    Endpoint to analyze resume gap against job description
    """
    
    print(f"Received gap analysis request for job role: {jobRole}")
    print(f"Resume file: {resumeFile.filename}")
    print(f"JD file: {jobDescriptionFile.filename}")
    
    try:
        # Validate file types
        if not resumeFile.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")
        
        allowed_jd_extensions = ['.pdf', '.docx', '.txt']
        if not any(jobDescriptionFile.filename.endswith(ext) for ext in allowed_jd_extensions):
            raise HTTPException(status_code=400, detail="Job description must be PDF, DOCX, or TXT")

        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as resume_temp:
            shutil.copyfileobj(resumeFile.file, resume_temp)
            resume_temp_path = resume_temp.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{jobDescriptionFile.filename.split(".")[-1]}') as jd_temp:
            shutil.copyfileobj(jobDescriptionFile.file, jd_temp)
            jd_temp_path = jd_temp.name

        try:
            # Extract text from resume
            resume_text = extract_pdf_text(resume_temp_path)
            
            # Extract text from job description (for now, only handling PDF)
            if jobDescriptionFile.filename.endswith('.pdf'):
                job_description_text = extract_pdf_text(jd_temp_path)
            elif jobDescriptionFile.filename.endswith('.txt'):
                with open(jd_temp_path, 'r', encoding='utf-8') as f:
                    job_description_text = f.read()
            else:
                # For .docx files, we'd need python-docx library
                raise HTTPException(status_code=400, detail="DOCX support coming soon")

            # Prepare user data
            user_data = {
                'email': email,
                'phone': phone,
                'linkedin': linkedin,
                'github': github,
                'jobRole': jobRole
            }

            # Run the gap analysis workflow
            analysis_result = run_gap_analysis_workflow(
                resume_text, 
                job_description_text, 
                jobRole, 
                user_data
            )

            return {
                "success": True,
                "analysis": analysis_result,
                "userData": user_data
            }

        finally:
            # Clean up temporary files
            try:
                os.unlink(resume_temp_path)
                os.unlink(jd_temp_path)
            except Exception as e:
                print(f"Error cleaning up temp files: {e}")

    except Exception as e:
        print(f"Error in gap analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)