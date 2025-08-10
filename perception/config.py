from __future__ import annotations

import os
from dataclasses import dataclass


VERSION: str = "perception-2025-08-10"
DEFAULT_TARGET_WIDTH: int = int(os.getenv("PERCEPTION_MAX_WIDTH", "1440"))
_OCR_RAW: str = os.getenv("OCR_BACKEND", "gcv").strip().lower()
# Normalize common aliases
if _OCR_RAW in {"google", "google-vision", "vision", "gcloud"}:
    OCR_BACKEND = "gcv"
elif _OCR_RAW in {"paddle", "paddleocr"}:
    OCR_BACKEND = "paddle"
else:
    OCR_BACKEND = _OCR_RAW  # expect "gcv" or "paddle"
CACHE_DIR: str | None = os.getenv("CACHE_DIR")


@dataclass(frozen=True)
class CvThresholds:
    # Geometry
    min_block_area_ratio: float = 0.002  # relative to image area
    min_card_repetition: int = 3
    section_area_ratio: float = 0.15

    # Grid detection
    hough_rho: float = 1
    hough_theta: float = 3.14159 / 180
    hough_threshold: int = 120
    hough_min_line_length: int = 80
    hough_max_line_gap: int = 10

    # Buttons
    button_min_height_px: int = 28
    button_max_height_px: int = 80
    button_min_aspect: float = 1.8
    button_max_aspect: float = 6.0
    button_corner_radius_threshold: float = 0.07  # relative to height

    # Contrast
    min_contrast_sample_px: int = 40 * 40


CV_THRESHOLDS = CvThresholds()
