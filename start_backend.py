#!/usr/bin/env python3
"""
Backend server startup script for production deployment.
This script ensures the backend starts properly with all dependencies.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are installed."""
    required_packages = [
        'fastapi',
        'uvicorn',
        'python-multipart',
        'jinja2',
        'pyyaml',
        'google-genai',
        'googlesearch-python'
    ]

    missing_packages = []

    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"Installing missing packages: {', '.join(missing_packages)}")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)

    print("✅ All dependencies are installed")

def create_upload_directory():
    """Create uploads directory if it doesn't exist."""
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    print(f"✅ Upload directory created at {upload_dir}")

def start_server():
    """Start the FastAPI server."""
    print("🚀 Starting FastAPI server...")

    # Get host and port from environment or use defaults
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8000'))

    # Start uvicorn server
    cmd = [
        sys.executable,
        '-m',
        'uvicorn',
        'server:app',
        '--host', host,
        '--port', str(port),
        '--reload' if os.getenv('ENVIRONMENT') == 'development' else '',
        '--workers', '1' if os.getenv('ENVIRONMENT') == 'development' else '4'
    ]

    # Filter out empty strings from cmd
    cmd = [arg for arg in cmd if arg]

    print(f"Server starting on http://{host}:{port}")
    print("Press Ctrl+C to stop the server")

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

def main():
    """Main function to start the backend server."""
    print("🎯 Resume Builder Backend Startup")
    print("=================================")

    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Check dependencies
    check_dependencies()

    # Create necessary directories
    create_upload_directory()

    # Start the server
    start_server()

if __name__ == "__main__":
    main()