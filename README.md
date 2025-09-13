# Resume Builder - Alpha

An AI-powered resume builder with real-time YAML editing and PDF rendering using RenderCV.

## Features

- 🎨 Modern, responsive landing page with hyperspeed background
- ✏️ Advanced YAML editor with Monaco Editor (VS Code-like experience)
- 📄 Real-time PDF preview and rendering
- 🔄 Auto-refresh on file changes
- 🚀 FastAPI backend with RenderCV integration
- 🎯 Multiple resume templates and designs

## Project Structure

```
resumeFrontend/
├── src/                          # Next.js frontend
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── editor/page.tsx      # Resume editor
│   │   └── api/                 # Next.js API routes
│   └── components/              # React components
├── fastapi-server/              # Python backend
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── setup.py                # Setup script
└── README.md
```

## Quick Start

### 1. Frontend (Next.js)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 2. Backend (FastAPI)

```bash
# Navigate to FastAPI server directory
cd fastapi-server

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run setup script
python setup.py

# Start the server
python main.py
```

The API will be available at `http://localhost:8000`

### 3. Install RenderCV (Optional but Recommended)

```bash
pip install rendercv
```

Without RenderCV, the system will generate mock PDFs for preview.

## Usage

1. **Landing Page**: Visit `http://localhost:3000` to see the marketing site
2. **Editor**: Go to `http://localhost:3000/editor` for the resume editor
3. **Edit YAML**: Use the left panel to edit your resume in YAML format
4. **Preview PDF**: See real-time updates in the right panel
5. **Auto-refresh**: Changes are automatically rendered (1-second debounce)

## Resume YAML Structure

```yaml
cv:
  name: "Your Name"
  location: "City, State"
  email: "your.email@example.com"
  phone: "+1 (555) 123-4567"
  website: "https://yourwebsite.com"
  linkedin: "https://linkedin.com/in/yourname"
  github: "https://github.com/yourname"

sections:
  summary:
    - "Brief professional summary"
    - "Key achievements and goals"
  
  experience:
    - company: "Company Name"
      position: "Your Position"
      location: "City, State"
      start_date: "2021-01"
      end_date: "present"
      highlights:
        - "Achievement 1"
        - "Achievement 2"
  
  education:
    - institution: "University Name"
      area: "Field of Study"
      degree: "Degree Type"
      start_date: "2015"
      end_date: "2019"
  
  skills:
    - "Technical skills"
    - "Programming languages"
    - "Frameworks and tools"
```

## API Endpoints

### FastAPI Backend (http://localhost:8000)

- `POST /render-resume`: Render YAML to PDF
- `GET /health`: Health check
- `GET /docs`: API documentation (Swagger UI)

### Next.js API (http://localhost:3000/api)

- `POST /api/render-resume`: Fallback PDF rendering

## Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor (VS Code experience)
- **Framer Motion** - Animations
- **Aceternity UI** - Advanced UI components

### Backend
- **FastAPI** - Modern Python web framework
- **RenderCV** - Resume rendering engine
- **Watchdog** - File system monitoring
- **Uvicorn** - ASGI server

## Development

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Backend Development

```bash
cd fastapi-server

# Start with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with Python directly
python main.py
```

## Troubleshooting

### RenderCV Installation Issues

If you encounter issues with RenderCV:

1. **LaTeX Dependencies**: RenderCV requires LaTeX for PDF generation
   ```bash
   # Ubuntu/Debian
   sudo apt-get install texlive-latex-base texlive-fonts-recommended
   
   # macOS
   brew install --cask mactex
   
   # Windows
   # Install MiKTeX from https://miktex.org/
   ```

2. **Python Dependencies**: Ensure all Python packages are installed
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Virtual Environment**: Always use a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

### CORS Issues

If you encounter CORS errors, ensure both servers are running:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Port Conflicts

If ports are in use, you can change them:
- Frontend: Update `next.config.mjs` or use `npm run dev -- -p 3001`
- Backend: Change port in `main.py` or use `uvicorn main:app --port 8001`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details