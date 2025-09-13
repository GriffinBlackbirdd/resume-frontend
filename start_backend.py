#!/usr/bin/env python3
"""
Script to start the FastAPI backend server
"""

import uvicorn
import sys
import os

# Add the ai-resume path to sys.path
sys.path.append('/Users/arreyanhamid/Developer/ai-resume')

def main():
    print("Starting FastAPI backend server...")
    print("Backend will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Health check at: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        uvicorn.run(
            "simple_fastapi_backend:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()