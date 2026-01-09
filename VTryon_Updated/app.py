import os
import io
import logging
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from dotenv import load_dotenv

from google import genai
from google.genai import types

# Your existing mapping logic
import mapping as mp

# ==================================================
# 1. INITIALIZATION & LOGGING
# ==================================================
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VTO-Engine")

# --- Gemini Configuration (SAFE) ---
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    logger.warning("GEMINI_API_KEY not set. Gemini features will be disabled.")

client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
        logger.info("Gemini client initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        client = None

# --- FastAPI App ---
app = FastAPI(title="Virtual Try-On API")

# ==================================================
# CORS Configuration
# ==================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# 2. BUSINESS LOGIC
# ==================================================
def find_garment_path(brand: str, gender: str, category: str, size: str):
    """
    Matches files like:
    assets/inventory/nike/male/tshirts/nike-m-tshirts-M.jpg
    """
    base = f"assets/inventory/{brand.lower()}/{gender}/{category}"
    if not os.path.exists(base):
        logger.warning(f"Inventory path not found: {base}")
        return None

    for ext in [".jpg", ".jpeg", ".png"]:
        filename = f"{brand.lower()}-{gender[0]}-{category}-{size}{ext}"
        path = os.path.join(base, filename)
        if os.path.exists(path):
            return path

    return None

# ==================================================
# 3. CORE ENDPOINT
# ==================================================
@app.post("/generate-tryon")
async def generate_tryon(
    gender: str = Form(..., description="male or female"),
    category: str = Form(..., description="tshirts, pants, jackets, shoes"),
    current_brand: str = Form(...),
    current_size: str = Form(...),
    target_brand: str = Form(...),
    user_image: Optional[UploadFile] = File(None)
):
    logger.info(
        f"Request: {current_brand} {current_size} → {target_brand} {category}"
    )

    # --- Gemini Availability Check ---
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Gemini service is not configured on this deployment."
        )

    # --- 3.1 Identity Logic ---
    try:
        if user_image:
            img_bytes = await user_image.read()
            user_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        else:
            default_path = f"assets/default_models/model_{gender}.jpg"
            if not os.path.exists(default_path):
                raise FileNotFoundError(f"Default model missing at {default_path}")
            user_img = Image.open(default_path).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image error: {e}")

    # --- 3.2 Size Mapping ---
    final_size = mp.get_mapped_size_by_category(
        category=category,
        gender=gender,
        from_brand=current_brand,
        from_size=current_size,
        to_brand=target_brand
    )

    if not final_size:
        return JSONResponse(
            status_code=400,
            content={"error": "Size mapping not found", "confidence": "LOW"}
        )

    # --- 3.3 Inventory Resolution ---
    cloth_path = find_garment_path(
        target_brand, gender, category, final_size
    )
    if not cloth_path:
        raise HTTPException(
            status_code=404,
            detail="Garment not found in inventory."
        )

    # --- 3.4 Gemini Execution ---
    try:
        cloth_img = Image.open(cloth_path).convert("RGB")

        prompt = (
            f"Perform a realistic virtual try-on. Dress the person in the first image "
            f"with the {category} garment from the second image. "
            "Preserve body pose, lighting, shadows, fabric texture, and occlusions. "
            "If hands or arms overlap the garment, keep them visible."
        )

        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[user_img, cloth_img, prompt],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )

        if response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    headers = {"X-Mapped-Size": final_size}
                    logger.info("Try-on generation successful.")
                    return Response(
                        content=part.inline_data.data,
                        media_type="image/png",
                        headers=headers
                    )

        raise ValueError("Gemini returned no image data.")

    except Exception as e:
        logger.exception("Gemini execution failed")
        raise HTTPException(
            status_code=500,
            detail=f"Engine error: {e}"
        )

# ==================================================
# 4. HEALTH CHECK
# ==================================================
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "gemini_enabled": bool(client)
    }

# ==================================================
# 5. LOCAL DEVELOPMENT ENTRYPOINT
# ==================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
