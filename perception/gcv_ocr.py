from __future__ import annotations

import io
import os
import json
from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict

import numpy as np
from PIL import Image
from google.cloud import vision_v1 as vision
from google.oauth2 import service_account
from google.api_core import exceptions as gexc
from google.api_core.client_options import ClientOptions


VISION_SCOPE = "https://www.googleapis.com/auth/cloud-platform"


@dataclass
class OcrLine:
    text: str
    bbox: Tuple[int, int, int, int]  # x, y, w, h
    conf: float


_cached_creds: Optional[Tuple[service_account.Credentials, Optional[str]]] = None
_cached_meta: Optional[Dict] = None


def _make_credentials() -> Tuple[service_account.Credentials, Optional[str]]:
    """
    Strict credentials loader for Google Vision (no ADC fallback):
    1) If GOOGLE_APPLICATION_CREDENTIALS points to a JSON file, use it.
    2) Else if the env triple (GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY) is set, use it.
    3) Else raise a RuntimeError.
    Returns (credentials, quota_project_id)
    """
    global _cached_creds, _cached_meta
    if _cached_creds is not None:
        return _cached_creds

    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if key_path:
        if not os.path.isfile(key_path):
            raise RuntimeError(f"GOOGLE_APPLICATION_CREDENTIALS is set but file not found: {key_path}")
        with open(key_path, "r", encoding="utf-8") as f:
            info = json.load(f)
        creds = service_account.Credentials.from_service_account_info(info, scopes=[VISION_SCOPE])
        quota_project_id = info.get("project_id")
        _cached_meta = {
            "mode": "file",
            "path": key_path,
            "project_id": info.get("project_id"),
            "client_email": info.get("client_email"),
            "has_quota_project": bool(quota_project_id),
        }
        _cached_creds = (creds, quota_project_id)
        return _cached_creds

    project_id = os.getenv("GCP_PROJECT_ID")
    client_email = os.getenv("GCP_CLIENT_EMAIL")
    private_key = os.getenv("GCP_PRIVATE_KEY")
    if project_id and client_email and private_key:
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
        creds = service_account.Credentials.from_service_account_info(info, scopes=[VISION_SCOPE])
        _cached_meta = {
            "mode": "env_triple",
            "path": None,
            "project_id": project_id,
            "client_email": client_email,
            "has_quota_project": True,
        }
        _cached_creds = (creds, project_id)
        return _cached_creds

    raise RuntimeError(
        "Google Vision credentials missing. Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON "
        "or provide GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY."
    )


def get_client() -> vision.ImageAnnotatorClient:
    creds, quota_project_id = _make_credentials()
    client_options = ClientOptions(quota_project_id=quota_project_id) if quota_project_id else None
    return vision.ImageAnnotatorClient(credentials=creds, client_options=client_options)


def debug_info() -> Dict:
    # Force load creds to populate _cached_meta
    try:
        get_client()
    except Exception as e:
        return {"error": str(e)}
    return dict(_cached_meta or {})


def verify_vision_access() -> None:
    """
    Perform a minimal Vision API call to trigger permission checks.
    Raises google.api_core.exceptions.PermissionDenied or Unauthenticated if access is not valid.
    """
    client = get_client()
    # 1x1 black PNG
    tiny = np.zeros((1, 1, 3), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(tiny).save(buf, format="PNG")
    image = vision.Image(content=buf.getvalue())
    def _has_user_project_denied(msg: str) -> bool:
        lower = msg.lower()
        return (
            "user_project_denied" in lower
            or "serviceusage" in lower
            or "service usage consumer" in lower
            or "caller does not have required permission" in lower
        )

    errors: list[str] = []
    # Try both endpoints to maximize chance of getting a clear auth error at startup
    for func in (client.document_text_detection, client.text_detection):
        try:
            resp = func(image=image, timeout=10)
            err_msg = getattr(getattr(resp, "error", None), "message", None)
            if err_msg:
                if _has_user_project_denied(err_msg):
                    raise RuntimeError(err_msg)
                errors.append(err_msg)
            else:
                return  # success
        except (gexc.PermissionDenied, gexc.Unauthenticated):
            # Permission errors: fail fast
            raise
        except Exception as e:
            # Record non-auth errors and keep trying the next method
            msg = str(e)
            if _has_user_project_denied(msg):
                raise RuntimeError(msg)
            errors.append(msg)

    # If we reach here, no explicit permission-denied detected. That's fine; allow startup.
    return


def run_ocr(image_rgb: np.ndarray) -> List[OcrLine]:
    """
    Run Google Vision OCR and return merged line-level results in the image coordinate space.
    Deterministic: results are sorted in reading order (top-to-bottom, then left-to-right).
    """
    # Normalize image dtype
    if image_rgb.dtype != np.uint8:
        image_rgb = np.clip(image_rgb, 0, 255).astype(np.uint8)

    client = get_client()

    # Encode to PNG for upload
    buf = io.BytesIO()
    Image.fromarray(image_rgb).save(buf, format="PNG")
    content = buf.getvalue()
    image = vision.Image(content=content)

    # Prefer document_text_detection; only fall back to text_detection on NON-auth errors.
    try:
        response = client.document_text_detection(image=image, timeout=30)
        if getattr(response, "error", None) and response.error.message:
            # Bubble up exact Vision API error
            raise RuntimeError(response.error.message)

        annotation = response.full_text_annotation
        if annotation is None:
            # No structured text; we’ll try lighter detector below
            raise ValueError("no full_text_annotation")

        lines: List[OcrLine] = []
        for page in getattr(annotation, "pages", []):
            for block in getattr(page, "blocks", []):
                for para in getattr(block, "paragraphs", []):
                    word_items = []
                    for word in getattr(para, "words", []):
                        text = "".join([s.text for s in getattr(word, "symbols", [])])
                        verts = word.bounding_box.vertices
                        xs = [v.x for v in verts]
                        ys = [v.y for v in verts]
                        x, y = min(xs), min(ys)
                        w, h = max(xs) - x, max(ys) - y
                        conf = float(getattr(word, "confidence", 0.9))
                        if text:
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

                    if joined:
                        lines.append(OcrLine(text=joined, bbox=(x0, y0, x1 - x0, y1 - y0), conf=conf))

        lines.sort(key=lambda l: (l.bbox[1], l.bbox[0]))
        return lines

    except (gexc.PermissionDenied, gexc.Unauthenticated) as e:
        # Auth issues: surface immediately (don’t hide behind fallback)
        raise RuntimeError(f"Vision auth error: {e}") from e
    except Exception:
        # Non-auth issues: try the lighter detector
        response = client.text_detection(image=image, timeout=30)
        if getattr(response, "error", None) and response.error.message:
            raise RuntimeError(response.error.message)

        ann = getattr(response, "text_annotations", None) or []
        if len(ann) <= 1:
            return []

        # [0] is the full-text aggregate; subsequent entries are elements
        elements = ann[1:]
        lines: List[OcrLine] = []
        for a in elements:
            verts = a.bounding_poly.vertices
            xs = [v.x for v in verts]
            ys = [v.y for v in verts]
            x, y = min(xs), min(ys)
            w, h = max(xs) - x, max(ys) - y
            text = (a.description or "").strip()
            if text:
                lines.append(OcrLine(text=text, bbox=(x, y, w, h), conf=0.9))

        lines.sort(key=lambda l: (l.bbox[1], l.bbox[0]))
        return lines