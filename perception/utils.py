from __future__ import annotations

import hashlib
import io
import json
import os
from typing import Iterable, List, Sequence, Tuple

import numpy as np
import requests
from PIL import Image


# ------------- Hashing / IO -------------

def sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return "sha256-" + h.hexdigest()


def download_image(url: str, timeout: int = 30) -> bytes:
    headers = {
        "User-Agent": "ZombifyPerception/1.0 (+https://zombify.local; contact: dev@zombify.local)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
    }
    resp = requests.get(url, timeout=timeout, headers=headers)
    resp.raise_for_status()
    return resp.content


# ------------- Image processing -------------

def load_rgb_from_bytes(content: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(content)).convert("RGB")
    return np.array(img)


def resize_to_width(image_rgb: np.ndarray, target_width: int) -> Tuple[np.ndarray, float]:
    orig_h, orig_w = image_rgb.shape[:2]
    if orig_w == target_width:
        return image_rgb, 1.0
    scale = target_width / float(orig_w)
    new_h = int(round(orig_h * scale))
    img = Image.fromarray(image_rgb).resize((target_width, new_h), Image.LANCZOS)
    return np.array(img), scale


def bbox_int(x: float, y: float, w: float, h: float) -> List[int]:
    return [int(round(x)), int(round(y)), int(round(w)), int(round(h))]


def sort_reading_order(rects: Iterable[Sequence[int]]) -> List[Sequence[int]]:
    return sorted(rects, key=lambda b: (b[1], b[0]))


# ------------- Colors / Contrast -------------

def rgb_to_hex(color: np.ndarray) -> str:
    r, g, b = [int(x) for x in color]
    return f"#{r:02X}{g:02X}{b:02X}"


def relative_luminance(rgb: np.ndarray) -> float:
    srgb = rgb.astype(np.float64) / 255.0
    def lin(c: np.ndarray) -> np.ndarray:
        mask = c <= 0.03928
        out = np.empty_like(c)
        out[mask] = c[mask] / 12.92
        out[~mask] = ((c[~mask] + 0.055) / 1.055) ** 2.4
        return out
    r, g, b = lin(srgb[..., 0]), lin(srgb[..., 1]), lin(srgb[..., 2])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def wcag_contrast_ratio(fg_rgb: np.ndarray, bg_rgb: np.ndarray) -> float:
    l1 = float(relative_luminance(fg_rgb).mean())
    l2 = float(relative_luminance(bg_rgb).mean())
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ------------- Backwards compatibility helper -------------

def download_and_preprocess(url: str, target_width: int) -> Tuple[np.ndarray, dict]:
    content = download_image(url)
    img = load_rgb_from_bytes(content)
    img_resized, scale = resize_to_width(img, target_width)
    meta = {
        "width": img_resized.shape[1],
        "height": img_resized.shape[0],
        "hash": sha256_bytes(content),
        "scale": scale,
    }
    return img_resized, meta
