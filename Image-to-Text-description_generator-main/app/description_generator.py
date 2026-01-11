from app.vision_router import describe_image_json


def generate_description(image_path: str, language_code: str):
    """
    Unified entry point.
    Dispatches either GPT-4o or MiniCPM backend
    depending on environment variable or UI selection.
    """
    return describe_image_json(
        image_path=image_path,
        language=language_code
    )
