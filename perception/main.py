from __future__ import annotations

import json
import os
import time
from typing import List, Tuple

import cv2
from fastapi import FastAPI, Response

from . import config
from .config import VERSION, DEFAULT_TARGET_WIDTH, OCR_BACKEND, CACHE_DIR
from .gcv_ocr import run_ocr as gcv_run_ocr
from .cv_ops import (
    detect_blocks,
    detect_grid,
    detect_buttons,
    extract_palette,
    compute_contrast,
    compute_spacing_metrics,
)
from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ImageInfo,
    TextItem,
    ContrastItem,
    BlockItem,
    GridInfo,
    ButtonItem,
    PaletteInfo,
    MetricsInfo,
    SourceInfo,
)
from .utils import download_and_preprocess

app = FastAPI()


def _cache_path(content_hash: str, width: int) -> str | None:
    if not CACHE_DIR:
        return None
    os.makedirs(CACHE_DIR, exist_ok=True)
    fname = f"{content_hash}-w{width}.json"
    return os.path.join(CACHE_DIR, fname)


@app.get("/health")
def health(config_: int | None = None):
    payload = {"ok": True, "version": VERSION}
    if config_:
        payload["config"] = {
            "DEFAULT_TARGET_WIDTH": DEFAULT_TARGET_WIDTH,
            "OCR_BACKEND": OCR_BACKEND,
            "CACHE_DIR": CACHE_DIR,
            "CV_THRESHOLDS": config.CV_THRESHOLDS.__dict__,
        }
    return payload


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, response: Response):
    t_start = time.time()
    modes = set(req.modes or ["ocr", "geometry", "contrast", "palette"])

    # download + resize
    img_rgb, meta = download_and_preprocess(req.image_url, req.target_width or DEFAULT_TARGET_WIDTH)

    # serve from cache if available
    cpath = _cache_path(meta["hash"], meta["width"])
    if cpath and os.path.exists(cpath):
        try:
            with open(cpath, "r", encoding="utf-8") as f:
                cached = json.load(f)
            # mark as cache hit
            response.headers["X-Perf-total-ms"] = f"{(time.time() - t_start) * 1000:.1f}"
            response.headers["X-Cache"] = "HIT"
            return cached
        except Exception:
            pass  # fall through

    t_after_download = time.time()

    texts_items: List[TextItem] = []
    source_ocr = ""
    t_ocr_start = time.time()

    # OCR backend switch
    try:
        if "ocr" in modes:
            if OCR_BACKEND == "gcv":
                ocr_lines = gcv_run_ocr(img_rgb)
                source_ocr = "gcv-3.x"
            elif OCR_BACKEND == "paddle":
                try:
                    from .paddle_ocr import run_ocr as paddle_run_ocr  # type: ignore
                except Exception:
                    raise RuntimeError("not installed")
                ocr_lines = paddle_run_ocr(img_rgb)
                source_ocr = "paddle"
            else:
                ocr_lines = []
                source_ocr = f"error:unknown backend {OCR_BACKEND}"
            for i, line in enumerate(ocr_lines):
                x, y, w, h = line.bbox
                approx_size = int(round(h * 0.7))
                texts_items.append(
                    TextItem(id=f"texts.t{i}", text=line.text, bbox=[x, y, w, h], conf=float(line.conf), approxSizePx=approx_size)
                )
    except Exception as e:
        texts_items = []
        msg = str(e)
        source_ocr = f"error:{msg}"

    t_ocr_end = time.time()

    # geometry
    t_cv_start = time.time()
    blocks_items: List[BlockItem] = []
    buttons_items: List[ButtonItem] = []
    grid_info = None
    palette_info = None
    metrics_info = None
    if "geometry" in modes:
        blocks = detect_blocks(img_rgb)
        for i, (bbox, kind) in enumerate(blocks):
            blocks_items.append(BlockItem(id=f"blocks.b{i}", bbox=bbox, kind=kind))
        grid = detect_grid(img_rgb)
        if grid is not None:
            cols, gutter, conf = grid
            grid_info = GridInfo(cols=cols, gutterPx=int(gutter), confidence=float(conf))
        texts_for_buttons: List[Tuple[str, List[int]]] = [(t.id, t.bbox) for t in texts_items]
        btns = detect_buttons(img_rgb, texts_for_buttons)
        btns.sort(key=lambda b: (b.y, b.x))
        for i, b in enumerate(btns):
            cx, cy = b.x + b.w // 2, b.y + b.h // 2
            text_id = None
            has_center_text = False
            for t in texts_items:
                tx, ty, tw, th = t.bbox
                if tx <= cx <= tx + tw and ty <= cy <= ty + th:
                    text_id = t.id
                    has_center_text = True
                    break
            buttons_items.append(
                ButtonItem(
                    id=f"buttons.btn{i}",
                    bbox=[b.x, b.y, b.w, b.h],
                    cornerRadius=int(b.corner_radius),
                    hasCenterText=has_center_text,
                    textId=text_id,
                )
            )

    if "palette" in modes:
        colors, mode = extract_palette(img_rgb, k=5)
        palette_info = PaletteInfo(dominant=colors, mode=mode)

    contrast_items: List[ContrastItem] = []
    if "contrast" in modes and texts_items:
        txts = [(t.id, t.bbox) for t in texts_items]
        contrast = compute_contrast(img_rgb, txts)
        for i, (text_id, ratio, wcag) in enumerate(contrast):
            contrast_items.append(ContrastItem(id=f"contrast.c{i}", textId=text_id, ratio=round(float(ratio), 3), wcag=wcag))

    if texts_items:
        median_vspace, left_var = compute_spacing_metrics([t.bbox for t in texts_items])
        metrics_info = MetricsInfo(medianVSpace=int(median_vspace), leftEdgeVariancePx=float(round(left_var, 2)))

    t_cv_end = time.time()

    image_info = ImageInfo(w=meta["width"], h=meta["height"], hash=meta["hash"])
    src = SourceInfo(ocr=source_ocr or "gcv-unknown", cv=f"opencv-{cv2.__version__}")

    # timings headers
    response.headers["X-Perf-ocr-ms"] = f"{(t_ocr_end - t_ocr_start) * 1000:.1f}"
    response.headers["X-Perf-cv-ms"] = f"{(t_cv_end - t_cv_start) * 1000:.1f}"
    response.headers["X-Perf-total-ms"] = f"{(time.time() - t_start) * 1000:.1f}"
    response.headers["X-Cache"] = "MISS"

    result = AnalyzeResponse(
        version=VERSION,
        image=image_info,
        texts=texts_items,
        contrast=contrast_items,
        blocks=blocks_items,
        grid=grid_info,
        buttons=buttons_items,
        palette=palette_info,
        metrics=metrics_info,
        source=src,
    )

    # write cache
    if cpath:
        try:
            with open(cpath, "w", encoding="utf-8") as f:
                json.dump(json.loads(result.model_dump_json()), f, ensure_ascii=False)
        except Exception:
            pass

    return result
