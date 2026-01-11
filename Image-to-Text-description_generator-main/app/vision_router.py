import os

from app.openai_vision import describe_image_json_gpt4o
from app.vision_minicpm import describe_image_json_minicpm


def describe_image_json(image_path: str, language: str):
    """
    Vision backend switcher.

    Backends:
        - gpt4o    (default)
        - minicpm
    """

    provider = os.environ.get("VISION_BACKEND", "gpt4o").lower()

    if provider == "minicpm":
        return describe_image_json_minicpm(image_path, language)

    # default backend
    return describe_image_json_gpt4o(image_path, language)
