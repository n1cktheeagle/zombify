import { iou, nms } from "../utils/geometry";
import type { BBox } from "../utils/geometry";
import { computeImageStats, isButtonShaped } from "../utils/imageStats";
import type { Perception, OCRText, RawButton, ScoredBox, PostProcessResult, Contrast } from "./types";

// Tunable, deterministic params (exported)
export const PARAMS = {
  // BUTTONS
  allowTextAsButton: false,
  buttonMinScore: 0.8,
  buttonGrace: 0.0,
  buttonNmsIoU: 0.2,
  btnGeom: {
    height: [22, 56] as [number, number],
    width: [72, 280] as [number, number],
    aspect: [1.4, 6.0] as [number, number],
    maxAreaPct: 0.05,
  },

  // SECTIONS
  sectionMinScore: 0.7,
  sectionNmsIoU: 0.3,
  sectionAreaPct: [0.05, 0.55] as [number, number],
  sectionFullscreenPenalty: 0.3,

  // LAYOUT
  nearTextPx: 16,
  centerTol: 0.3,
  textPad: 6,
} as const;

export const SECTION_RULES = {
  needTitle: true,
  minTextsInside: 6,
  titleMaxChars: 28,
} as const;

export type PostprocessOutput = {
  texts: Perception["texts"];
  buttons: ScoredBox[];
  sections: ScoredBox[];
  candidates: { buttons: BBox[]; sections: BBox[] };
  _debug?: any;
};

// Affordance lexicon
export const AFFORDANCE_TERMS = [
  "ok",
  "cancel",
  "close",
  "next",
  "back",
  "buy",
  "add",
  "join",
  "play",
  "start",
  "install",
  "download",
  "submit",
  "continue",
  "save",
  "apply",
  "send",
  "withdraw",
  "deposit",
  "repair",
  "delete",
  "yes",
  "no",
  "sign in",
  "sign up",
  "learn more",
  "get pro",
  "make primary",
  "ignore",
  "bet",
  "clear",
];

const ARROW_CHARS = /[►▶▸→↓↑«»]/;

function makeIgnoreBands(imageW: number, imageH: number): BBox[] {
  return [
    [0, 0, Math.max(160, Math.floor(imageW * 0.11)), imageH],
    [0, 0, imageW, Math.max(72, Math.floor(imageH * 0.09))],
  ];
}

function overlapsIgnored(b: BBox, ignore: BBox[], iouFn: (a: BBox, b: BBox) => number): boolean {
  return ignore.some((band) => iouFn(b, band) > 0.15);
}

function overlaps(a: BBox, b: BBox): boolean {
  return iou(a, b) > 0;
}

// Text normalization
export function normalizeText(raw: string | null | undefined): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  // Collapse whitespace, trim, strip punctuation except intra-word spaces
  const stripped = lower
    .replace(/[\p{P}\p{S}]/gu, " ") // punctuation/symbols to space
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

// Label formatting: trim + collapse whitespace + strip punctuation, but preserve case
function formatLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  const stripped = raw
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

// Check if text is all caps (>=80% uppercase letters)
function isMostlyAllCaps(raw: string): boolean {
  const letters = raw.match(/[a-zA-Z]/g) || [];
  if (letters.length === 0) return false;
  const upper = letters.filter((c) => c === c.toUpperCase()).length;
  return upper / letters.length >= 0.8;
}

// Affordance score based on normalized content
export function textAffordanceScore(str: string): number {
  const raw = str || "";
  const norm = normalizeText(raw);
  let score = 0;

  // Exact or word-boundary match
  for (const term of AFFORDANCE_TERMS) {
    const t = term.toLowerCase();
    const regex = new RegExp(`(^|\\b)${escapeRegex(t)}(\\b|$)`);
    if (regex.test(norm)) {
      score += 0.35;
      break;
    }
  }

  // Contains arrow/chevron
  if (ARROW_CHARS.test(raw)) score += 0.08;

  // Length heuristic
  const len = norm.length;
  if (len >= 2 && len <= 24) score += 0.05;

  // All caps
  if (isMostlyAllCaps(raw)) score += 0.05;

  return score;
}

function contrastScore(contrast: Contrast[] | undefined, textId: string | null | undefined): number {
  if (!contrast || !textId) return 0;
  const c = contrast.find((c) => c.textId === textId);
  if (!c) return 0;
  if (c.wcag === "PASS") return 0.05;
  if (c.wcag === "WARN") return 0.02;
  return 0;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bboxCenter(b: [number, number, number, number]): { cx: number; cy: number } {
  return { cx: b[0] + b[2] / 2, cy: b[1] + b[3] / 2 };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function padBBox(b: [number, number, number, number], pad: number, img: { w: number; h: number }): [number, number, number, number] {
  const x = Math.max(0, b[0] - pad);
  const y = Math.max(0, b[1] - pad);
  const w = Math.max(0, Math.min(img.w - x, b[2] + 2 * pad));
  const h = Math.max(0, Math.min(img.h - y, b[3] + 2 * pad));
  return [x, y, w, h];
}

function area(b: [number, number, number, number]): number {
  return Math.max(0, b[2]) * Math.max(0, b[3]);
}

function within(val: number, min: number, max: number): boolean {
  return val >= min && val <= max;
}

function bboxContains(container: [number, number, number, number], inner: [number, number, number, number]): boolean {
  const [x, y, w, h] = container;
  const [ix, iy, iw, ih] = inner;
  return ix >= x && iy >= y && ix + iw <= x + w && iy + ih <= y + h;
}

function maybeNearestText(texts: OCRText[], candidate: [number, number, number, number], maxDist: number): OCRText | null {
  let best: { t: OCRText; d: number } | null = null;
  const { cx, cy } = bboxCenter(candidate);
  for (const t of texts) {
    const tc = bboxCenter(t.bbox);
    const d = distance({ x: cx, y: cy }, { x: tc.cx, y: tc.cy });
    if (d <= maxDist && (!best || d < best.d)) best = { t, d };
  }
  return best?.t || null;
}

function looksNumericStat(text: string): boolean {
  const raw = text || "";
  if (/%/.test(raw)) return true;
  if (/\b\d+\s*:\s*\d+\b/.test(raw)) return true; // score like 16:12
  if (/\b\d{1,2}:\d{2}\b/.test(raw)) return true; // time like 12:34
  if (/\b\d{1,3}(,\d{3})*\b/.test(raw) && /\d/.test(raw)) return true; // numeric count
  if (/^x\d+$/i.test(raw.trim())) return true; // x1, x2
  return false;
}

function looksCurrencyOrPlainNumber(text: string): boolean {
  const raw = (text || "").trim();
  return /^\$?\d+(?:\.\d+)?$/.test(raw);
}

function scoreButtonCandidate(
  candidate: RawButton | { id: string; bbox: [number, number, number, number]; cornerRadius?: number; hasCenterText?: boolean; textId?: string | null },
  texts: OCRText[],
  contrast: Contrast[] | undefined,
  image: { w: number; h: number }
): ScoredBox & { __rawScore: number } {
  const [x, y, w, h] = candidate.bbox;
  const aspect = w > 0 && h > 0 ? w / h : 0;
  const imgArea = image.w * image.h;

  let score = 0.1; // Base

  // Size prior (tightened geometry)
  if (
    within(w, PARAMS.btnGeom.width[0], PARAMS.btnGeom.width[1]) &&
    within(h, PARAMS.btnGeom.height[0], PARAMS.btnGeom.height[1])
  )
    score += 0.1;
  else score -= 0.1;

  // Aspect prior
  if (aspect >= PARAMS.btnGeom.aspect[0] && aspect <= PARAMS.btnGeom.aspect[1]) score += 0.08;
  else score -= 0.05;

  // Corner radius
  const r = (candidate as RawButton).cornerRadius ?? 0;
  if (r >= 8) score += 0.05;
  // r = 0 -> neutral

  // Center-text alignment
  const candCenter = bboxCenter(candidate.bbox);
  let centerAligned = (candidate as RawButton).hasCenterText === true;
  let usedText: OCRText | null = null;
  if (!centerAligned) {
    if ((candidate as RawButton).textId) {
      usedText = texts.find((t) => t.id === (candidate as RawButton).textId) || null;
    } else {
      usedText = maybeNearestText(texts, candidate.bbox, PARAMS.nearTextPx);
    }
    if (usedText) {
      const textCenter = bboxCenter(usedText.bbox);
      const tolX = PARAMS.centerTol * w;
      const tolY = PARAMS.centerTol * h;
      if (Math.abs(textCenter.cx - candCenter.cx) <= tolX && Math.abs(textCenter.cy - candCenter.cy) <= tolY) {
        centerAligned = true;
      }
    }
  }
  if (centerAligned) score += 0.15;

  // Text affordance + contrast
  const textForScoring = usedText || (candidate as RawButton).textId ? texts.find((t) => t.id === (candidate as RawButton).textId) || null : null;
  // If we have text, require center alignment; also reject currency-only or numeric-only strings
  if (textForScoring && !centerAligned) {
    return {
      id: candidate.id,
      kind: "button",
      bbox: candidate.bbox,
      score: 0,
      label: null,
      textId: null,
      __rawScore: 0,
    } as any;
  }
  if (textForScoring) {
    const afford = textAffordanceScore(textForScoring.text);
    if (afford <= 0 || looksNumericStat(textForScoring.text) || looksCurrencyOrPlainNumber(textForScoring.text)) {
      return {
        id: candidate.id,
        kind: "button",
        bbox: candidate.bbox,
        score: 0,
        label: null,
        textId: null,
        __rawScore: 0,
      } as any;
    }
    // If corners are sharp and affordance weak, drop
    if (r < 6 && afford < 0.2) {
      return {
        id: candidate.id,
        kind: "button",
        bbox: candidate.bbox,
        score: 0,
        label: null,
        textId: null,
        __rawScore: 0,
      } as any;
    }
    score += afford;
    score += contrastScore(contrast, textForScoring.id);
  }

  // Edge density prior via area threshold (approximation)
  if (area(candidate.bbox) < 300) score -= 0.1;

  // Note: ignore bands are enforced earlier in candidate filtering

  // Clamp
  score = clamp01(score);

  const label = textForScoring ? formatLabel(textForScoring.text) : null;
  const out: ScoredBox & { __rawScore: number } = {
    id: candidate.id,
    kind: "button",
    bbox: candidate.bbox,
    score,
    label,
    textId: textForScoring?.id || (candidate as RawButton).textId || null,
    __rawScore: score,
  };
  return out;
}

function isTextButtonish(txt: string): boolean {
  const t = (txt || "").trim();
  if (!t) return false;
  const words = t.split(/\s+/);
  if (words.length > PARAMS.btn.maxWords) return false;
  if (t.length > PARAMS.btn.maxChars) return false;
  if (PARAMS.btn.forbidPunct.test(t)) return false;
  const token = t.toLowerCase();
  const ok = [
    "ok","save","send","join","buy","play","next","prev","close","open","add",
    "create","edit","apply","upload","delete","remove","share","install","get",
    "start","try","view","watch","learn","repair","deposit","withdraw","search",
    "cancel","confirm","continue","agree","accept","decline"
  ].some(
    (v) => token === v || token.startsWith(v + " ") || token.endsWith(" " + v)
  );
  return ok;
}

function passesButtonGeometry(b: [number, number, number, number], img: { w: number; h: number }): boolean {
  const w = b[2];
  const h = b[3];
  const ar = w / Math.max(1, h);
  const areaPct = (w * h) / Math.max(1, img.w * img.h);
  return (
    h >= PARAMS.btnGeom.height[0] && h <= PARAMS.btnGeom.height[1] &&
    w >= PARAMS.btnGeom.width[0] && w <= PARAMS.btnGeom.width[1] &&
    ar >= PARAMS.btnGeom.aspect[0] && ar <= PARAMS.btnGeom.aspect[1] &&
    areaPct <= PARAMS.btnGeom.maxAreaPct
  );
}

function buildTextDrivenButtonCandidates(texts: OCRText[], image: { w: number; h: number }): Array<{ id: string; bbox: [number, number, number, number]; textId: string | null }> {
  const out: Array<{ id: string; bbox: [number, number, number, number]; textId: string | null }> = [];
  if (!PARAMS.allowTextAsButton) {
    return out;
  }
  for (const t of texts) {
    if (t.approxSizePx < 5 || t.approxSizePx > 24) continue;
    if (!isTextButtonish(t.text)) continue;
    const padded = padBBox(t.bbox, PARAMS.textPad, image);
    if (!passesButtonGeometry(padded, image)) continue;
    out.push({ id: `tbtn_${t.id}`, bbox: padded, textId: t.id });
  }
  return out;
}

function clusterTextsByProximity(texts: OCRText[], image: { w: number; h: number }): Array<[number, number, number, number]> {
  // Simple left-edge and vertical proximity clustering for section candidates
  const sorted = [...texts].sort((a, b) => a.bbox[1] - b.bbox[1]);
  const clusters: OCRText[][] = [];
  const sizeThreshold = percentile(texts.map((t) => t.approxSizePx), 0.6); // top 40% seeds (>= 60th percentile)

  for (const seed of sorted) {
    if (seed.approxSizePx < sizeThreshold) continue;
    // Grow cluster by including texts within 24–40px vertically and left edges within ±30px
    const cluster: OCRText[] = [seed];
    let added = true;
    while (added) {
      added = false;
      for (const t of texts) {
        if (cluster.includes(t)) continue;
        const leftDelta = Math.abs(t.bbox[0] - seed.bbox[0]);
        const verticalDelta = Math.abs(t.bbox[1] - (cluster[cluster.length - 1].bbox[1] + cluster[cluster.length - 1].bbox[3]));
        if (leftDelta <= 30 && verticalDelta <= 40) {
          cluster.push(t);
          added = true;
        }
      }
    }
    if (cluster.length >= 2) clusters.push(cluster);
  }

  // Convert to padded bounding boxes
  const boxes: Array<[number, number, number, number]> = clusters.map((cl) => {
    const xs = cl.map((t) => t.bbox[0]);
    const ys = cl.map((t) => t.bbox[1]);
    const x2s = cl.map((t) => t.bbox[0] + t.bbox[2]);
    const y2s = cl.map((t) => t.bbox[1] + t.bbox[3]);
    const x = Math.max(0, Math.min(...xs) - 12);
    const y = Math.max(0, Math.min(...ys) - 12);
    const w = Math.min(image.w - x, Math.max(...x2s) - Math.min(...xs) + 24);
    const h = Math.min(image.h - y, Math.max(...y2s) - Math.min(...ys) + 24);
    return [x, y, w, h] as [number, number, number, number];
  });
  return boxes;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[idx];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function scoreSectionCandidate(
  id: string,
  bbox: [number, number, number, number],
  texts: OCRText[],
  acceptedButtons: ScoredBox[],
  image: { w: number; h: number }
): ScoredBox | null {
  const imgArea = image.w * image.h;
  const a = area(bbox);
  let score = 0.1; // Base

  // Coverage prior and hard bounds: 5%..55%
  const coverage = a / imgArea;
  if (coverage < PARAMS.sectionAreaPct[0] || coverage > PARAMS.sectionAreaPct[1]) {
    return null; // reject
  }
  score += 0.15;

  // Title presence: top-row text of size ≥ 1.2× local median
  const containedTexts = texts.filter((t) => overlaps(t.bbox as any, bbox as any));
  if (containedTexts.length === 0) return null;
  const sizes = containedTexts.map((t) => t.approxSizePx);
  const med = median(sizes);
  const topRow = containedTexts.filter((t) => t.bbox[1] <= bbox[1] + Math.max(24, 0.1 * bbox[3]));
  const likelyTitle = topRow.sort((a, b) => b.approxSizePx - a.approxSizePx)[0];
  const hasTitle = likelyTitle && likelyTitle.approxSizePx >= 1.2 * med && (likelyTitle.text || "").length <= SECTION_RULES.titleMaxChars;
  if (SECTION_RULES.needTitle && !hasTitle) return null;
  if (hasTitle) score += 0.1;

  // Favor card-like sizes with some content
  if (coverage >= 0.06 && coverage <= 0.2) score += 0.2;
  if (containedTexts.length >= 3 && containedTexts.length <= 8) score += 0.15;

  // Internal grid: ≥6 texts arranged in ≥2 rows (y-band clusters)
  if (containedTexts.length >= SECTION_RULES.minTextsInside) {
    const rowBands = clusterByYBands(containedTexts, 28);
    if (rowBands >= 2) score += 0.1;
  }
  if (containedTexts.length < SECTION_RULES.minTextsInside) {
    // still acceptable if moderate card size
    if (!(coverage >= 0.06 && coverage <= 0.2 && containedTexts.length >= 3 && hasTitle)) return null;
  }

  // Button adjacency: contains at least one accepted button
  if (acceptedButtons.some((b) => iou(b.bbox as any, bbox as any) > 0 && bboxContains(bbox, b.bbox))) score += 0.08;

  // Edge alignment: left edge aligns within ±10px to ≥3 inner texts
  const aligned = containedTexts.filter((t) => Math.abs(t.bbox[0] - bbox[0]) <= 10).length;
  if (aligned >= 3) score += 0.06;

  // Penalize near full-screen
  if (coverage > 0.7) score -= PARAMS.sectionFullscreenPenalty;

  score = clamp01(score);
  return { id, kind: "section", bbox, score };
}

function clusterByYBands(texts: OCRText[], bandHeight: number): number {
  const bands: number[] = [];
  for (const t of texts) {
    const y = t.bbox[1];
    const band = Math.floor(y / Math.max(1, bandHeight));
    if (!bands.includes(band)) bands.push(band);
  }
  return bands.length;
}

// --- Loose candidate generation helpers ---
function clampBox(b: BBox, img: { w: number; h: number }): BBox {
  let [x, y, w, h] = b;
  x = Math.max(0, Math.min(x, img.w));
  y = Math.max(0, Math.min(y, img.h));
  w = Math.max(0, Math.min(w, img.w - x));
  h = Math.max(0, Math.min(h, img.h - y));
  return [x, y, w, h];
}
function buildLooseButtonCandidates(texts: OCRText[], rawButtons: RawButton[], image: { w: number; h: number }): BBox[] {
  const cands: BBox[] = [];
  for (const t of texts) {
    const [x, y, w, h] = t.bbox;
    const pad = 8;
    const bb = clampBox([x - pad, y - pad, w + 2 * pad, h + 2 * pad], image);
    if (bb[2] >= 24 && bb[3] >= 18) cands.push(bb);
  }
  for (const b of rawButtons) {
    const bb = clampBox(b.bbox as any, image);
    if (bb[2] >= 24 && bb[3] >= 18) cands.push(bb);
  }
  // NMS IoU 0.3
  const scored = cands.map((b, i) => ({ id: `cbtn_${i}`, kind: "button" as const, bbox: b, score: 0.5 }));
  return nms(scored, 0.3).map((s) => s.bbox);
}
function buildLooseSectionCandidates(texts: OCRText[], blocks: any[], image: { w: number; h: number }): BBox[] {
  const boxes: BBox[] = [];
  for (const b of blocks || []) {
    const bb = clampBox((b?.bbox as any) ?? [0,0,0,0], image);
    const areaPct = (bb[2] * bb[3]) / Math.max(1, image.w * image.h);
    if (areaPct >= 0.03 && areaPct <= 0.75) boxes.push(bb);
  }
  // crude text clustering reuse
  const clustered = clusterTextsForSections(texts, image);
  for (const bb of clustered) {
    const clamped = clampBox(bb, image);
    const areaPct = (clamped[2] * clamped[3]) / Math.max(1, image.w * image.h);
    if (areaPct >= 0.03 && areaPct <= 0.75) boxes.push(clamped);
  }
  const scored = boxes.map((b, i) => ({ id: `csec_${i}`, kind: "section" as const, bbox: b, score: 0.5 }));
  return nms(scored, 0.3).map((s) => s.bbox);
}
function clusterTextsForSections(texts: OCRText[], image: { w: number; h: number }): BBox[] {
  const sorted = [...texts].sort((a, b) => a.bbox[1] - b.bbox[1]);
  const clusters: OCRText[][] = [];
  for (const t of sorted) {
    let best: { idx: number; score: number } | null = null;
    for (let i = 0; i < clusters.length; i++) {
      const last = clusters[i][clusters[i].length - 1];
      const dy = Math.abs(t.bbox[1] - (last.bbox[1] + last.bbox[3]));
      const dx = Math.abs(t.bbox[0] - last.bbox[0]);
      const score = (dy <= 48 ? 1 : 0) + (dx <= 48 ? 1 : 0);
      if (score > 0 && (!best || score > best.score)) best = { idx: i, score };
    }
    if (best) clusters[best.idx].push(t); else clusters.push([t]);
  }
  const boxes: BBox[] = [];
  for (const cl of clusters) {
    if (cl.length < 3) continue;
    const xs = cl.map((t) => t.bbox[0]);
    const ys = cl.map((t) => t.bbox[1]);
    const x2s = cl.map((t) => t.bbox[0] + t.bbox[2]);
    const y2s = cl.map((t) => t.bbox[1] + t.bbox[3]);
    const x = Math.max(0, Math.min(...xs) - 12);
    const y = Math.max(0, Math.min(...ys) - 12);
    const w = Math.min(image.w - x, Math.max(...x2s) - Math.min(...xs) + 24);
    const h = Math.min(image.h - y, Math.max(...y2s) - Math.min(...ys) + 24);
    boxes.push([x, y, w, h]);
  }
  return boxes;
}
function innerTextsCount(bbox: BBox, texts: OCRText[]): number {
  const [x, y, w, h] = bbox;
  const cx1 = x, cy1 = y, cx2 = x + w, cy2 = y + h;
  let count = 0;
  for (const t of texts) {
    const tc = bboxCenter(t.bbox);
    if (tc.cx >= cx1 && tc.cx <= cx2 && tc.cy >= cy1 && tc.cy <= cy2) count++;
  }
  return count;
}

export function postprocess(perception: Perception): PostprocessOutput {
  const image = perception?.image || { w: 0, h: 0 };
  const texts = Array.isArray(perception?.texts) ? perception.texts : [];
  const rawButtons = Array.isArray(perception?.buttons) ? perception.buttons : [];
  const blocks = Array.isArray(perception?.blocks) ? perception.blocks : [];
  const contrast = Array.isArray(perception?.contrast) ? perception.contrast : [];

  const debugRejected: ScoredBox[] = [];

  const IGNORE = makeIgnoreBands(image.w, image.h);

  // Build candidates: raw + OCR-driven
  const textDriven = buildTextDrivenButtonCandidates(texts, image);
  const mergedCandidates: Array<RawButton | { id: string; bbox: [number, number, number, number]; textId: string | null; cornerRadius?: number; hasCenterText?: boolean }> = [
    ...rawButtons,
    ...textDriven,
  ];

  const scoredButtonsAll = mergedCandidates
    .filter((c) => !overlapsIgnored(c.bbox as any, IGNORE, iou))
    .filter((c) => {
      const rc = c as RawButton;
      const hasCenterText = (rc as any).hasCenterText === true;
      const hasTextId = Boolean((rc as any).textId);
      return hasCenterText || hasTextId;
    })
    .filter((c) => {
      const [x, y, w, h] = c.bbox as BBox;
      const areaPct = (w * h) / Math.max(1, image.w * image.h);
      const aspect = w / Math.max(1, h);
      const g = PARAMS.btnGeom;
      if (h < g.height[0] || h > g.height[1]) return false;
      if (w < g.width[0] || w > g.width[1]) return false;
      if (aspect < g.aspect[0] || aspect > g.aspect[1]) return false;
      if (areaPct > g.maxAreaPct) return false;
      const inside = innerTextsCount(c.bbox as BBox, texts);
      if (inside > 2) return false;
      const stats = computeImageStats(image as any, c.bbox as any);
      if (!isButtonShaped(stats)) return false;
      return true;
    })
    .map((c) => scoreButtonCandidate(c as any, texts, contrast, image));

  // Filter + NMS (strict list only)
  const passButtons = scoredButtonsAll.filter((b) => b.score >= PARAMS.buttonMinScore);
  const keptButtons = nms(passButtons, PARAMS.buttonNmsIoU);

  // Section candidates: raw blocks + grouped texts
  const sectionBoxesFromBlocks = blocks
    .filter((b) => b.kind === "section")
    .map((b) => b.bbox as [number, number, number, number])
    .filter((bbox) => !overlapsIgnored(bbox as any, IGNORE, iou));
  const sectionBoxesFromGrouping = clusterTextsByProximity(texts, image);
  const sectionCandidates = [
    ...sectionBoxesFromBlocks.map((bbox, idx) => ({ id: `blk_${idx}`, bbox })),
    ...sectionBoxesFromGrouping
      .filter((bbox) => !overlapsIgnored(bbox as any, IGNORE, iou))
      .map((bbox, idx) => ({ id: `grp_${idx}`, bbox })),
  ];

  const scoredSectionsAll = sectionCandidates
    .map((c) => scoreSectionCandidate(c.id, c.bbox, texts, keptButtons, image))
    .filter((s): s is ScoredBox => Boolean(s));
  const passSections = scoredSectionsAll.filter((s) => s.score >= PARAMS.sectionMinScore);
  const keptSections = nms(passSections, PARAMS.sectionNmsIoU);

  // Debug rejected (top 10 by score just under thresholds)
  const rejected = [
    ...scoredButtonsAll.filter((b) => !keptButtons.find((k) => k.id === b.id)).map((b) => ({ ...b })),
    ...scoredSectionsAll.filter((s) => !keptSections.find((k) => k.id === s.id)).map((s) => ({ ...s })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const finalButtons = keptButtons.filter((b) => b.score >= PARAMS.buttonMinScore);
  const finalSections = keptSections.filter((s) => s.score >= PARAMS.sectionMinScore);

  // --- Loose candidates (always provided) ---
  const candButtons = buildLooseButtonCandidates(texts, rawButtons, image);
  const candSections = buildLooseSectionCandidates(texts, blocks, image);

  return {
    texts,
    buttons: finalButtons.length ? finalButtons : [],
    sections: finalSections.length ? finalSections : [],
    candidates: { buttons: candButtons, sections: candSections },
    _debug: { rejected, params: PARAMS as any },
  };
}

export default postprocess;


