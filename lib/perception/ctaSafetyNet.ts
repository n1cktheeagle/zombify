// lib/perception/ctaSafetyNet.ts
// Deterministic CTA/Button detector for dark UIs.
// Deps at runtime: opencv4nodejs (or @u4/opencv4nodejs-prebuilt)

/*
  NOTE: We intentionally avoid TypeScript type coupling to the OpenCV bindings
  so this file can live in the repo even if opencv4nodejs isn't installed yet.
  At runtime you must have one of these available:
    - opencv4nodejs
    - @u4/opencv4nodejs-prebuilt (drop-in alias)
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const _cv: any = (() => {
  try {
    // Prefer prebuilt if present
    return require('@u4/opencv4nodejs-prebuilt');
  } catch (_) {
    try {
      return require('opencv4nodejs');
    } catch (_e) {
      return null;
    }
  }
})();

export type BBox = { x: number; y: number; w: number; h: number };
export type OCRText = { text: string; bbox: BBox };
export type ButtonDetection = {
  id: string;
  type: 'button';
  bbox: BBox;
  confidence: number;
  reason: string;
  source: 'safety-net';
  label?: string;
  variant?: 'solid' | 'outline' | 'unknown';
};

type Variant = 'orig' | 'gamma' | 'clahe';

/** Main entry */
export function ctaSafetyNet(
  imgBgr: any, // BGR image Mat (from opencv4nodejs)
  ocr: OCRText[],
  viewportH: number,
  opts?: Partial<{
    minArea: number; // px^2
    aspectMin: number; // w/h
    aspectMax: number;
    minContrast: number; // inside vs ring
    aboveFoldFactor: number;
    nmsIoU: number;
  }>
): ButtonDetection[] {
  if (!_cv) return [];
  const cv = _cv;

  const cfg = {
    minArea: 2000,
    aspectMin: 2.0,
    aspectMax: 8.0,
    minContrast: 2.5,
    aboveFoldFactor: 0.9,
    nmsIoU: 0.4,
    ...opts,
  };

  const variants: [Variant, any][] = [
    ['orig', imgBgr],
    ['gamma', adjustGamma(cv, imgBgr, 1.6)],
    ['clahe', claheOnV(cv, imgBgr)],
  ];

  const raw: ButtonDetection[] = [];
  for (const [variant, mat] of variants) {
    const gray = mat.cvtColor(cv.COLOR_BGR2GRAY);
    const blur = gray.gaussianBlur(new cv.Size(3, 3), 0);
    const edges = blur.canny(40, 120);

    const contours = edges.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    for (const c of contours) {
      const r = c.boundingRect();
      const area = r.width * r.height;
      if (area < cfg.minArea) continue;
      const aspect = r.width / Math.max(1, r.height);
      if (aspect < cfg.aspectMin || aspect > cfg.aspectMax) continue;

      const bbox: BBox = { x: r.x, y: r.y, w: r.width, h: r.height };
      const { ratio, fillStd, bgStd } = contrastRatioRing(cv, gray, bbox);
      if (ratio < cfg.minContrast) continue;

      const variantGuess: 'solid' | 'outline' | 'unknown' = fillStd < bgStd * 0.7 ? 'solid' : 'outline';

      // Prefer OCR inside/nearly centered
      const center = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
      const near = nearestOcr(ocr, center, bbox);
      if (!near) continue;
      const clean = (near.text || '').trim();
      if (clean.length < 3 || clean.length > 12) continue;

      const aboveFold = bbox.y + bbox.h <= cfg.aboveFoldFactor * viewportH;

      const conf = clamp01(
        0.3 +
          0.15 * Math.tanh((ratio - 2.0) / 2) +
          0.1 * Math.tanh((aspect - 2.0) / 4) +
          (variantGuess === 'solid' ? 0.1 : 0) +
          (aboveFold ? 0.1 : 0)
      );

      raw.push({
        id: `cta_${variant}_${r.x}_${r.y}_${r.width}x${r.height}`,
        type: 'button',
        bbox,
        confidence: conf,
        source: 'safety-net',
        variant: variantGuess,
        label: clean,
        reason: `cta-safety-pass (${variant}); contrast=${ratio.toFixed(2)}, aspect=${aspect.toFixed(2)}, fillStd=${fillStd.toFixed(1)}`,
      });
    }
  }

  const merged = nms(raw, cfg.nmsIoU);
  return merged.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

/* ---------------- helpers ---------------- */

function adjustGamma(cv: any, imgBgr: any, gamma = 1.6) {
  const inv = 1.0 / Math.max(0.01, gamma);
  const lut = new cv.Mat(1, 256, cv.CV_8U);
  for (let i = 0; i < 256; i++) lut.set(0, i, Math.pow(i / 255, inv) * 255);
  // Apply LUT on each channel by converting to HSV value channel so we only brighten value
  // Simpler: use direct LUT on BGR
  return imgBgr.lut(lut);
}

function claheOnV(cv: any, imgBgr: any) {
  const hsv = imgBgr.cvtColor(cv.COLOR_BGR2HSV);
  const channels = hsv.split();
  const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
  const vEq = clahe.apply(channels[2]);
  const merged = new cv.Mat();
  cv.merge([channels[0], channels[1], vEq], merged);
  return merged.cvtColor(cv.COLOR_HSV2BGR);
}

function contrastRatioRing(cv: any, gray: any, box: BBox) {
  const x = Math.max(0, box.x),
    y = Math.max(0, box.y);
  const w = Math.min(gray.cols - x, box.w),
    h = Math.min(gray.rows - y, box.h);
  if (w <= 2 || h <= 2) return { ratio: 1, fillStd: 0, bgStd: 0 };

  const roi = gray.getRegion(new _cv.Rect(x, y, w, h));
  const meanIn = roi.mean().w;
  const stdIn = roi.stdDev().w;

  const pad = 6;
  const rx = Math.max(0, x - pad),
    ry = Math.max(0, y - pad);
  const rw = Math.min(gray.cols - rx, w + 2 * pad),
    rh = Math.min(gray.rows - ry, h + 2 * pad);
  const ring = gray.getRegion(new _cv.Rect(rx, ry, rw, rh));
  const meanRing = ring.mean().w;

  const L1 = (Math.max(meanIn, meanRing) + 5) / (Math.min(meanIn, meanRing) + 5);
  return { ratio: L1, fillStd: stdIn, bgStd: ring.stdDev().w };
}

function nearestOcr(ocr: OCRText[], center: { x: number; y: number }, box: BBox) {
  let best: OCRText | null = null;
  let bestD = Infinity;
  for (const t of ocr) {
    const cx = t.bbox.x + t.bbox.w / 2;
    const cy = t.bbox.y + t.bbox.h / 2;
    const inside = cx >= box.x && cx <= box.x + box.w && cy >= box.y && cy <= box.y + box.h;
    const dx = cx - center.x,
      dy = cy - center.y;
    const d = Math.hypot(dx, dy) + (inside ? 0 : 80);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

function iou(a: BBox, b: BBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni <= 0 ? 0 : inter / uni;
}

function nms(dets: ButtonDetection[], thr: number) {
  const out: ButtonDetection[] = [];
  const pool = [...dets].sort((a, b) => b.confidence - a.confidence);
  while (pool.length) {
    const cur = pool.shift()!;
    out.push(cur);
    for (let i = pool.length - 1; i >= 0; i--) {
      if (iou(cur.bbox, pool[i].bbox) > thr) pool.splice(i, 1);
    }
  }
  return out;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}


