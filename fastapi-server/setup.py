#!/usr/bin/env python3
"""
Setup script for RenderCV API server
"""
import subprocess
import sys
import os

def run_command(command):
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("Setting up RenderCV API Server...")
    print("=" * 50)
    
    # Check if we're in a virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: You're not in a virtual environment!")
        print("It's recommended to create one:")
        print("python -m venv venv")
        print("source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
        print()
        
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Setup cancelled.")
            return
    
    # Install dependencies
    print("Installing Python dependencies...")
    if not run_command("pip install -r requirements.txt"):
        print("Failed to install dependencies!")
        return
    
    # Check if rendercv is properly installed
    print("\nTesting RenderCV installation...")
    if run_command("rendercv --version"):
        print("✓ RenderCV is installed and working!")
    else:
        print("⚠️  RenderCV installation may have issues.")
        print("You can still use the API with mock PDF generation.")
    
    print("\n" + "=" * 50)
    print("Setup complete! 🎉")
    print("\nTo start the server:")
    print("python main.py")
    print("\nOr with auto-reload:")
    print("uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("\nThe API will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")

if __name__ == "__main__":
    main()