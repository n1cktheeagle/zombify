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
    H, W = gray.shape[:2]

    # Kernel size scales with image width to better close rounded card corners
    kx = max(9, int(W * 0.012))
    ky = max(7, int(H * 0.008))
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (kx | 1, ky | 1))

    bin_ = cv2.threshold(base, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    inv = 255 - bin_
    close = cv2.morphologyEx(inv, cv2.MORPH_CLOSE, k, iterations=2)
    # Also union an adaptive-threshold variant to capture soft-edged cards
    adap = cv2.adaptiveThreshold(base, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 2)
    union = cv2.max(close, cv2.morphologyEx(adap, cv2.MORPH_CLOSE, k, iterations=1))

    cnts, _ = cv2.findContours(union, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    blocks: List[Tuple[List[int], str]] = []
    min_area = int(max(6000, CV_THRESHOLDS.min_block_area_ratio * W * H))
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area < min_area or w < 160 or h < 80:
            continue
        # Ignore ultra-wide skinny bars (nav bars, separators)
        if (w / max(1, W)) > 0.95 and h < H * 0.09:
            continue

        rect_area = w * h
        hull_area = cv2.contourArea(c)
        rectangularity = (hull_area / (rect_area + 1e-6))
        if rectangularity < 0.60:
            continue

        kind = "section" if (w > 0.55 * W and h > 0.14 * H) else "card"
        blocks.append(([int(x), int(y), int(w), int(h)], kind))

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

    # Secondary pass: rectangle-shape detection for centered modals
    edges = _edges_for_layout(image_rgb)
    cnts2, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in cnts2:
        peri = cv2.arcLength(c, True)
        if peri < 200:  # ignore small
            continue
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) != 4:
            continue
        x, y, w, h = cv2.boundingRect(approx)
        area = w * h
        if area < min_area:
            continue
        # focus on central region (modal-like)
        cx = x + w / 2.0
        cy = y + h / 2.0
        if not (W * 0.25 <= cx <= W * 0.75 and H * 0.25 <= cy <= H * 0.8):
            continue
        ar = w / float(h + 1e-6)
        if ar < 0.7 or ar > 1.8:  # typical modal aspect range
            continue
        if all(iou_bbox([x, y, w, h], m[0]) < 0.35 for m in merged):
            merged.append(([int(x), int(y), int(w), int(h)], "section"))

    return merged


def _grid_candidates(image_rgb: np.ndarray) -> List[Dict[str, float]]:
    # Grid detection disabled intentionally
    return []


def detect_grid(image_rgb: np.ndarray) -> Tuple[Optional[Tuple[int, int, float]], List[Dict[str, float]]]:
    # Grid detection disabled intentionally
    return None, []


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
    # Primary pass: MSER targeting UI-like elongated regions
    mser = cv2.MSER_create(5, 60, 20000)
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
        # Size/aspect constraints for typical buttons
        if h < CV_THRESHOLDS.button_min_height_px or h > min(CV_THRESHOLDS.button_max_height_px, int(H * 0.25)):
            continue
        if ar < CV_THRESHOLDS.button_min_aspect or ar > CV_THRESHOLDS.button_max_aspect:
            continue
        # Exclude progress bars (very thin and very wide)
        if h <= 18 and ar >= 5.5:
            continue
        boxes.append(Rect(x, y, w, h))

    def has_center_text(b: Rect) -> bool:
        bx, by, bw, bh = b.x, b.y, b.w, b.h
        cx, cy = bx + bw / 2.0, by + bh / 2.0
        for _id, tb in texts or []:
            tx, ty, tw, th = tb
            if bx <= tx and ty >= by and (tx + tw) <= (bx + bw) and (ty + th) <= (by + bh):
                tcx, tcy = tx + tw / 2.0, ty + th / 2.0
                # Relaxed: allow text to be near center (broader band)
                if (bx + bw * 0.15) <= tcx <= (bx + bw * 0.85) and (by + bh * 0.2) <= tcy <= (by + bh * 0.8):
                    return True
        return False

    # Score candidates: prioritize those with centered text
    scored: List[Tuple[Rect, float]] = [(b, (1.0 if has_center_text(b) else 0.4)) for b in boxes]
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

    def roi_color_homogeneity(rect: Rect) -> Tuple[float, float, float]:
        x0 = max(0, rect.x + 2)
        y0 = max(0, rect.y + 2)
        x1 = min(image_rgb.shape[1], rect.x + rect.w - 2)
        y1 = min(image_rgb.shape[0], rect.y + rect.h - 2)
        if x1 <= x0 or y1 <= y0:
            return 0.0, 1.0, 1.0
        roi = image_rgb[y0:y1, x0:x1]
        hsv = cv2.cvtColor(roi, cv2.COLOR_RGB2HSV)
        sat = hsv[..., 1].astype(np.float32) / 255.0
        val = hsv[..., 2].astype(np.float32) / 255.0
        return float(np.mean(sat)), float(np.std(sat)), float(np.std(val))

    def ring_background_delta(rect: Rect) -> float:
        # Compare ROI brightness against a ring around it to capture CTA pop against modal
        margin = 6
        x0 = max(0, rect.x - margin)
        y0 = max(0, rect.y - margin)
        x1 = min(image_rgb.shape[1], rect.x + rect.w + margin)
        y1 = min(image_rgb.shape[0], rect.y + rect.h + margin)
        if x1 <= x0 or y1 <= y0:
            return 0.0
        ring = image_rgb[y0:y1, x0:x1].copy()
        # carve inner box to isolate ring
        ix0 = max(0, rect.x - x0)
        iy0 = max(0, rect.y - y0)
        ix1 = min(ring.shape[1], ix0 + rect.w)
        iy1 = min(ring.shape[0], iy0 + rect.h)
        if ix1 > ix0 and iy1 > iy0:
            ring[iy0:iy1, ix0:ix1] = 0
        hsv_ring = cv2.cvtColor(ring, cv2.COLOR_RGB2HSV)
        val_ring = hsv_ring[..., 2].astype(np.float32) / 255.0
        sat_mean, _sat_std, _val_std = roi_color_homogeneity(rect)
        hsv_roi = cv2.cvtColor(image_rgb[max(0, rect.y):min(image_rgb.shape[0], rect.y + rect.h), max(0, rect.x):min(image_rgb.shape[1], rect.x + rect.w)], cv2.COLOR_RGB2HSV)
        val_roi = hsv_roi[..., 2].astype(np.float32) / 255.0
        bg_mean = float(np.mean(val_ring[val_ring > 0])) if np.any(val_ring > 0) else 0.0
        roi_mean = float(np.mean(val_roi)) if val_roi.size else 0.0
        return float(roi_mean - bg_mean)

    def has_left_aligned_text(rect: Rect) -> bool:
        bx, by, bw, bh = rect.x, rect.y, rect.w, rect.h
        for _id, tb in texts or []:
            tx, ty, tw, th = tb
            # text center inside left 35% of the candidate and roughly vertically centered
            tcx, tcy = tx + tw / 2.0, ty + th / 2.0
            if bx <= tcx <= bx + bw * 0.35 and by + bh * 0.25 <= tcy <= by + bh * 0.75:
                return True
        return False
    candidates: List[ButtonCandidate] = []
    for r in kept:
        # Require a strong acceptance signal:
        # 1) centered text, or 2) rounded corners, or 3) uniform high-saturation fill (CTA-like)
        cen = has_center_text(r)
        radius = _estimate_corner_radius(r, edges)
        sat_mean, sat_std, val_std = roi_color_homogeneity(r)
        uniform_fill = sat_mean >= 0.18 and sat_std <= 0.17 and val_std <= 0.20
        pop_delta = ring_background_delta(r)
        strong_pop = pop_delta >= 0.10  # CTA noticeably brighter than surrounding
        if not (cen or (radius / max(1, r.h)) >= CV_THRESHOLDS.button_corner_radius_threshold or uniform_fill or strong_pop):
            continue
        # Filter likely text inputs: left-aligned text inside, low saturation, sharp corners
        if not cen and not uniform_fill and not strong_pop and has_left_aligned_text(r):
            continue
        candidates.append(ButtonCandidate(r.x, r.y, r.w, r.h, radius))

    # Fallback: if MSER-based detection yields nothing, use contour/morphology-based elongated rectangles
    if not candidates:
        try:
            # 1) Otsu threshold both base and inverted to capture light/dark buttons
            base_bin = cv2.threshold(base, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            inv_bin = 255 - base_bin
            # 2) Add adaptive threshold variant for robustness
            adap = cv2.adaptiveThreshold(base, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 2)
            # 3) Morph close to merge rounded corners
            k = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 7))
            variants = [
                cv2.morphologyEx(base_bin, cv2.MORPH_CLOSE, k, iterations=1),
                cv2.morphologyEx(inv_bin, cv2.MORPH_CLOSE, k, iterations=1),
                cv2.morphologyEx(adap, cv2.MORPH_CLOSE, k, iterations=1),
            ]
            for bin_img in variants:
                cnts, _ = cv2.findContours(bin_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for c in cnts:
                    x, y, w, h = cv2.boundingRect(c)
                    area = w * h
                    if area < 600 or area > W * H * 0.25:
                        continue
                    # Height constraints for typical UI button sizes
                    if h < CV_THRESHOLDS.button_min_height_px or h > min(CV_THRESHOLDS.button_max_height_px, int(H * 0.25)):
                        continue
                    ar = w / float(h + 1e-6)
                    if ar < CV_THRESHOLDS.button_min_aspect or ar > (CV_THRESHOLDS.button_max_aspect + 2.0):
                        continue
                    rect_area = w * h
                    hull_area = cv2.contourArea(c)
                    # Extent/solidity filter to avoid very hollow shapes
                    rectangularity = (hull_area / (rect_area + 1e-6))
                    if rectangularity < 0.5:
                        continue
                    r = Rect(int(x), int(y), int(w), int(h))
                    cen = has_center_text(r)
                    sat_mean, sat_std, val_std = roi_color_homogeneity(r)
                    uniform_fill = sat_mean >= 0.18 and sat_std <= 0.17 and val_std <= 0.20
                    pop_delta = ring_background_delta(r)
                    strong_pop = pop_delta >= 0.10
                    if cen or uniform_fill or strong_pop:
                        candidates.append(ButtonCandidate(r.x, r.y, r.w, r.h, _estimate_corner_radius(r, edges)))
        except Exception:
            pass

    # Final NMS to reduce duplicates between methods
    if candidates:
        reduced: List[ButtonCandidate] = []
        def iou_btn(a: ButtonCandidate, b: ButtonCandidate) -> float:
            ax1, ay1, ax2, ay2 = a.x, a.y, a.x + a.w, a.y + a.h
            bx1, by1, bx2, by2 = b.x, b.y, b.x + b.w, b.y + b.h
            inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
            inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
            if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
                return 0.0
            inter = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
            ua = a.w * a.h + b.w * b.h - inter
            return inter / (ua + 1e-6)
        for cand in candidates:
            if all(iou_btn(cand, k) < 0.35 for k in reduced):
                reduced.append(cand)
        candidates = reduced

    # CTA color-mask fallback: search for bright, saturated elongated rect in central band (modal CTA heuristic)
    if not candidates or len(candidates) < 3:
        try:
            hsv = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2HSV)
            sat = hsv[..., 1]
            val = hsv[..., 2]
            mask = cv2.inRange(sat, int(0.25 * 255), 255) & cv2.inRange(val, int(0.55 * 255), 255)
            k = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 5))
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=2)
            cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cx0, cx1 = int(W * 0.20), int(W * 0.80)
            cy0, cy1 = int(H * 0.30), int(H * 0.90)
            for c in cnts:
                x, y, w, h = cv2.boundingRect(c)
                if x < cx0 or x + w > cx1 or y < cy0 or y + h > cy1:
                    continue
                if h < CV_THRESHOLDS.button_min_height_px or h > min(CV_THRESHOLDS.button_max_height_px * 1.2, int(H * 0.25)):
                    continue
                ar = w / float(h + 1e-6)
                if ar < max(1.8, CV_THRESHOLDS.button_min_aspect) or ar > (CV_THRESHOLDS.button_max_aspect + 2.5):
                    continue
                r = Rect(int(x), int(y), int(w), int(h))
                # Ensure it pops against surrounding
                if ring_background_delta(r) < 0.08:
                    continue
                # Avoid input-like left aligned text
                if has_left_aligned_text(r) and _estimate_corner_radius(r, edges) < int(0.08 * h):
                    continue
                # Accept
                candidates.append(ButtonCandidate(r.x, r.y, r.w, r.h, _estimate_corner_radius(r, edges)))
        except Exception:
            pass

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
