from __future__ import annotations

import json
import logging
import os
import time
from typing import List, Tuple

import cv2
from fastapi import FastAPI, Response, Request
from fastapi.responses import JSONResponse
import traceback
from . import gcv_ocr
import sys

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

# Ensure startup logs are emitted via uvicorn's logger
_uvicorn_logger = logging.getLogger("uvicorn.error")

@app.on_event("startup")
def _log_startup_info() -> None:
    gac = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    gac_exists = bool(gac and os.path.exists(gac))
    _uvicorn_logger.info(
        "GOOGLE_APPLICATION_CREDENTIALS=%s exists=%s", gac or "<unset>", gac_exists
    )
    _uvicorn_logger.info("OCR_BACKEND=%s", OCR_BACKEND)


@app.on_event("startup")
async def _startup_debug_vision() -> None:
    try:
        logger = logging.getLogger("uvicorn")
        info = gcv_ocr.debug_info()
        logger.info("Vision debug: %s", info)
    except Exception as e:
        logging.getLogger("uvicorn").warning("Vision debug failed: %s", e)

    # Preflight: verify Service Usage permission; if missing, log fatal and exit
    try:
        gcv_ocr.verify_vision_access()
    except Exception as e:
        logger = logging.getLogger("uvicorn.error")
        dbg = gcv_ocr.debug_info()
        client_email = (dbg or {}).get("client_email") or "<unknown>"
        project_id = (dbg or {}).get("project_id") or "<unknown>"
        logger.critical(
            "FATAL: Google Vision access check failed. The service account likely lacks the '\n"
            "Service Usage Consumer' role (roles/serviceusage.serviceUsageConsumer).\n"
            "Grant this role to %s on project %s.\n"
            "Open: https://console.cloud.google.com/iam-admin/iam?project=%s",
            client_email,
            project_id,
            project_id,
        )
        logger.critical("Startup aborted due to insufficient IAM permissions: %s", str(e))
        sys.exit(1)


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
def analyze(req: AnalyzeRequest, response: Response, request: Request):
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
    ocr_debug = gcv_ocr.debug_info()
    ocr_google: dict | None = None
    t_ocr_start = time.time()

    # OCR backend switch
    try:
        if "ocr" in modes:
            if OCR_BACKEND == "gcv":
                ocr_lines = gcv_run_ocr(img_rgb)
                source_ocr = "google:ok"
                ocr_google = {
                    "client_email": ocr_debug.get("client_email"),
                    "project_id": ocr_debug.get("project_id"),
                }
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
        _uvicorn_logger.error("OCR failed: %s\n%s", msg, traceback.format_exc())
        # Optional 502 passthrough
        return_error = request.query_params.get("return_error") == "1"
        if return_error:
            image_info = ImageInfo(w=meta["width"], h=meta["height"], hash=meta["hash"])
            src = SourceInfo(
                ocr=source_ocr,
                cv=f"opencv-{cv2.__version__}",
                google=None,
                debug=ocr_debug,
                ocr_exception=e.__class__.__name__,
            )
            result = AnalyzeResponse(
                version=VERSION,
                image=image_info,
                texts=[],
                contrast=[],
                blocks=[],
                grid=None,
                buttons=[],
                palette=None,
                metrics=None,
                source=src,
            )
            return JSONResponse(status_code=502, content=json.loads(result.model_dump_json()))

    t_ocr_end = time.time()

    # geometry
    t_cv_start = time.time()
    blocks_items: List[BlockItem] = []
    buttons_items: List[ButtonItem] = []
    grid_info = None
    grid_candidates_model: List[GridInfo] | None = None
    palette_info = None
    metrics_info = None
    if "geometry" in modes:
        blocks = detect_blocks(img_rgb)
        for i, (bbox, kind) in enumerate(blocks):
            blocks_items.append(BlockItem(id=f"blocks.b{i}", bbox=bbox, kind=kind))
        # Grid disabled
        best_grid, grid_candidates = (None, [])
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
    src = SourceInfo(
        ocr=source_ocr or "gcv-unknown",
        cv=f"opencv-{cv2.__version__}",
        google=ocr_google if source_ocr == "google:ok" else None,
        debug=ocr_debug,
        ocr_exception=None,
    )

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

    # attach grid candidates if available
    # Grid candidates disabled

    # write cache
    if cpath:
        try:
            with open(cpath, "w", encoding="utf-8") as f:
                json.dump(json.loads(result.model_dump_json()), f, ensure_ascii=False)
        except Exception:
            pass

    return result


@app.get("/debug/vision")
def debug_vision():
    return gcv_ocr.debug_info()
