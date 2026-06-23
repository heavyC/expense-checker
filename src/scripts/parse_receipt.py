import os
import sys
import json
import base64
from dotenv import load_dotenv
load_dotenv()

import anthropic

from prompts import DEFAULT_RECEIPT_PARSING_PROMPT

VALID_CATEGORIES = ['meals', 'travel', 'lodging', 'software', 'equipment', 'other']


def parse_receipt(image_path: str, prompt: str | None = None) -> dict:
    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    ext = image_path.rsplit('.', 1)[-1].lower()
    media_type_map = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
    }
    media_type = media_type_map.get(ext, 'image/jpeg')
    image_b64 = base64.standard_b64encode(image_bytes).decode('utf-8')

    client = anthropic.Anthropic()

    prompt = prompt or DEFAULT_RECEIPT_PARSING_PROMPT

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=512,
        thinking={"type": "adaptive"},
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    response_text = next(
        (block.text for block in response.content if block.type == "text"), "{}"
    )

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError:
        data = {
            "amount": 0.0,
            "category": "other",
            "vendor": "",
            "description": "",
            "chargeToClient": False,
            "accuracy": 0.0,
        }

    # Normalise category
    if data.get("category") not in VALID_CATEGORIES:
        data["category"] = "other"

    data["amount"] = float(data.get("amount") or 0)
    data["accuracy"] = float(data.get("accuracy") or 0)
    data["chargeToClient"] = bool(data.get("chargeToClient", False))

    return data


if __name__ == "__main__":
    payload = json.loads(sys.stdin.read())
    result = parse_receipt(payload["image_path"])
    print(json.dumps(result))
