#!/usr/bin/env python3

"""
ReviewCall.py - Main entry point for running gap analysis on resume and job description
"""

from review import GapAnalysisCrew, takeInputs
import sys
import os

def main():
    """
    Main function to run gap analysis between resume and job description
    """
    # Default paths (you can modify these or make them command line arguments)
    resume_path = "/Users/arreyanhamid/Developer/ai-resume/resumes/Garv.pdf"
    jd_path = "/Users/arreyanhamid/Developer/ai-resume/JD/AIJD.pdf"
    
    # Check if files exist
    if not os.path.exists(resume_path):
        print(f"Error: Resume file not found at {resume_path}")
        return
    
    if not os.path.exists(jd_path):
        print(f"Error: Job description file not found at {jd_path}")
        return
    
    print("Starting gap analysis...")
    print(f"Resume: {resume_path}")
    print(f"Job Description: {jd_path}")
    print("-" * 50)
    
    try:
        # Extract text from resume and job description PDFs
        jd_text, resume_text = takeInputs(resume_path, jd_path)
        
        if not resume_text:
            print("Error: Could not extract text from resume")
            return
        
        if not jd_text:
            print("Error: Could not extract text from job description")
            return
        
        print("Successfully extracted text from both documents")
        print(f"Resume text length: {len(resume_text)} characters")
        print(f"Job description text length: {len(jd_text)} characters")
        print("-" * 50)
        
        # Create crew instance and run analysis
        print("Initializing Gap Analysis Crew...")
        crew_instance = GapAnalysisCrew()
        
        print("Running gap analysis...")
        final_result = crew_instance.crew().kickoff(inputs={
            "resume": resume_text, 
            "jd": jd_text
        })
        
        # Display results
        print("\n" + "=" * 60)
        print("FINAL GAP ANALYSIS REPORT")
        print("=" * 60)
        print(final_result)
        print("=" * 60)
        
    except Exception as e:
        print(f"An error occurred during analysis: {str(e)}")
        import traceback
        traceback.print_exc()

def run_with_custom_paths(resume_path, jd_path):
    """
    Run gap analysis with custom file paths
    
    Args:
        resume_path (str): Path to the resume PDF file
        jd_path (str): Path to the job description PDF file
    """
    if not os.path.exists(resume_path):
        print(f"Error: Resume file not found at {resume_path}")
        return
    
    if not os.path.exists(jd_path):
        print(f"Error: Job description file not found at {jd_path}")
        return
    
    print("Starting gap analysis with custom paths...")
    print(f"Resume: {resume_path}")
    print(f"Job Description: {jd_path}")
    print("-" * 50)
    
    try:
        # Extract text from resume and job description PDFs
        jd_text, resume_text = takeInputs(resume_path, jd_path)
        
        if not resume_text or not jd_text:
            print("Error: Could not extract text from one or both documents")
            return
        
        print("Successfully extracted text from both documents")
        print("-" * 50)
        
        # Create crew instance and run analysis
        crew_instance = GapAnalysisCrew()
        final_result = crew_instance.crew().kickoff(inputs={
            "resume": resume_text, 
            "jd": jd_text
        })
        
        # Display results
        print("\n" + "=" * 60)
        print("FINAL GAP ANALYSIS REPORT")
        print("=" * 60)
        print(final_result)
        print("=" * 60)
        
        return final_result
        
    except Exception as e:
        print(f"An error occurred during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Check for command line arguments
    if len(sys.argv) == 3:
        resume_path = sys.argv[1]
        jd_path = sys.argv[2]
        run_with_custom_paths(resume_path, jd_path)
    elif len(sys.argv) == 1:
        main()
    else:
        print("Usage:")
        print("  python reviewCall.py                    # Use default paths")
        print("  python reviewCall.py <resume_path> <jd_path>  # Use custom paths")
        print("")
        print("Examples:")
        print("  python reviewCall.py")
        print("  python reviewCall.py ./my_resume.pdf ./job_description.pdf")
