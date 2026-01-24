from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import time
import uuid
from typing import List

from app.logger import get_logger
from app.description_generator import generate_description
from app.config import SUPPORTED_LANGUAGES

log = get_logger(__name__)

# -------------------- App Setup --------------------
app = FastAPI(title="Image-to-Text Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Preload MiniCPM model if it's the selected backend (improves first request speed)
@app.on_event("startup")
async def startup_event():
    """Preload models at startup to avoid first-request delay"""
    backend = os.environ.get("VISION_BACKEND", "gpt4o").lower()
    log.info("startup | VISION_BACKEND=%s", backend)

    if backend == "minicpm":
        log.info("startup | Preloading MiniCPM-V model...")
        try:
            from app.vision_minicpm import load_backend
            load_backend()
            log.info("startup | MiniCPM-V model preloaded successfully")
        except Exception as e:
            log.warning("startup | Could not preload MiniCPM-V: %s; will load on first request", e)
    else:
        log.info("startup | Using %s backend (no preloading needed)", backend)

# Ensure upload directory exists
UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/temp", StaticFiles(directory=UPLOAD_DIR), name="temp")

# -------------------- Endpoints --------------------

# 0️⃣ Health (for Render / load balancers)
@app.get("/health")
async def health():
    log.info("health | GET /health")
    return {"status": "ok", "service": "image-to-text"}

# 1️⃣ Get KPIs
@app.get("/image-to-text/kpis")
async def get_kpis():
    log.info("kpis | GET /image-to-text/kpis")
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
    if file.filename is None:
        log.info("upload | POST /image-to-text/upload | validation_failed | no filename")
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_id = f"img-{uuid.uuid4().hex[:8]}"
    extension = os.path.splitext(file.filename)[1].lower() or ".jpeg"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{extension}")

    contents = await file.read()
    size_kb = len(contents) / 1024
    if len(contents) > 10 * 1024 * 1024:
        log.info("upload | POST /image-to-text/upload | validation_failed | file_too_large | size_kb=%.1f", size_kb)
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    with open(file_path, "wb") as f:
        f.write(contents)

    base_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("BASE_URL") or "http://localhost:8010"
    base_url = base_url.rstrip("/")

    log.info("upload | POST /image-to-text/upload | success | image_id=%s filename=%s size_kb=%.1f sku=%s", file_id, file.filename, size_kb, sku)
    return {
        "success": True,
        "imageId": file_id,
        "url": f"{base_url}/temp/{file_id}{extension}",
        "filename": file.filename,
        "sku": sku
    }

# 2.5️⃣ Generate Description (direct file upload - for Streamlit UI)
@app.post("/generate-description")
async def generate_description_endpoint(
    image: UploadFile = File(...),
    language: str = Form(None)
):
    """
    Direct endpoint for Streamlit UI - accepts file upload and language,
    returns generated description immediately.
    """
    if image.filename is None:
        log.info("generate_description | POST /generate-description | validation_failed | no filename")
        raise HTTPException(status_code=400, detail="No file uploaded")

    if language is None:
        language = "en"
    if language not in SUPPORTED_LANGUAGES.values():
        log.info("generate_description | POST /generate-description | validation_failed | unsupported_language=%s", language)
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    file_id = f"temp-{uuid.uuid4().hex[:8]}"
    extension = os.path.splitext(image.filename)[1].lower() or ".jpeg"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{extension}")

    contents = await image.read()
    size_kb = len(contents) / 1024
    if len(contents) > 10 * 1024 * 1024:
        log.info("generate_description | POST /generate-description | validation_failed | file_too_large | size_kb=%.1f", size_kb)
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    with open(file_path, "wb") as f:
        f.write(contents)

    log.info("generate_description | POST /generate-description | start | filename=%s language=%s size_kb=%.1f", image.filename, language, size_kb)
    t0 = time.perf_counter()
    try:
        ai_result = generate_description(file_path, language)
        elapsed = time.perf_counter() - t0
        log.info("generate_description | POST /generate-description | success | filename=%s language=%s elapsed_sec=%.2f", image.filename, language, elapsed)
        return {
            "title": ai_result.get("title", ""),
            "short_description": ai_result.get("short_description", ""),
            "long_description": ai_result.get("long_description", ""),
            "bullet_points": ai_result.get("bullet_points", []),
            "attributes": ai_result.get("attributes", {})
        }
    except Exception as e:
        elapsed = time.perf_counter() - t0
        log.error("generate_description | POST /generate-description | failed | filename=%s language=%s elapsed_sec=%.2f error=%s", image.filename, language, elapsed, e)
        # Re-raise as HTTPException to ensure proper error response
        raise HTTPException(
            status_code=500,
            detail=f"Description generation failed: {str(e)}"
        )
    finally:
        # Always clean up temporary file, even on error
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                log.debug("generate_description | cleaned up temp file | path=%s", file_path)
            except Exception as cleanup_error:
                log.warning("generate_description | cleanup failed | path=%s error=%s", file_path, cleanup_error)

# 3️⃣ Generate Product Description
@app.post("/image-to-text/generate")
async def generate_product_text(payload: dict = Body(...)):
    image_id = payload.get("imageId")
    language = payload.get("language", "en")
    region = payload.get("region", "global")
    marketplace = payload.get("marketplace")
    sku = payload.get("sku")
    extension = payload.get("extension", ".jpeg")

    if language not in SUPPORTED_LANGUAGES.values():
        log.info("generate_product_text | POST /image-to-text/generate | validation_failed | unsupported_language=%s", language)
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    image_path = os.path.join(UPLOAD_DIR, f"{image_id}{extension}")
    if not os.path.exists(image_path):
        log.info("generate_product_text | POST /image-to-text/generate | not_found | image_id=%s", image_id)
        raise HTTPException(status_code=404, detail="Image not found")

    log.info("generate_product_text | POST /image-to-text/generate | start | image_id=%s language=%s", image_id, language)
    t0 = time.perf_counter()
    try:
        ai_result = generate_description(image_path, language)
        elapsed = time.perf_counter() - t0
        job_id = f"job-{uuid.uuid4().hex[:5]}"
        log.info("generate_product_text | POST /image-to-text/generate | success | image_id=%s job_id=%s elapsed_sec=%.2f", image_id, job_id, elapsed)
        return {
            "success": True,
            "jobId": job_id,
            "title": ai_result.get("title"),
            "shortDescription": ai_result.get("short_description"),
            "bulletPoints": ai_result.get("bullet_points", []),
            "attributes": [
                {"name": k.capitalize(), "value": v, "confidence": 100}
                for k, v in ai_result.get("attributes", {}).items()
            ]
        }
    except Exception as e:
        elapsed = time.perf_counter() - t0
        log.error("generate_product_text | POST /image-to-text/generate | failed | image_id=%s language=%s elapsed_sec=%.2f error=%s", 
                 image_id, language, elapsed, e)
        raise HTTPException(
            status_code=500,
            detail=f"Description generation failed: {str(e)}"
        )

# 4️⃣ Get Translations
@app.get("/image-to-text/translations/{image_id}")
async def get_translations(image_id: str, language: str = None):
    log.info("translations | GET /image-to-text/translations/%s | language=%s", image_id, language)
    files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(image_id)]
    if not files:
        log.info("translations | GET /image-to-text/translations/%s | not_found", image_id)
        raise HTTPException(status_code=404, detail="Image not found")
    file_path = os.path.join(UPLOAD_DIR, files[0])

    translations = []
    for lang in SUPPORTED_LANGUAGES:
        if language and lang != language:
            continue
        result = generate_description(file_path, lang)
        status = "complete" if result else "pending"
        translations.append({
            "code": lang,
            "name": lang.capitalize(),
            "flag": "🇮🇳" if lang != "en" else "🇬🇧",
            "status": status,
            "title": result.get("title") if result else None,
            "description": result.get("short_description") if result else None,
            "bulletPoints": result.get("bullet_points") if result else None
        })

    log.info("translations | GET /image-to-text/translations/%s | success | count=%d", image_id, len(translations))
    return {"imageId": image_id, "translations": translations}

# 5️⃣ Get Localization Quality Check
@app.get("/image-to-text/quality-check/{image_id}")
async def get_quality_check(image_id: str):
    log.info("quality_check | GET /image-to-text/quality-check/%s", image_id)
    files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(image_id)]
    if not files:
        log.info("quality_check | GET /image-to-text/quality-check/%s | not_found", image_id)
        raise HTTPException(status_code=404, detail="Image not found")
    file_path = os.path.join(UPLOAD_DIR, files[0])

    quality_checks = []
    for lang in SUPPORTED_LANGUAGES:
        result = generate_description(file_path, lang)
        if not result:
            continue
        # Simple dynamic checks example
        checks = {
            "grammar": True,
            "keywords": 90,  # placeholder score
            "cultural": 95,  # placeholder score
            "forbidden": False
        }
        quality_checks.append({
            "code": lang,
            "name": lang.capitalize(),
            "flag": "🇮🇳" if lang != "en" else "🇬🇧",
            "status": "complete",
            "checks": checks
        })

    log.info("quality_check | GET /image-to-text/quality-check/%s | success | count=%d", image_id, len(quality_checks))
    return {"imageId": image_id, "qualityChecks": quality_checks}

# 6️⃣ Approve Translations
@app.post("/image-to-text/approve")
async def approve_translations(payload: dict = Body(...)):
    image_id = payload.get("imageId")
    languages: List[str] = payload.get("languages")

    if languages:
        approved_count = len(languages)
    else:
        approved_count = len(SUPPORTED_LANGUAGES)

    log.info("approve | POST /image-to-text/approve | image_id=%s approved_count=%d", image_id, approved_count)
    return {
        "success": True,
        "approved": approved_count,
        "message": "All translations approved successfully"
    }

# -------------------- Main --------------------
if __name__ == "__main__":
    import uvicorn
    from app.logger import configure_logging
    configure_logging()
    port = int(os.environ.get("PORT", 8010))
    log.info("main | Starting uvicorn on 0.0.0.0:%d", port)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
