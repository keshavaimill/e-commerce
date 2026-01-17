import streamlit as st
import requests
import io
import base64
import logging
from PIL import Image

# Configure Logging for Frontend
logging.basicConfig(level=logging.INFO, format='%(asctime)s - VTO-Frontend - %(levelname)s - %(message)s')
logger = logging.getLogger("VTO-Frontend")

BASE_URL = "http://127.0.0.1:8000"

st.set_page_config(page_title="VTO Production", layout="wide")
st.title("🛍️ Virtual Try-On Production Build")

if "mapped_data" not in st.session_state:
    st.session_state["mapped_data"] = None
if "selected_sku_path" not in st.session_state:
    st.session_state["selected_sku_path"] = None

# Sidebar
st.sidebar.header("User Details")
gender = st.sidebar.selectbox("Gender", ["male", "female"])
user_input = st.sidebar.file_uploader("Upload Your Photo", type=["jpg", "png", "jpeg"])

if user_input:
    logger.info("User uploaded a custom photo.")
else:
    logger.info(f"User selected default model ({gender}).")

st.sidebar.header("Product Details")
category = st.sidebar.selectbox("Category", ["jackets", "tshirts", "pants", "shoes"])
current_brand = st.sidebar.selectbox("Your Brand", ["Nike", "Adidas", "Zara"])
current_size = st.sidebar.text_input("Your Size", value="M")
target_brand = st.sidebar.selectbox("Target Brand", ["Nike", "Adidas", "Zara"])

# --------------------------
# STEP 1: Get Options
# --------------------------
st.subheader("Step 1: Check Availability")
if st.button("Find Styles"):
    logger.info(f"User clicked Find Styles: {current_brand} {current_size} -> {target_brand}")
    
    with st.spinner("Checking inventory..."):
        st.session_state["selected_sku_path"] = None
        st.session_state["mapped_data"] = None

        payload = {
            "gender": gender,
            "category": category,
            "current_brand": current_brand,
            "current_size": current_size,
            "target_brand": target_brand
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/get-garment-options", data=payload)
            if resp.status_code == 200:
                st.session_state["mapped_data"] = resp.json()
                logger.info("Frontend received garment options successfully.")
                st.success(f"Recommended Size: {st.session_state['mapped_data']['mapped_size']}")
            else:
                error_msg = resp.json().get("error", "Unknown")
                logger.error(f"Backend returned error: {error_msg}")
                st.error(error_msg)
        except Exception as e:
            logger.critical(f"Connection failed: {e}")
            st.error(f"Connection Error: {e}")

# --------------------------
# Display Options
# --------------------------
if st.session_state["mapped_data"]:
    data = st.session_state["mapped_data"]
    st.markdown("### Select a Style")
    
    cols = st.columns(3)
    for idx, item in enumerate(data["garments"]):
        with cols[idx % 3]:
            img_bytes = base64.b64decode(item["image_base64"])
            st.image(img_bytes, caption=item["filename"], use_container_width=True)
            
            if st.button(f"Select SKU {item['sku_index']}", key=f"btn_{idx}"):
                st.session_state["selected_sku_path"] = item["path"]
                logger.info(f"User selected garment: {item['filename']}")
                st.toast(f"Selected: {item['filename']}")

# --------------------------
# STEP 2: Generate
# --------------------------
if st.session_state["selected_sku_path"]:
    st.markdown("---")
    st.subheader("Step 2: Virtual Try-On")
    st.write(f"**Selected Item:** `{st.session_state['selected_sku_path']}`")
    
    if st.button("✨ Generate Look"):
        logger.info("User initiated Try-On Generation.")
        with st.spinner("Processing AI Try-On..."):
            gen_payload = {
                "garment_path": st.session_state["selected_sku_path"],
                "gender": gender,
                "category": category
            }
            files = None
            if user_input:
                user_input.seek(0)
                files = {"user_image": (user_input.name, user_input.getvalue(), user_input.type)}
            
            try:
                resp = requests.post(f"{BASE_URL}/generate-tryon", data=gen_payload, files=files)
                if resp.status_code == 200:
                    out_img = Image.open(io.BytesIO(resp.content))
                    logger.info("Frontend received Final Image.")
                    st.image(out_img, caption="Final Result", width=500)
                else:
                    logger.error(f"Generation failed. Status: {resp.status_code}")
                    st.error(f"Failed: {resp.text}")
            except Exception as e:
                logger.error(f"Frontend Exception: {e}")
                st.error(f"Error: {e}")