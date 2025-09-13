#!/usr/bin/env python3
"""
Startup script for the Resume Builder API with Authentication
"""

import subprocess
import sys
import os

def install_dependencies():
    """Install required Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = ".env"
    env_example_file = ".env.example"
    
    if not os.path.exists(env_file) and os.path.exists(env_example_file):
        print("📝 Creating .env file from template...")
        try:
            with open(env_example_file, 'r') as f:
                content = f.read()
            
            with open(env_file, 'w') as f:
                f.write(content)
            
            print("✅ .env file created successfully")
            print("⚠️  Please update the JWT_SECRET_KEY in .env for production use")
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
    elif os.path.exists(env_file):
        print("✅ .env file already exists")

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Resume Builder API with Authentication...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API documentation: http://localhost:8000/docs")
    print("🔑 Authentication endpoints:")
    print("   - POST /auth/signup")
    print("   - POST /auth/login") 
    print("   - POST /auth/logout")
    print("   - GET /auth/me")
    print("   - GET /auth/verify-token")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        # Use the updated final server with authentication
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "final_fastapi_server:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")

def main():
    """Main function"""
    print("🏗️  Resume Builder API with Supabase Authentication")
    print("=" * 50)
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Create env file
    create_env_file()
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()