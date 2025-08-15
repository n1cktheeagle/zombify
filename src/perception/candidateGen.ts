import type { Perception, BBox, TextSpan } from "./types";
import { iou } from "../utils/geometry";

export function generateCandidates(perception: Perception): {
  textSpans: TextSpan[];
  buttonBoxes: BBox[];
  sectionBoxes: BBox[];
} {
  const imgW = perception?.image?.w || 0;
  const imgH = perception?.image?.h || 0;
  const texts = Array.isArray(perception?.texts) ? perception.texts : [];
  const blocks = Array.isArray(perception?.blocks) ? perception.blocks : [];
  const rawButtons = Array.isArray(perception?.buttons) ? perception.buttons : [];

  const buttonBoxes: BBox[] = [];
  const sectionBoxes: BBox[] = [];

  // From OCR texts: pad a bit
  for (const t of texts) {
    const [x, y, w, h] = t.bbox;
    if (w < 12 || h < 12) continue;
    const pad = 10;
    const bx: BBox = [
      Math.max(0, x - pad),
      Math.max(0, y - pad),
      Math.min(imgW - Math.max(0, x - pad), w + pad * 2),
      Math.min(imgH - Math.max(0, y - pad), h + pad * 2),
    ];
    if (keepButtonLoose(bx, imgW, imgH)) buttonBoxes.push(bx);
  }

  // From raw buttons/blocks if present
  for (const b of rawButtons) {
    const bb = Array.isArray(b?.bbox) ? (b.bbox as BBox) : (b as any as BBox);
    if (Array.isArray(bb) && keepButtonLoose(bb, imgW, imgH)) buttonBoxes.push(bb);
  }

  for (const b of blocks) {
    const bb = Array.isArray(b?.bbox) ? (b.bbox as BBox) : (b as any as BBox);
    if (Array.isArray(bb) && keepSectionLoose(bb, imgW, imgH)) sectionBoxes.push(bb);
  }

  // From clustered texts → section-like boxes (very loose)
  const clustered = clusterTexts(texts, imgW, imgH);
  for (const bb of clustered) {
    if (keepSectionLoose(bb, imgW, imgH)) sectionBoxes.push(bb);
  }

  const dedupButtons = dedupe(buttonBoxes, 0.9);
  const dedupSections = dedupe(sectionBoxes, 0.9);

  return { textSpans: texts as TextSpan[], buttonBoxes: dedupButtons, sectionBoxes: dedupSections };
}

function keepButtonLoose(b: BBox, imgW: number, imgH: number): boolean {
  const [x, y, w, h] = b;
  if (w < 12 || h < 12) return false;
  const ar = w / Math.max(1, h);
  const areaPct = (w * h) / Math.max(1, imgW * imgH);
  return ar >= 0.6 && ar <= 8.0 && areaPct >= 0.001 && areaPct <= 0.12 && h >= 18 && h <= 160;
}

function keepSectionLoose(b: BBox, imgW: number, imgH: number): boolean {
  const [x, y, w, h] = b;
  if (w < 12 || h < 12) return false;
  const areaPct = (w * h) / Math.max(1, imgW * imgH);
  return areaPct >= 0.04 && areaPct <= 0.85;
}

function dedupe(boxes: BBox[], thr: number): BBox[] {
  const kept: BBox[] = [];
  for (const b of boxes) {
    let over = false;
    for (const k of kept) { if (iou(b, k) > thr) { over = true; break; } }
    if (!over) kept.push(b);
  }
  return kept;
}

function clusterTexts(texts: TextSpan[], imgW: number, imgH: number): BBox[] {
  if (!texts.length) return [];
  const sorted = [...texts].sort((a, b) => a.bbox[1] - b.bbox[1]);
  const clusters: TextSpan[][] = [];
  const dy = 40;
  const dx = 60;
  for (const t of sorted) {
    let placed = false;
    for (const cl of clusters) {
      const last = cl[cl.length - 1];
      const vGap = Math.abs(t.bbox[1] - (last.bbox[1] + last.bbox[3]));
      const lGap = Math.abs(t.bbox[0] - last.bbox[0]);
      if (vGap <= dy && lGap <= dx) { cl.push(t); placed = true; break; }
    }
    if (!placed) clusters.push([t]);
  }
  const boxes: BBox[] = [];
  for (const cl of clusters) {
    if (cl.length < 2) continue;
    const xs = cl.map((t) => t.bbox[0]);
    const ys = cl.map((t) => t.bbox[1]);
    const x2s = cl.map((t) => t.bbox[0] + t.bbox[2]);
    const y2s = cl.map((t) => t.bbox[1] + t.bbox[3]);
    const x = Math.max(0, Math.min(...xs) - 16);
    const y = Math.max(0, Math.min(...ys) - 16);
    const w = Math.min(imgW - x, Math.max(...x2s) - Math.min(...xs) + 32);
    const h = Math.min(imgH - y, Math.max(...y2s) - Math.min(...ys) + 32);
    boxes.push([x, y, w, h]);
  }
  return boxes;
}


