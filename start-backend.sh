#!/bin/bash

echo "🚀 Starting Resume Builder Backend"
echo "=================================="

# Navigate to fastapi directory
cd fastapi-server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if rendercv is installed
echo "🔍 Checking RenderCV installation..."
if command -v rendercv &> /dev/null; then
    echo "✅ RenderCV is installed: $(rendercv --version)"
else
    echo "⚠️  RenderCV not found. Installing..."
    pip install rendercv
fi

# Start the server
echo "🎯 Starting FastAPI server on http://localhost:8000"
echo "📖 API docs available at http://localhost:8000/docs"
echo "🏥 Health check at http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="

# Run with auto-reload for development
uvicorn main:app --reload --host 0.0.0.0 --port 8000