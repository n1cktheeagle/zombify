from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np


@dataclass
class OcrLine:
    text: str
    bbox: Tuple[int, int, int, int]
    conf: float


def run_ocr(image_rgb: np.ndarray) -> List[OcrLine]:
    try:
        from paddleocr import PaddleOCR  # type: ignore
    except Exception as e:  # pragma: no cover - optional dep
        raise RuntimeError("not installed") from e

    # Initialize once per call; callers may memoize externally if needed
    ocr = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=False)
    # Paddle expects BGR or path; we'll convert to ndarray BGR
    import cv2  # local import to avoid unconditional dep at import time

    bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    result = ocr.ocr(bgr, cls=True)

    lines: List[OcrLine] = []
    for page in result:
        for line in page:
            box, (text, conf) = line
            xs = [pt[0] for pt in box]
            ys = [pt[1] for pt in box]
            x, y = int(min(xs)), int(min(ys))
            w, h = int(max(xs) - x), int(max(ys) - y)
            lines.append(OcrLine(text=text.strip(), bbox=(x, y, w, h), conf=float(conf)))
    # sort in reading order for determinism
    lines.sort(key=lambda l: (l.bbox[1], l.bbox[0]))
    return lines
