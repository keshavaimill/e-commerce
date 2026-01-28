from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import time
import uuid
import asyncio
from typing import List

from app.logger import get_logger
from app.description_generator import generate_description
from app.config import SUPPORTED_LANGUAGES

log = get_logger(__name__)

# -------------------- App Setup --------------------
app = FastAPI(title="Image-to-Text Vision API")

# 🔴 FIXED CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://e-commerce-gilt-kappa.vercel.app",  # your frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Startup --------------------
@app.on_event("startup")
async def startup_event():
    backend = os.environ.get("VISION_BACKEND", "gpt4o").lower()
    log.info("startup | VISION_BACKEND=%s", backend)

    if backend == "minicpm":
        log.info("startup | Preloading MiniCPM-V model...")
        try:
            from app.vision_minicpm import load_backend
            load_backend()
            log.info("startup | MiniCPM-V model preloaded successfully")
        except Exception as e:
            log.warning(
                "startup | Could not preload MiniCPM-V: %s; will load on first request", e
            )
    else:
        log.info("startup | Using %s backend (no preloading needed)", backend)

# -------------------- Utils --------------------
async def run_blocking(fn, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, fn, *args)

# -------------------- Storage --------------------
UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/temp", StaticFiles(directory=UPLOAD_DIR), name="temp")

# -------------------- Endpoints --------------------

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
@app.head("/")
async def root():
    return {
        "status": "ok",
        "service": "Image-to-Text Vision API",
        "backend": os.environ.get("VISION_BACKEND", "gpt4o"),
    }

# 1️⃣ KPIs
@app.get("/image-to-text/kpis")
async def get_kpis():
    return {
        "kpis": [
            {"label": "Language Completeness", "value": "87%", "icon": "Languages", "change": 12},
            {"label": "Marketplace Readiness", "value": "94/100", "icon": "Target", "change": 5},
            {"label": "SEO Quality Score", "value": "91/100", "icon": "Zap", "change": 8},
            {"label": "Attribute Accuracy", "value": "96%", "icon": "CheckCircle", "change": 3},
            {"label": "Time Saved/Listing", "value": "4.2min", "icon": "Clock", "change": -22},
        ]
    }

# 2️⃣ Upload Image
@app.post("/image-to-text/upload")
async def upload_image(file: UploadFile = File(...), sku: str = None):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_id = f"img-{uuid.uuid4().hex[:8]}"
    extension = os.path.splitext(file.filename)[1].lower() or ".jpeg"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{extension}")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    with open(file_path, "wb") as f:
        f.write(contents)

    base_url = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
    return {
        "success": True,
        "imageId": file_id,
        "url": f"{base_url}/temp/{file_id}{extension}",
        "filename": file.filename,
        "sku": sku,
    }

# 2.5️⃣ Generate Description
@app.post("/generate-description")
async def generate_description_endpoint(
    image: UploadFile = File(...),
    language: str = Form(None),
):
    language = language or "en"
    if language not in SUPPORTED_LANGUAGES.values():
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    file_id = f"temp-{uuid.uuid4().hex[:8]}"
    extension = os.path.splitext(image.filename)[1].lower() or ".jpeg"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{extension}")

    contents = await image.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    ai_result = await run_blocking(generate_description, file_path, language)

    if os.path.exists(file_path):
        os.remove(file_path)

    return {
        "title": ai_result.get("title", ""),
        "short_description": ai_result.get("short_description", ""),
        "long_description": ai_result.get("long_description", ""),
        "bullet_points": ai_result.get("bullet_points", []),
        "attributes": ai_result.get("attributes", {}),
    }

# -------------------- Local Run --------------------
if __name__ == "__main__":
    import uvicorn
    from app.logger import configure_logging

    configure_logging()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8010, reload=True)
