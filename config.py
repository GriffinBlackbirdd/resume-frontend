import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://buvnzjfspowdttkgohtb.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dm56amZzcG93ZHR0a2dvaHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODcxODMsImV4cCI6MjA3MjY2MzE4M30.QtTmwQ7-T16Vw9lqqxphi5yBOM0_oy8ep93KE5GzhMI")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 hours
    
    # CORS Configuration
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://stable-dane-quickly.ngrok-free.app"
    ]

settings = Settings()