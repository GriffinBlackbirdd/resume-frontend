from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import os
import tempfile
import subprocess
import yaml
import asyncio
from pathlib import Path
import shutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading
import time

app = FastAPI(title="RenderCV API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeData(BaseModel):
    yamlContent: str

class FileWatcher(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback
        self.last_modified = 0
        
    def on_modified(self, event):
        if event.is_directory:
            return
        
        # Debounce rapid file changes
        current_time = time.time()
        if current_time - self.last_modified < 1:  # 1 second debounce
            return
        self.last_modified = current_time
        
        if event.src_path.endswith('.yaml'):
            self.callback(event.src_path)

# Global variables for file watching
current_observer = None
current_temp_dir = None

def create_default_design():
    """Create a default classic design configuration for embedding"""
    return {
        'theme': 'classic'
    }

def render_resume_with_rendercv(yaml_content: str, work_dir: str) -> str:
    """Render resume using RenderCV Python API"""
    try:
        # Try using RenderCV Python API first
        try:
            import rendercv.api as rcv_api
            import rendercv.data_models as dm
            
            # Parse the YAML content
            resume_data = yaml.safe_load(yaml_content)
            
            # Restructure data to match RenderCV format
            if 'sections' in resume_data and 'sections' not in resume_data.get('cv', {}):
                # Move sections from top level to cv.sections
                if 'cv' not in resume_data:
                    resume_data['cv'] = {}
                resume_data['cv']['sections'] = resume_data.pop('sections')
            
            # Add design to resume data if not already present
            if 'design' not in resume_data:
                resume_data['design'] = create_default_design()
            
            print("Using RenderCV Python API...")
            
            # Use RenderCV API to render
            pdf_path = os.path.join(work_dir, 'resume.pdf')
            rcv_api.render_cv(
                cv_data=resume_data,
                output_file_path=pdf_path,
                design=resume_data.get('design', create_default_design())
            )
            
            if os.path.exists(pdf_path):
                print(f"RenderCV API generated PDF: {pdf_path}")
                return pdf_path
            
        except ImportError:
            print("RenderCV Python API not available, falling back to command line...")
        
        # Fallback to command line approach
        yaml_path = os.path.join(work_dir, 'resume.yaml')
        
        # Parse the YAML content
        resume_data = yaml.safe_load(yaml_content)
        
        # Restructure data to match RenderCV format
        if 'sections' in resume_data and 'sections' not in resume_data.get('cv', {}):
            # Move sections from top level to cv.sections
            if 'cv' not in resume_data:
                resume_data['cv'] = {}
            resume_data['cv']['sections'] = resume_data.pop('sections')
        
        # Add design to resume data if not already present
        if 'design' not in resume_data:
            resume_data['design'] = create_default_design()
        
        # Write the combined YAML 
        with open(yaml_path, 'w') as yaml_file:
            yaml.dump(resume_data, yaml_file, default_flow_style=False)
        
        # Execute RenderCV command with shorter timeout
        cmd = ['rendercv', 'render', 'resume.yaml']
        
        print(f"Executing command: {' '.join(cmd)} in directory: {work_dir}")
        
        result = subprocess.run(
            cmd,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=15  # Reduced timeout
        )
        
        print(f"RenderCV output: {result.stdout}")
        if result.stderr:
            print(f"RenderCV error: {result.stderr}")
        
        # Check for rendercv_output folder
        output_dir = os.path.join(work_dir, 'rendercv_output')
        if os.path.exists(output_dir):
            # Find PDF files in the output directory
            for file in os.listdir(output_dir):
                if file.endswith('.pdf'):
                    pdf_path = os.path.join(output_dir, file)
                    print(f"Found PDF: {pdf_path}")
                    return pdf_path
        
        return None
            
    except subprocess.TimeoutExpired:
        print("RenderCV command timed out")
        return None
    except Exception as e:
        print(f"Error rendering resume: {str(e)}")
        return None

async def auto_render_callback(yaml_path: str):
    """Callback for file watcher to auto-render on changes"""
    try:
        if current_temp_dir and yaml_path.endswith('.yaml'):
            with open(yaml_path, 'r') as f:
                yaml_content = f.read()
            pdf_path = render_resume_with_rendercv(yaml_content, current_temp_dir)
            if pdf_path:
                print(f"Auto-rendered resume due to file change: {yaml_path} -> {pdf_path}")
            else:
                print(f"Failed to auto-render resume: {yaml_path}")
    except Exception as e:
        print(f"Error in auto-render callback: {str(e)}")

@app.post("/render-resume")
async def render_resume(data: ResumeData):
    global current_observer, current_temp_dir
    
    try:
        # Stop existing observer if running
        if current_observer:
            current_observer.stop()
            current_observer.join()
        
        # Create temporary directory
        if current_temp_dir:
            shutil.rmtree(current_temp_dir, ignore_errors=True)
            
        current_temp_dir = tempfile.mkdtemp(prefix="rendercv_")
        
        # Render the resume
        pdf_path = render_resume_with_rendercv(data.yamlContent, current_temp_dir)
        
        if pdf_path and os.path.exists(pdf_path):
            # Set up file watcher for auto-refresh
            event_handler = FileWatcher(auto_render_callback)
            current_observer = Observer()
            current_observer.schedule(event_handler, current_temp_dir, recursive=True)
            current_observer.start()
            
            # Return the PDF file from rendercv_output folder
            return FileResponse(
                pdf_path,
                media_type='application/pdf',
                filename='resume.pdf'
            )
        else:
            print("RenderCV failed, creating mock PDF...")
            # Return mock PDF if RenderCV fails
            mock_pdf = create_mock_pdf(data.yamlContent)
            return Response(
                content=mock_pdf,
                media_type='application/pdf',
                headers={'Content-Disposition': 'inline; filename=resume.pdf'}
            )
            
    except Exception as e:
        print(f"Error in render_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rendering resume: {str(e)}")

def create_mock_pdf(yaml_content: str) -> bytes:
    """Create a simple mock PDF when RenderCV is not available"""
    
    # Extract name from YAML if possible
    try:
        data = yaml.safe_load(yaml_content)
        name = data.get('cv', {}).get('name', 'Resume')
    except:
        name = 'Resume'
    
    mock_content = f'''%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Length 300
>>
stream
BT
/F1 16 Tf
72 720 Td
({name}) Tj
0 -30 Td
/F1 12 Tf
(Resume Preview - Install RenderCV for full rendering) Tj
0 -20 Td
(Command: pip install rendercv) Tj
0 -40 Td
(Your YAML content:) Tj
0 -20 Td
/F1 10 Tf
(Length: {len(yaml_content)} characters) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
750
%%EOF'''
    
    return mock_content.encode('utf-8')

@app.get("/get-latest-pdf")
async def get_latest_pdf():
    """Get the latest rendered PDF from rendercv_output folder"""
    global current_temp_dir
    
    if not current_temp_dir:
        raise HTTPException(status_code=404, detail="No resume has been rendered yet")
    
    output_dir = os.path.join(current_temp_dir, 'rendercv_output')
    if not os.path.exists(output_dir):
        raise HTTPException(status_code=404, detail="No rendercv_output folder found")
    
    # Find the latest PDF file
    pdf_files = [f for f in os.listdir(output_dir) if f.endswith('.pdf')]
    if not pdf_files:
        raise HTTPException(status_code=404, detail="No PDF files found in rendercv_output")
    
    # Get the most recently modified PDF
    latest_pdf = max(pdf_files, key=lambda f: os.path.getmtime(os.path.join(output_dir, f)))
    pdf_path = os.path.join(output_dir, latest_pdf)
    
    return FileResponse(
        pdf_path,
        media_type='application/pdf',
        filename='resume.pdf'
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "RenderCV API is running"}

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    global current_observer, current_temp_dir
    
    if current_observer:
        current_observer.stop()
        current_observer.join()
    
    if current_temp_dir:
        shutil.rmtree(current_temp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)