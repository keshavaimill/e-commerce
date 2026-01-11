import json
import torch
from PIL import Image
from transformers import AutoModel, AutoTokenizer

print(">>> USING vision_minicpm.py FROM:", __file__)

MODEL_ID = "openbmb/MiniCPM-V-2_6"


def _select_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


device = _select_device()


def load_backend():
    """
    Always uses trust_remote_code=True
    """

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_ID,
        trust_remote_code=True
    )

    model = AutoModel.from_pretrained(
        MODEL_ID,
        trust_remote_code=True,
        torch_dtype=torch.float16 if device.type != "cpu" else torch.float32
    ).to(device).eval()

    print(f"[MiniCPM] Loaded on {device}")

    return model, tokenizer


def describe_image_json_minicpm(image_path: str, language: str):

    model, tokenizer = load_backend()

    # ---- load image ----
    image = Image.open(image_path).convert("RGB")

    # ---- instruction ----
    prompt = f"""
Look at the image and output ONLY valid JSON in {language}.

JSON schema:
{{
 "title": string,
 "short_description": string,
 "long_description": string,
 "bullet_points": [string],
 "attributes": {{
   "color": string,
   "material": string,
   "pattern": string,
   "category": string,
   "gender": string
 }}
}}

Rules:
- Only describe visible information
- No brand hallucination
- No extra text, ONLY JSON
"""

    # -------- MiniCPM expected format --------
    msgs = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    # ---- NOTE: image must be passed as separate argument ----
    with torch.no_grad():
        output = model.chat(
            image=image,
            msgs=msgs,
            tokenizer=tokenizer,
            device=device,
            max_new_tokens=600,
            do_sample=False
        )

    # ---- JSON extraction ----
    start = output.find("{")
    end = output.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("MiniCPM did not return JSON:\n" + output)

    json_text = output[start:end+1]

    return json.loads(json_text)
