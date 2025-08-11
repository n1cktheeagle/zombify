from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict

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


def _prep_dark_ui(gray: np.ndarray) -> np.ndarray:
    g = np.clip(gray / 255.0, 1e-6, 1.0) ** (1 / 1.6)
    g = (g * 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    g = clahe.apply(g)
    return g


def _edges_for_layout(image_rgb: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    dark = np.median(gray) < 45
    base = _prep_dark_ui(gray) if dark else gray
    blur = cv2.GaussianBlur(base, (3, 3), 0)
    edges = cv2.Canny(blur, 50, 120)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
    return edges


def detect_blocks(image_rgb: np.ndarray) -> List[Tuple[List[int], str]]:
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    base = _prep_dark_ui(gray)
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 9))
    bin_ = cv2.threshold(base, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    inv = 255 - bin_
    close = cv2.morphologyEx(inv, cv2.MORPH_CLOSE, k, iterations=2)

    cnts, _ = cv2.findContours(close, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    blocks: List[Tuple[List[int], str]] = []
    H, W = gray.shape[:2]
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area < 8000 or w < 180 or h < 100:
            continue
        if w / W > 0.95 and h < H * 0.12:
            continue

        rect = cv2.minAreaRect(c)
        box = cv2.boxPoints(rect)
        box = np.int32(box)
        rect_area = w * h
        hull_area = cv2.contourArea(c)
        rectangularity = (hull_area / (rect_area + 1e-6))
        if rectangularity < 0.55:
            continue

        blocks.append(([int(x), int(y), int(w), int(h)], "card"))

    # Merge heavy overlaps
    def iou_bbox(a: List[int], b: List[int]) -> float:
        ax, ay, aw, ah = a; bx, by, bw, bh = b
        x1 = max(ax, bx); y1 = max(ay, by); x2 = min(ax + aw, bx + bw); y2 = min(ay + ah, by + bh)
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        ua = aw * ah + bw * bh - inter
        return inter / (ua + 1e-6)

    merged: List[Tuple[List[int], str]] = []
    for b in blocks:
        if all(iou_bbox(b[0], m[0]) < 0.4 for m in merged):
            merged.append(b)
    return merged


def _grid_candidates(image_rgb: np.ndarray) -> List[Dict[str, float]]:
    h, w, _ = image_rgb.shape
    edges = _edges_for_layout(image_rgb)
    col_sum = edges.sum(axis=0).astype(np.float32)
    if col_sum.size == 0:
        return []
    col_sum = (col_sum - col_sum.min()) / (col_sum.ptp() + 1e-6)
    candidates: List[Dict[str, float]] = []
    for cols in range(2, 7):
        for gutter in range(12, min(80, w // max(1, cols * 2)), 4):
            period = (w - (cols - 1) * gutter) / cols
            if period < 120:
                continue
            bins: List[float] = []
            x = 0.0
            for _ in range(cols - 1):
                x += period
                g0 = int(max(0, round(x)))
                g1 = int(min(w - 1, round(x + gutter)))
                bins.append(float(col_sum[g0:g1].mean()) if g1 > g0 else 0.0)
                x += gutter
            if not bins:
                continue
            score = float(np.mean(bins))
            if score > 0.05:
                candidates.append({"cols": float(cols), "gutterPx": float(gutter), "confidence": score})
    candidates.sort(key=lambda c: c["confidence"], reverse=True)
    return candidates[:8]


def detect_grid(image_rgb: np.ndarray) -> Tuple[Optional[Tuple[int, int, float]], List[Dict[str, float]]]:
    """Return best grid (cols, gutter, confidence) and candidate list."""
    cands = _grid_candidates(image_rgb)
    best = cands[0] if cands else None
    best_tuple: Optional[Tuple[int, int, float]] = None
    if best:
        best_tuple = (int(best["cols"]), int(best["gutterPx"]), float(best["confidence"]))
    return best_tuple, cands


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
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    base = _prep_dark_ui(gray)
    inv = 255 - base
    mser = cv2.MSER_create(_min_area=80, _max_area=12000)
    regions = []
    for img in (base, inv):
        r, _ = mser.detectRegions(img)
        regions.extend(r)

    boxes: List[Rect] = []
    H, W = gray.shape[:2]
    for pts in regions:
        x, y, w, h = cv2.boundingRect(pts.reshape(-1, 1, 2))
        ar = w / float(h + 1e-6)
        area = w * h
        if area < 300 or area > W * H * 0.15:
            continue
        if ar < 1.4 or ar > 6.5:
            continue
        peri = 2 * (w + h)
        approx = cv2.approxPolyDP(pts, 0.03 * peri, True)
        if len(approx) > 10:
            continue
        boxes.append(Rect(x, y, w, h))

    def has_center_text(b: Rect) -> bool:
        bx, by, bw, bh = b.x, b.y, b.w, b.h
        cx, cy = bx + bw / 2.0, by + bh / 2.0
        for _id, tb in texts or []:
            tx, ty, tw, th = tb
            if bx <= tx and ty >= by and (tx + tw) <= (bx + bw) and (ty + th) <= (by + bh):
                tcx, tcy = tx + tw / 2.0, ty + th / 2.0
                if abs(tcx - cx) <= bw * 0.22 and abs(tcy - cy) <= bh * 0.28:
                    return True
        return False

    scored: List[Tuple[Rect, float]] = [(b, 1.0 + (0.5 if has_center_text(b) else 0.0)) for b in boxes]
    scored.sort(key=lambda x: x[1], reverse=True)

    def iou(a: Rect, b: Rect) -> float:
        ax1, ay1, ax2, ay2 = a.x, a.y, a.x + a.w, a.y + a.h
        bx1, by1, bx2, by2 = b.x, b.y, b.x + b.w, b.y + b.h
        inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
        inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
        if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
            return 0.0
        inter = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
        ua = a.w * a.h + b.w * b.h - inter
        return inter / (ua + 1e-6)

    kept: List[Rect] = []
    for b, _s in scored:
        if all(iou(b, k) < 0.25 for k in kept):
            kept.append(b)

    edges = _preprocess_gray(image_rgb)
    candidates: List[ButtonCandidate] = []
    for r in kept:
        candidates.append(ButtonCandidate(r.x, r.y, r.w, r.h, _estimate_corner_radius(r, edges)))

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
