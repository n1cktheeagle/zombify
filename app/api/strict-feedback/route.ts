import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/* ---------- config ---------- */
const MODEL = process.env.OPENAI_STRICT_FEEDBACK_MODEL || "gpt-4o";
const TIMEOUT_MS = Number(process.env.STRICT_FEEDBACK_TIMEOUT_MS || 18000);

/* ---------- system prompt v3 ---------- */
const SYSTEM_PROMPT = `
You are Zombify. You analyze ONE STATIC UI IMAGE using ONLY the structured payload provided (detections, absences, perceptualFallback, meta). You do NOT see the raw image.

HARD RULES
- Reference ONLY items in detections or explicit absences.
- Every finding must be anchored to (A) a detection (with detectionId, bbox, confidence, reason), or (B) an absence string exactly as provided.
- If detections are empty, use ONLY perceptualFallback. Do not invent UI.
- No hover/animation/functionality claims. Short, concrete critiques + one clear action.

SAFETY-NET & ABSENCE HANDLING
- If a detection has source:"safety-net", treat it as valid but weigh lower reliability for risk. If confidence < 0.5, prefer phrasing like "appears to be a CTA".
- If meta.absenceUnreliable.CTA is true, soften CTA-absence language and reduce its risk one level.

RISK
- LOW, MEDIUM, HIGH based on impact on clarity/conversion/accessibility. Safety-net detections under 0.45 should rarely be HIGH unless contrast/readability is clearly poor from evidence.

CTA EVIDENCE (tighten)
- Only emit a CTA finding if the referenced button has confidence ≥ 0.40 and either a textId or clearly nearby text within 24px.
- Otherwise, do not create a CTA finding; instead emit an absence: "No high-confidence call-to-action detected above the fold." Respect meta.absenceUnreliable.CTA when phrasing/risking.
- If at least one qualifying CTA exists, pick the largest above-the-fold one.

CTA CONTRAST NOTE
- If button.textContrast exists and is < 4.5 (or < 3.0 if text is ≥ 18 px), explicitly call out insufficient contrast in the critique with the numeric ratio, e.g., "Button text contrast 2.1:1 below WCAG 4.5:1."

FINDINGS CLAMP
- Allowed topics: CTA, Grid, Layout, Text. Do not output "Buttons" as a topic.
- Only produce a CTA finding if evidence.confidence >= 0.40 and (textId exists or a text is within 24px vertically). Otherwise, emit a CTA absence with evidence.absence and message: "No high-confidence call-to-action detected above the fold." Respect meta.absenceUnreliable.CTA by downgrading risk.

GRID RULE
- Only include a "Grid" finding if detections.grids is non-empty. Otherwise do not mention Grid.

SAFETY-NET TEXT-ANCHORED CTA
- You may treat source: "safety-net:text-anchored" buttons as valid CTAs if scoredConfidence ≥ 0.40 and aboveFold === true.

OUTPUT
- Return ONLY valid JSON matching the schema the user provides. No markdown.
`.trim();

/* ---------- return schema (sent to model for compliance) ---------- */
const SCHEMA = `{
  "summary":"string",
  "findings":[{"topic":"CTA | Hierarchy | Readability | Navigation | Grid | Blocks | Buttons | Trust | Clarity",
  "evidence":{"detectionId":"string","bbox":{"x":0,"y":0,"w":0,"h":0},"confidence":0,"reason":"string"},
  "critique":"string","action":"string","risk":"LOW | MEDIUM | HIGH"}],
  "perceptualFallback":{"contrastScore":0,"textDensity":0,"spacingTightness":0,"alignmentConsistency":0,"notes":["string"]},
  "meta":{"detectionsUsed":0,"hadAbsences":false,"model":"string"}
}`;

/* ---------- tiny schema guard (lightweight) ---------- */
function isBBox(b: any) {
  return b && Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.w) && Number.isFinite(b.h);
}
function validateFeedback(obj: any) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.summary !== "string") return false;
  if (!Array.isArray(obj.findings)) return false;
  for (const f of obj.findings) {
    if (!f || typeof f !== "object") return false;
    if (["CTA","Hierarchy","Readability","Navigation","Grid","Blocks","Buttons","Trust","Clarity","Layout","Text"].includes(f.topic) === false) return false;
    if (!f.evidence || typeof f.evidence !== "object") return false;
    const ev = f.evidence;
    const okEv = (typeof ev.absence === "string") || (typeof ev.detectionId === "string" && isBBox(ev.bbox) && Number.isFinite(ev.confidence) && typeof ev.reason === "string");
    if (!okEv) return false;
    if (typeof f.critique !== "string" || typeof f.action !== "string") return false;
    if (["LOW","MEDIUM","HIGH"].includes(f.risk) === false) return false;
  }
  if (!obj.meta || typeof obj.meta !== "object") return false;
  return true;
}

/* ---------- IoU + dedupe ---------- */
function iou(a: any, b: any) {
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const uni = a.w * a.h + b.w * b.w + b.h * b.h - inter;
  // correction: union calculation typo fixed below:
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}
function dedupeButtons(buttons: any[], thr = 0.4) {
  const sorted = [...buttons].sort((a, b) => ((b.scoredConfidence ?? b.confidence ?? 0) - (a.scoredConfidence ?? a.confidence ?? 0)));
  const out: any[] = [];
  while (sorted.length) {
    const cur = sorted.shift()!;
    out.push(cur);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (iou(cur.bbox, sorted[i].bbox) > thr) sorted.splice(i, 1);
    }
  }
  return out;
}

function overlapFilter(buttons: any[], thr = 0.5) {
  const kept: any[] = [];
  for (const b of [...buttons].sort((a,b)=> (b.scoredConfidence - a.scoredConfidence))) {
    let overlap = false;
    for (const k of kept) {
      if (iou(b.bbox, k.bbox) > thr) { overlap = true; break; }
    }
    if (!overlap) kept.push(b);
  }
  return kept;
}

function dedupeInside(buttons: any[], thr = 0.85) {
  const result: any[] = [];
  const sorted = [...buttons].sort((a,b)=> (b.bbox.w*b.bbox.h) - (a.bbox.w*a.bbox.h));
  for (let i=0;i<sorted.length;i++) {
    const cand = sorted[i];
    let inside = false;
    for (const kept of result) {
      if (iou(cand.bbox, kept.bbox) >= thr) { inside = true; break; }
    }
    if (!inside) result.push(cand);
  }
  return result;
}

/* ---------- CTA scoring + linking helpers (no fold policy) ---------- */
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }
const PROX_PX = 64;
const SAME_ROW_DY = 28;
const MIN_IOU = 0.08;
const CTA_REGEX = /(UPLOAD DEMO|UPLOAD|AUTO ?PLAY|PLAY|START|SPIN|GET PRO|GO PRO|BUY NOW|INSTALL|SAVE CHANGES|CONFIRM|CONTINUE|YES|OK|SUBMIT|DOWNLOAD|CASH ?OUT|SHARE|ADD LABELS|DELETE(?!d)|REMOVE)/i;
const VERB_FIRST = /^(upload|play|start|get|install|save|confirm|continue|submit|download|buy|remove|delete|share|add|yes|ok)\b/i;
const NAME_CHIP = /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)?$/;

function xOverlapRatio(a: any, b: any) {
  const x1 = Math.max(a.x, b.x);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const inter = Math.max(0, x2 - x1);
  const minW = Math.min(a.w, b.w) || 1;
  return inter / minW;
}
function linkRule(textBox: any, btnBox: any) {
  // primary: proximity and same-row checks
  const tcx = textBox.x + textBox.w / 2, tcy = textBox.y + textBox.h / 2;
  const bcx = btnBox.x + btnBox.w / 2, bcy = btnBox.y + btnBox.h / 2;
  const dx = Math.abs(tcx - bcx);
  const dy = Math.abs(tcy - bcy);
  const iouVal = iou(textBox, btnBox);
  const xOverlap = xOverlapRatio(textBox, btnBox);
  const ruleA = (dx <= PROX_PX) || (dy <= PROX_PX) || (dy <= SAME_ROW_DY) || (iouVal >= MIN_IOU);
  const ruleB = (xOverlap >= 0.30 && dy <= 42);
  const linked = ruleA || ruleB;
  return { linked, rule: ruleA ? 'prox/row/iou' : (ruleB ? 'x-overlap' : 'none'), dy, dx, xOverlap, iouVal };
}

function median(values: number[]): number {
  if (!values.length) return 1;
  const v = [...values].sort((a,b)=>a-b);
  const mid = Math.floor(v.length/2);
  return v.length % 2 ? v[mid] : (v[mid-1] + v[mid]) / 2;
}

function scoreCTA(btn: any, img: { w?: number; h?: number }, opts: { medianArea: number; lexHit: boolean; pseudoConf?: number; verbFirst?: boolean }) {
  const reasons: string[] = [];
  const w = Math.max(1, img?.w ?? 1440);
  const h = Math.max(1, img?.h ?? 900);
  const bbox = btn?.bbox || { x: 0, y: 0, w: 0, h: 0 };
  const area = Math.max(1, bbox.w * bbox.h);
  const areaRatio = Math.max(0, Math.min(5, area / Math.max(1, opts.medianArea || 1)));
  const sizePrior = sigmoid(areaRatio); // grows as it gets larger than median
  if (sizePrior > 0.5) reasons.push('size');
  const text = (btn?.label || '').toString();
  const lexiconHit = !!opts.lexHit;
  if (lexiconHit) reasons.push('lexicon');
  const contrast = typeof btn?.textContrast === 'number' ? btn.textContrast : 0;
  const contrastNorm = clamp01(contrast / 7);
  if (contrast >= 4.5) reasons.push('contrast');
  const detectorConf = Number.isFinite(btn?.confidence) ? btn.confidence : (Number.isFinite(opts.pseudoConf) ? opts.pseudoConf! : 0.35);
  if ((btn?.source || '').startsWith('safety-net')) reasons.push('synth');
  // favor mid-to-lower band
  const cy = bbox.y + bbox.h / 2;
  const inBand = cy >= 0.35 * h && cy <= 0.90 * h;
  const positionPrior = inBand ? 1 : 0;
  let scored = 0.35 * detectorConf + 0.30 * (lexiconHit ? 1 : 0) + 0.15 * contrastNorm + 0.12 * sizePrior + 0.08 * positionPrior;
  if (VERB_FIRST.test(text)) { scored += 0.03; reasons.push('verb-first'); }
  // chip guard
  if (!lexiconHit && NAME_CHIP.test(text)) { scored -= 0.10; reasons.push('name-chip'); }
  scored = clamp01(scored);
  return { scoredConfidence: scored, reasons };
}

/* ---------- enrich findings with detection details ---------- */
function indexDetections(det: any) {
  const map = new Map<string, any>();
  const add = (arr: any[] = []) => arr.forEach((d: any) => d?.id && map.set(d.id, d));
  add(det?.texts);
  add(det?.buttons);
  add(det?.blocks);
  add(det?.grids);
  return map;
}

function enrichFindingsFromDetections(out: any, detIndex: Map<string, any>) {
  if (!out || !Array.isArray(out.findings)) return out;
  out.findings = out.findings.map((f: any) => {
    const ev = f?.evidence || {};
    if (typeof ev.detectionId === "string") {
      const src = detIndex.get(ev.detectionId);
      if (src) {
        ev.bbox = ev.bbox ?? src.bbox;
        // prefer scoredConfidence when available
        const scored = typeof src?.scoredConfidence === 'number' ? src.scoredConfidence : undefined;
        const baseConf = typeof src?.confidence === 'number' ? src.confidence : undefined;
        if (typeof ev.confidence !== 'number') {
          ev.confidence = (scored ?? baseConf ?? 0.4);
        } else if (typeof scored === 'number' && scored > ev.confidence) {
          ev.confidence = scored;
        }
        ev.reason = ev.reason ?? (src.reason ?? "detected element");
      }
      f.evidence = ev;
    }
    return f;
  });
  return out;
}

/* ---------- payload builder ---------- */
function toBBox(b: any) {
  if (!b) return { x: 0, y: 0, w: 0, h: 0 };
  if (Array.isArray(b)) return { x: b[0], y: b[1], w: b[2], h: b[3] };
  if (typeof b === 'object' && Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.w) && Number.isFinite(b.h)) return b;
  return { x: 0, y: 0, w: 0, h: 0 };
}
function mapBBoxes(items: any[] = []) {
  return (items || []).map((item: any) => ({
    ...item,
    bbox: Array.isArray(item?.bbox)
      ? { x: item.bbox[0], y: item.bbox[1], w: item.bbox[2], h: item.bbox[3] }
      : toBBox(item?.bbox)
  }));
}

function inferReason(b: any) {
  const bits: string[] = [];
  if (b?.hasCenterText) bits.push("centered text");
  if (typeof b?.cornerRadius === "number") bits.push(`r=${b.cornerRadius}`);
  return `button candidate (${bits.join(", ") || "shape/ocr proximity"})`;
}

function indexContrast(list: any[] = []) {
  const byTextId = new Map<string, number>();
  for (const c of list) if (c?.textId && Number.isFinite(c.ratio)) byTextId.set(c.textId, c.ratio);
  return byTextId;
}

function nearestTextIdFor(bbox: { x: number; y: number; w: number; h: number }, texts: any[]) {
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  let best: string | null = null;
  let bestDy = Infinity;
  for (const t of texts || []) {
    const tb = t?.bbox; if (!tb) continue;
    const tyMid = tb.y + tb.h / 2;
    const dy = Math.abs(tyMid - cy);
    if (dy < bestDy && dy <= 24) { best = t.id; bestDy = dy; }
  }
  return best;
}

function mapButtons(list: any[] = [], texts: any[] = [], contrastIdx?: Map<string, number>) {
  return (list || []).map((b: any, i: number) => {
    const id = b?.id ?? `btn_${i}`;
    const bbox = toBBox(b?.bbox);
    const textId = b?.textId ?? nearestTextIdFor(bbox, texts);
    const textContrast = textId && contrastIdx ? contrastIdx.get(textId) : undefined;
    // post-map confidence defaults
    let confidence = typeof b?.confidence === "number" ? b.confidence : 0.36;
    if (b?.source === "safety-net") confidence = Math.max(confidence ?? 0.42, 0.42);
    const imageHeight = (typeof (globalThis as any).__imageH === 'number') ? (globalThis as any).__imageH : undefined;
    const foldY = imageHeight ? Math.min(520, Math.round(imageHeight * 0.55)) : undefined;
    const aboveFold = foldY != null ? (bbox.y + bbox.h / 2) <= foldY : undefined;
    return {
      id,
      type: "button",
      bbox,
      confidence,
      reason: b?.reason ?? inferReason(b),
      source: b?.source ?? "opencv",
      textId: textId ?? null,
      textContrast,
      aboveFold,
      label: b?.label,
      variant: b?.variant ?? "unknown"
    };
  });
}
function buildPayload(perception: any) {
  const img = perception?.image || perception?.imageMeta || {};
  const texts = mapBBoxes(perception?.texts ?? []).map((t) => ({ id: t.id ?? `t_${Math.random()}`, ...t }));
  const blocks = mapBBoxes(perception?.blocks ?? []).map((b) => ({ id: b.id ?? `bl_${Math.random()}`, ...b }));
  const contrastIdx = indexContrast(perception?.contrast || []);
  // expose image height for aboveFold calc in mapButtons
  (globalThis as any).__imageH = img?.h ?? undefined;
  const origButtons = mapButtons(perception?.buttons ?? [], texts, contrastIdx);
  // synthesize text-anchored CTA candidates
  const ctaRegex = /(UPLOAD DEMO|UPLOAD|AUTO ?PLAY|PLAY|START|SPIN|GET PRO|GO PRO|BUY NOW|INSTALL|SAVE CHANGES|CONFIRM|CONTINUE|YES|OK|SUBMIT|DOWNLOAD|CASH ?OUT|SHARE|ADD LABELS|DELETE(?!d)|REMOVE)/i;
  function isStrongVerb(label: string) {
    return /(\bJOIN\b|\bACCEPT\b|\bSAVE\b|\bCONTINUE\b|GET\s?PRO\b|SIGN\s?UP\b)/i.test(label);
  }
  function expandBBox(b: any, px: number) {
    const x = Math.max(0, (b.x ?? 0) - px);
    const y = Math.max(0, (b.y ?? 0) - px);
    const w = Math.min(Math.max(0, (b.w ?? 0) + px * 2), Math.max(0, (img.w ?? (b.x + b.w)) - x));
    const h = Math.min(Math.max(0, (b.h ?? 0) + px * 2), Math.max(0, (img.h ?? (b.y + b.h)) - y));
    return { x, y, w, h };
  }
  function center(b: any) { return { cx: (b.x ?? 0) + (b.w ?? 0) / 2, cy: (b.y ?? 0) + (b.h ?? 0) / 2 }; }
  function relaxedProximity(textBox: any, btnBox: any) {
    const ac = center(textBox), bc = center(btnBox);
    const distOK = (Math.abs(ac.cx - bc.cx) <= 40) || (Math.abs(ac.cy - bc.cy) <= 40);
    const sameRow = Math.abs(ac.cy - bc.cy) <= 18;
    const interX1 = Math.max(textBox.x, btnBox.x);
    const interY1 = Math.max(textBox.y, btnBox.y);
    const interX2 = Math.min(textBox.x + textBox.w, btnBox.x + btnBox.w);
    const interY2 = Math.min(textBox.y + textBox.h, btnBox.y + btnBox.h);
    const interA = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
    const unionA = textBox.w * textBox.h + btnBox.w * btnBox.h - interA;
    const i = unionA > 0 ? interA / unionA : 0;
    return distOK || (sameRow && i >= 0.1);
  }
  const foldY = img?.h ? Math.min(540, Math.round(img.h * 0.6)) : 540;
  const synthButtons = (texts || []).flatMap((t: any) => {
    const label: string = (t.content || t.label || '').toString();
    if (!label || !ctaRegex.test(label)) return [] as any[];
    const tb = toBBox(t.bbox);
    const tc = contrastIdx.get(t.id) ?? undefined;
    // find nearest horizontally overlapping button within +/-32px vertically; pick widest
    const ty = tb.y + tb.h / 2;
    const candidates = (origButtons || []).filter((b) => {
      const bb = b.bbox; if (!bb || bb.w <= 0 || bb.h <= 0) return false;
      const by = bb.y + bb.h / 2;
      const yOk = Math.abs(by - ty) <= 32;
      const xo = xOverlapRatio(tb, bb) >= 0.05; // any overlap
      return yOk && xo;
    });
    let unionSynth: any[] = [];
    if (candidates.length) {
      const widest = candidates.sort((a,b)=> (b.bbox.w - a.bbox.w))[0];
      const bb = widest.bbox;
      const x1 = Math.min(tb.x, bb.x), y1 = Math.min(tb.y, bb.y);
      const x2 = Math.max(tb.x + tb.w, bb.x + bb.w), y2 = Math.max(tb.y + tb.h, bb.y + bb.h);
      const merged = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      unionSynth = [{ id: `synth.union:${t.id}:${widest.id}`, type: 'button', bbox: merged, textId: t.id, source: 'safety-net:text+button', reason: 'union(text,button)', confidence: 0.60, label }];
    }
    const textOnly = [{ id: `synth.text:${t.id}`, type: 'button', bbox: expandBBox(tb, 16), textId: t.id, source: 'safety-net:text', reason: 'text-inflated', confidence: 0.55, label, textContrast: tc }];
    return [...unionSynth, ...textOnly];
  });
  const mergedButtons = [...origButtons, ...synthButtons];
  // compute scored confidence for all and dedupe
  // median area for size prior
  const areas = mergedButtons.map((b)=> Math.max(1,(b?.bbox?.w||0)*(b?.bbox?.h||0))).filter(Boolean);
  const medArea = median(areas.length ? areas : [1]);
  const scoredAll = mergedButtons.map((b) => {
    const text = (b?.label || '').toString();
    const lexHit = ctaRegex.test(text);
    const pseudo = (b?.source === 'safety-net:text+button') ? 0.60 : (b?.source === 'safety-net:text' ? 0.55 : undefined);
    const s = scoreCTA(b, img, { medianArea: medArea, lexHit, pseudoConf: pseudo, verbFirst: VERB_FIRST.test(text) });
    return { ...b, scoredConfidence: s.scoredConfidence, scoreReasons: s.reasons };
  });
  // Pre-filter before GPT payload (good-CTA-only)
  const totalAfterSynthesis = scoredAll.length;
  const filteredInput = scoredAll.map((b)=> ({ ...b }));
  const getTextById = (id: string) => (texts || []).find((t:any) => t.id === id);
  const centerYOf = (bb:any) => (bb?.y ?? 0) + (bb?.h ?? 0) / 2;
  const minEdgeDist = (a:any, b:any) => {
    const ax2 = a.x + a.w, ay2 = a.y + a.h;
    const bx2 = b.x + b.w, by2 = b.y + b.h;
    const dx = Math.max(0, Math.max(b.x - ax2, a.x - bx2));
    const dy = Math.max(0, Math.max(b.y - ay2, a.y - by2));
    return Math.min(dx, dy);
  };
  const withinLinkTolerance = (btn:any) => {
    if (!btn?.textId) return true; // no text link required
    const t = getTextById(btn.textId);
    if (!t?.bbox) return true;
    const tb = t.bbox, bb = btn.bbox;
    const dyCenter = Math.abs(centerYOf(tb) - centerYOf(bb));
    const edgeDist = minEdgeDist(tb, bb);
    return edgeDist <= 40 || dyCenter <= 18;
  };

  const kept: any[] = [];
  const discarded: any[] = [];
  for (const b of filteredInput) {
    const bb = b?.bbox || { x:0,y:0,w:0,h:0 };
    const wv = bb.w || 0, hv = bb.h || 0;
    const ar = hv > 0 ? (wv / hv) : 0;
    const detectorConf = typeof b?.confidence === 'number' ? b.confidence : 0;
    const isSafetyText = (b?.source === 'safety-net:text');
    // Rule checks
    const confOk = (detectorConf >= 0.40) || isSafetyText;
    const sizeOk = (wv >= 60 && hv >= 20);
    const arOk = (ar >= 0.5 && ar <= 4.0);
    const linkOk = withinLinkTolerance(b);
    const iconTooSmall = (!b?.textId && wv < 90 && hv < 35);
    const pass = confOk && sizeOk && arOk && linkOk && !iconTooSmall;
    if (pass) kept.push(b); else {
      discarded.push({ ...b, discardReason: {
        confOk, sizeOk, arOk, linkOk, iconTooSmall,
        note: !confOk ? 'low-conf' : !sizeOk ? 'small' : !arOk ? 'aspect' : !linkOk ? 'link-distance' : iconTooSmall ? 'icon-too-small' : 'other'
      }});
    }
  }
  // Overlap removal IoU > 0.5 keep higher score
  let used = overlapFilter(kept, 0.5);
  // Deduplicate inside ≥ 0.85
  used = dedupeInside(used, 0.85);
  // Mark ignored for overlay debugging
  const usedIds = new Set(used.map((b:any)=> b.id));
  const buttonsAllForOverlay = filteredInput.map((b:any)=> usedIds.has(b.id) ? b : { ...b, ignored: true });
  const buttons = dedupeButtons(used, 0.4);
  console.log('[strict-feedback:cta_candidates:filtered]', { before: totalAfterSynthesis, kept: buttons.length });
  const grids = mapBBoxes(perception?.grids ?? []);

  // Merge safety-net buttons (if attached by pipeline or client)
  const safety = (perception?.buttons || []).filter((b: any) => (b?.source || '').startsWith("safety-net"));
  const hasSafety = safety.length > 0;

  const detectionsUsed = texts.length + buttons.length + blocks.length + grids.length;

  const aboveFoldY = perception?.meta?.aboveFoldY ?? img.h ?? 760;
  const presence = {
    hasCTAButton: buttons.length > 0,
    hasAboveTheFoldCTA: buttons.some((b: any) => b?.bbox && (b.bbox.y + b.bbox.h <= 0.9 * aboveFoldY)),
    hasGrid: grids.length > 0,
    hasHeroBlock: blocks.some((b: any) => b?.roleGuess === "hero" || (b?.bbox?.h ?? 0) > 320)
  };

  const absences: string[] = [];
  if (!presence.hasCTAButton) absences.push("No call-to-action button detected.");
  if (!presence.hasAboveTheFoldCTA) absences.push("No call-to-action above the fold detected.");
  if (!presence.hasGrid) absences.push("No grid columns detected.");
  if (!presence.hasHeroBlock) absences.push("No hero/primary block detected near top.");

  const perceptualFallback = perception?.stats?.perceptualFallback ?? {
    contrastScore: perception?.stats?.contrastScore ?? 0.4,
    textDensity: perception?.stats?.textDensity ?? 6,
    spacingTightness: perception?.stats?.spacingTightness ?? 0.2,
    alignmentConsistency: perception?.stats?.alignmentConsistency ?? 0.5,
    notes: perception?.stats?.notes ?? []
  };

  const perceptualMetrics = {
    contrastScore: (perception?.stats?.contrastScore ?? perception?.stats?.perceptualFallback?.contrastScore ?? 0) as number,
    textDensity: (perception?.stats?.textDensity ?? perception?.stats?.perceptualFallback?.textDensity ?? 0) as number,
    spacingTightness: (perception?.stats?.spacingTightness ?? perception?.stats?.perceptualFallback?.spacingTightness ?? 0) as number,
    alignmentConsistency: (perception?.stats?.alignmentConsistency ?? perception?.stats?.perceptualFallback?.alignmentConsistency ?? 0) as number,
    notes: (perception?.stats?.notes ?? perception?.stats?.perceptualFallback?.notes ?? []) as any[],
    palette: perception?.palette ?? perception?.stats?.palette ?? []
  };

  return {
    payload: {
      imageMeta: { w: img.w ?? 0, h: img.h ?? 0, totalChars: perception?.meta?.totalChars ?? 0 },
      // send all buttons for overlay QA, but only high-quality set is used in CTA policy further down
      detections: { texts, buttons: buttonsAllForOverlay, blocks, grids, presence },
      absences,
      meta: { absenceUnreliable: { CTA: hasSafety && !presence.hasAboveTheFoldCTA } },
      perceptualFallback,
      perceptualMetrics
    },
    detectionsUsed,
    hadAbsences: absences.length > 0
  };
}

/* ---------- route ---------- */
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { perception } = await req.json();
    if (!perception) return NextResponse.json({ error: "Missing perception" }, { status: 400 });

    const { payload, detectionsUsed, hadAbsences } = buildPayload(perception);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    console.log("[strict-feedback:counts]", {
      texts: payload.detections.texts.length,
      buttons: payload.detections.buttons.length,
      safetyNet: payload.detections.buttons.filter((b: any) => b.source === 'safety-net').length,
      grids: (payload.detections.grids || []).length
    });
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Return ONLY valid JSON exactly matching this schema:\n${SCHEMA}` },
      { role: "user", content: JSON.stringify({
          // keep payload minimal; GPT must echo back schema
          imageMeta: payload.imageMeta,
          detections: payload.detections,
          absences: payload.absences,
          meta: payload.meta,
          perceptualFallback: payload.perceptualFallback
      }) }
    ];

    const res = await openai.chat.completions.create(
      {
        model: MODEL,
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages
      },
      { timeout: TIMEOUT_MS, signal: controller.signal }
    ).finally(() => clearTimeout(timer));

    const raw = res.choices?.[0]?.message?.content ?? "{}";
    console.log("[strict-feedback:raw]", raw.slice(0, 400));
    let out: any;
    try {
      out = JSON.parse(raw);
    } catch {
      out = null;
    }

    // Enrich model output with detection details (bbox/confidence/reason) before validating
    const detIndex = indexDetections(payload.detections);
    out = enrichFindingsFromDetections(out, detIndex);

    if (!validateFeedback(out)) {
      // graceful fallback
      return NextResponse.json({
        summary: "Structured feedback unavailable — showing perceptual guidance only.",
        findings: [],
        perceptualFallback: payload.perceptualFallback,
        perceptualMetrics: payload.perceptualMetrics,
        meta: { detectionsUsed, hadAbsences, model: "fallback" }
      }, { status: 200 });
    }

    // Enforce anchoring: drop any finding not tied to detectionId or absence
    out.findings = (out.findings || []).filter((f: any) => {
      const ev = f?.evidence || {};
      return typeof ev.absence === "string" || (typeof ev.detectionId === "string" && isBBox(ev.bbox));
    });

    // Guardrails: drop 'Buttons' topic; single-CTA policy; absence if needed
    out.findings = out.findings.filter((f: any) => f?.topic !== 'Buttons');
    // Drop Grid findings unless grids detected (no audit mode exposed here)
    const hasGrid = Array.isArray(payload.detections.grids) && payload.detections.grids.length > 0;
    out.findings = out.findings.filter((f: any) => f?.topic !== 'Grid' || hasGrid);

    // Single CTA selection (highest scoredConfidence above fold)
    // Use only non-ignored buttons for CTA selection
    const candidates = (payload.detections.buttons || []).filter((b:any)=> !b.ignored).map((b: any) => ({
      id: b.id,
      label: b.label,
      source: b.source,
      scoredConfidence: b.scoredConfidence ?? b.confidence ?? 0,
      aboveFold: !!b.aboveFold,
      textContrast: b.textContrast,
      bbox: b.bbox,
      reason: b.reason,
      scoreReasons: b.scoreReasons
    })).sort((a: any, b: any) => (b.scoredConfidence - a.scoredConfidence));
    console.log('[strict-feedback:cta_candidates]', candidates.slice(0, 5));
    // Attach modelSaw block for UI transparency
    const modelSaw = {
      topCandidates: candidates.slice(0,5).map((c: any) => ({
        id: c.id, bbox: c.bbox, text: c.label, origin: c.source, scoredConfidence: c.scoredConfidence,
        aboveFold: c.aboveFold, textContrast: c.textContrast
      })),
      discardedTop: [] as any[]
    };
    // No fold policy: pick highest score with thresholds
    const best = candidates[0];
    const allowLowForUnion = best && best.source === 'safety-net:text+button' && CTA_REGEX.test(best.label || '');
    const passed = best && (best.scoredConfidence >= 0.35 || (allowLowForUnion && best.scoredConfidence >= 0.33));

    // remove any model CTA findings; we will reinsert one canonical CTA or an absence
    out.findings = out.findings.filter((f: any) => f?.topic !== 'CTA');

    const ctaAbsence = {
      topic: 'CTA',
      evidence: { absence: 'No high-confidence call-to-action detected above the fold.' },
      critique: 'There is no clearly identifiable, high-confidence primary action visible above the fold.',
      action: 'Place a single, prominent CTA above the fold with clear label and sufficient contrast.',
      risk: (payload.meta?.absenceUnreliable?.CTA ? 'LOW' : 'HIGH')
    };
    if (passed) {
      out.findings.unshift({
        topic: 'CTA',
        evidence: { detectionId: best.id, bbox: best.bbox, confidence: best.scoredConfidence, reason: best.reason || 'top-scoring CTA' },
        critique: 'Primary CTA identified.',
        action: 'Ensure copy is clear and contrast meets WCAG ≥ 4.5:1 for body text.',
        risk: 'MEDIUM'
      });
    } else {
      out.findings.unshift(ctaAbsence);
      if (best) {
        out.meta = out.meta || {};
        (out.meta as any).notes = [`Closest candidate: ${best.label || best.id} (score=${(best.scoredConfidence||0).toFixed(2)}) — increase visual prominence and add clear action wording (e.g., 'Upload Demo', 'Play', 'Get Pro').`];
      }
    }

    const gridFindings = (out.findings || []).filter((f: any) => f?.topic === 'Grid').length;
    console.log('[strict-feedback:counts:post]', { gridFindings });
    // attach perceptual metrics bundle and modelSaw for the UI
    out.perceptualMetrics = payload.perceptualMetrics;
    (out as any).modelSaw = modelSaw;
    out.meta = { detectionsUsed, hadAbsences, model: MODEL };
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  } finally {
    console.log("[strict-feedback]", { ms: Date.now() - t0 });
  }
}


