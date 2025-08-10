from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
from google.cloud import vision
from google.oauth2 import service_account


@dataclass
class OcrLine:
    text: str
    bbox: Tuple[int, int, int, int]  # x, y, w, h
    conf: float


def _get_credentials():
    project_id = os.getenv("GCP_PROJECT_ID")
    client_email = os.getenv("GCP_CLIENT_EMAIL")
    private_key = os.getenv("GCP_PRIVATE_KEY")
    if not (project_id and client_email and private_key):
        return None
    private_key = private_key.replace("\\n", "\n")
    info = {
        "type": "service_account",
        "project_id": project_id,
        "private_key_id": "dummy",
        "private_key": private_key,
        "client_email": client_email,
        "client_id": "dummy",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
    return service_account.Credentials.from_service_account_info(info)


def get_client() -> vision.ImageAnnotatorClient:
    creds = _get_credentials()
    if creds is not None:
        return vision.ImageAnnotatorClient(credentials=creds)
    # Fall back to default env-based auth if available
    return vision.ImageAnnotatorClient()


def run_ocr(image_rgb: np.ndarray) -> List[OcrLine]:
    """Run Google Vision OCR and return merged line-level results in resized coordinate space.
    Deterministic by sorting in reading order.
    """
    client = get_client()
    # Encode to PNG for upload
    import io
    from PIL import Image

    buf = io.BytesIO()
    Image.fromarray(image_rgb).save(buf, format="PNG")
    content = buf.getvalue()

    image = vision.Image(content=content)

    # Prefer document_text_detection for structure; fallback to text_detection
    try:
        response = client.document_text_detection(image=image)
        annotation = response.full_text_annotation
        if annotation is None:
            raise RuntimeError("no full_text_annotation")
        lines: List[OcrLine] = []
        for page in annotation.pages:
            for block in page.blocks:
                for para in block.paragraphs:
                    # Merge words into a line by simple concatenation per paragraph
                    word_items = []
                    for word in para.words:
                        text = "".join([s.text for s in word.symbols])
                        verts = word.bounding_box.vertices
                        xs = [v.x for v in verts]
                        ys = [v.y for v in verts]
                        x, y = min(xs), min(ys)
                        w, h = max(xs) - x, max(ys) - y
                        conf = float(getattr(word, "confidence", 0.9))
                        word_items.append((text, x, y, w, h, conf))
                    if not word_items:
                        continue
                    joined = " ".join([t for (t, *_rest) in word_items]).strip()
                    xs = [x for (_t, x, _y, _w, _h, _c) in word_items]
                    ys = [y for (_t, _x, y, _w, _h, _c) in word_items]
                    xe = [x + w for (_t, x, _y, w, _h, _c) in word_items]
                    ye = [y + h for (_t, _x, y, _w, h, _c) in word_items]
                    x0, y0 = min(xs), min(ys)
                    x1, y1 = max(xe), max(ye)
                    conf = float(np.mean([c for (*_a, c) in word_items]))
                    lines.append(OcrLine(text=joined, bbox=(x0, y0, x1 - x0, y1 - y0), conf=conf))
        lines.sort(key=lambda l: (l.bbox[1], l.bbox[0]))
        return lines
    except Exception:
        response = client.text_detection(image=image)
        if not response.text_annotations:
            return []
        ann = response.text_annotations[1:]
        lines: List[OcrLine] = []
        for a in ann:
            verts = a.bounding_poly.vertices
            xs = [v.x for v in verts]
            ys = [v.y for v in verts]
            x, y = min(xs), min(ys)
            w, h = max(xs) - x, max(ys) - y
            lines.append(OcrLine(text=a.description.strip(), bbox=(x, y, w, h), conf=0.9))
        lines.sort(key=lambda l: (l.bbox[1], l.bbox[0]))
        return lines
