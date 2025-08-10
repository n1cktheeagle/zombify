from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

import cv2
import numpy as np
from sklearn.cluster import KMeans

from .config import CV_THRESHOLDS
from .utils import rgb_to_hex, wcag_contrast_ratio


@dataclass
class Rect:
    x: int
    y: int
    w: int
    h: int

    def as_list(self) -> List[int]:
        return [self.x, self.y, self.w, self.h]


@dataclass
class ButtonCandidate(Rect):
    corner_radius: int


def _preprocess_gray(image_rgb: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, d=7, sigmaColor=50, sigmaSpace=50)
    edges = cv2.Canny(gray, 50, 150)
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)
    return edges


def detect_blocks(image_rgb: np.ndarray) -> List[Tuple[List[int], str]]:
    h, w, _ = image_rgb.shape
    area = h * w
    edges = _preprocess_gray(image_rgb)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    rects: List[Rect] = []
    for c in contours:
        x, y, ww, hh = cv2.boundingRect(c)
        if ww * hh < area * CV_THRESHOLDS.min_block_area_ratio:
            continue
        rects.append(Rect(x, y, ww, hh))

    # Deduplicate overlapping rectangles by IoU threshold
    def iou(a: Rect, b: Rect) -> float:
        xa1, ya1, xa2, ya2 = a.x, a.y, a.x + a.w, a.y + a.h
        xb1, yb1, xb2, yb2 = b.x, b.y, b.x + b.w, b.y + b.h
        inter_x1, inter_y1 = max(xa1, xb1), max(ya1, yb1)
        inter_x2, inter_y2 = min(xa2, xb2), min(ya2, yb2)
        if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
            return 0.0
        inter = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
        union = a.w * a.h + b.w * b.h - inter
        return inter / union

    rects.sort(key=lambda r: (r.y, r.x))
    filtered: List[Rect] = []
    for r in rects:
        if any(iou(r, f) > 0.6 for f in filtered):
            continue
        filtered.append(r)

    # Label kinds
    blocks: List[Tuple[List[int], str]] = []
    for r in filtered:
        kind = "unknown"
        if r.w * r.h > area * CV_THRESHOLDS.section_area_ratio:
            kind = "section"
        blocks.append((r.as_list(), kind))
    return blocks


def detect_grid(image_rgb: np.ndarray) -> Optional[Tuple[int, int, float]]:
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(
        edges,
        rho=CV_THRESHOLDS.hough_rho,
        theta=CV_THRESHOLDS.hough_theta,
        threshold=CV_THRESHOLDS.hough_threshold,
        minLineLength=CV_THRESHOLDS.hough_min_line_length,
        maxLineGap=CV_THRESHOLDS.hough_max_line_gap,
    )
    if lines is None:
        return None
    xs = []
    for l in lines[:, 0, :]:
        x1, y1, x2, y2 = l
        if abs(x2 - x1) < 4 and abs(y2 - y1) > 20:  # vertical-ish
            xs.append((x1 + x2) // 2)
    if not xs:
        return None
    xs = sorted(xs)
    # Cluster x positions into columns via simple gap-based grouping
    cols = []
    current = [xs[0]]
    for x in xs[1:]:
        if abs(x - current[-1]) < 20:
            current.append(x)
        else:
            cols.append(int(np.median(current)))
            current = [x]
    cols.append(int(np.median(current)))
    cols = sorted(set(cols))
    if len(cols) < 2:
        return None
    gutters = [b - a for a, b in zip(cols, cols[1:])]
    gutter = int(np.median(gutters)) if gutters else 0
    confidence = min(1.0, len(xs) / max(1, len(lines)))
    return len(cols), gutter, float(confidence)


def _estimate_corner_radius(rect: Rect, edges: np.ndarray) -> int:
    x0, y0, x1, y1 = rect.x, rect.y, rect.x + rect.w, rect.y + rect.h
    roi = edges[max(0, y0):y1, max(0, x0):x1]
    if roi.size == 0:
        return 0
    # approximate corner radius by distance from corner to first strong edge on diagonal
    h, w = roi.shape[:2]
    diag = min(h, w)
    radius = 0
    for d in range(1, diag // 2):
        if roi[min(h - 1, d), min(w - 1, d)] > 0:
            radius = d
            break
    return int(radius)


def detect_buttons(image_rgb: np.ndarray, texts: List[Tuple[str, List[int]]]) -> List[ButtonCandidate]:
    edges = _preprocess_gray(image_rgb)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates: List[ButtonCandidate] = []
    for c in contours:
        x, y, ww, hh = cv2.boundingRect(c)
        if not (CV_THRESHOLDS.button_min_height_px <= hh <= CV_THRESHOLDS.button_max_height_px):
            continue
        aspect = ww / float(hh)
        if not (CV_THRESHOLDS.button_min_aspect <= aspect <= CV_THRESHOLDS.button_max_aspect):
            continue
        radius = _estimate_corner_radius(Rect(x, y, ww, hh), edges)
        candidates.append(ButtonCandidate(x, y, ww, hh, radius))
    # sort for stable IDs
    candidates.sort(key=lambda r: (r.y, r.x))
    return candidates


def extract_palette(image_rgb: np.ndarray, k: int = 5) -> Tuple[List[str], str]:
    # Downsample for speed
    target_w = 1280
    h, w, _ = image_rgb.shape
    if w > target_w:
        scale = target_w / w
        new_h = int(h * scale)
        resized = cv2.resize(image_rgb, (target_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        resized = image_rgb
    pixels = resized.reshape((-1, 3)).astype(np.float32)
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=0)
    kmeans.fit(pixels)
    centers = kmeans.cluster_centers_.astype(int)
    colors = [rgb_to_hex(c) for c in centers]
    # classify mode by luminance median
    luminances = [float(0.2126 * (c[0] / 255.0) + 0.7152 * (c[1] / 255.0) + 0.0722 * (c[2] / 255.0)) for c in centers]
    mode = "dark" if np.median(luminances) < 0.5 else "light"
    return colors, mode


def compute_contrast(image_rgb: np.ndarray, texts: List[Tuple[str, List[int]]]) -> List[Tuple[str, float, str]]:
    results: List[Tuple[str, float, str]] = []
    img = image_rgb
    for text_id, bbox in texts:
        x, y, w, h = bbox
        if w <= 4 or h <= 4:
            continue
        margin = 2
        x0 = max(0, x + margin)
        y0 = max(0, y + margin)
        x1 = min(img.shape[1], x + w - margin)
        y1 = min(img.shape[0], y + h - margin)
        if x1 <= x0 or y1 <= y0:
            continue
        region = img[y0:y1, x0:x1]
        if region.size < CV_THRESHOLDS.min_contrast_sample_px:
            continue
        # Approx foreground as median of darkest 10% pixels; background as median of brightest 10%
        flat = region.reshape((-1, 3))
        lum = 0.2126 * flat[:, 0] + 0.7152 * flat[:, 1] + 0.0722 * flat[:, 2]
        if len(lum) < 10:
            continue
        idx = np.argsort(lum)
        n = max(1, len(idx) // 10)
        fg = flat[idx[:n]]
        bg = flat[idx[-n:]]
        ratio = float(wcag_contrast_ratio(fg, bg))
        wcag = "PASS" if ratio >= 4.5 else ("WARN" if ratio >= 3.0 else "FAIL")
        results.append((text_id, ratio, wcag))
    return results


def compute_spacing_metrics(text_bboxes: List[List[int]]) -> Tuple[int, float]:
    if not text_bboxes:
        return 0, 0.0
    # median vertical space between subsequent boxes in reading order
    sorted_boxes = sorted(text_bboxes, key=lambda b: (b[1], b[0]))
    gaps = []
    for a, b in zip(sorted_boxes, sorted_boxes[1:]):
        gap = max(0, b[1] - (a[1] + a[3]))
        gaps.append(gap)
    median_vspace = int(np.median(gaps)) if gaps else 0
    left_edges = [b[0] for b in sorted_boxes]
    variance = float(np.var(left_edges)) if left_edges else 0.0
    return median_vspace, variance
