import type { BBox, Perception } from "./types";
import { nms } from "../utils/geometry";

type GPTOut = {
  buttons: Array<{ box: BBox; reason: string; label?: string }>;
  sections: Array<{ box: BBox; reason: string; title?: string }>;
};

export function validateAndFinalize(perception: Perception, gptOut: GPTOut, _cfg?: any) {
  const imgW = perception?.image?.w || 0;
  const imgH = perception?.image?.h || 0;

  function clamp(b: BBox): BBox {
    let [x, y, w, h] = b;
    x = Math.max(0, Math.min(x, imgW));
    y = Math.max(0, Math.min(y, imgH));
    w = Math.max(0, Math.min(w, imgW - x));
    h = Math.max(0, Math.min(h, imgH - y));
    return [x, y, w, h];
  }

  function scoreButton(b: { box: BBox; label?: string }): number {
    const hasLabel = typeof b.label === "string" && b.label.trim().length > 0;
    const containsText = intersectsAnyText(b.box, perception);
    return (hasLabel ? 0.1 : 0) + (containsText ? 0.05 : 0);
  }
  function scoreSection(s: { box: BBox; title?: string }): number {
    const hasTitle = typeof s.title === "string" && s.title.trim().length > 0;
    const containsText = intersectsAnyText(s.box, perception);
    return (hasTitle ? 0.1 : 0) + (containsText ? 0.05 : 0);
  }

  const rawButtons = (gptOut.buttons || []).map((b, i) => ({ id: `btn_${i}`, kind: "button" as const, bbox: clamp(b.box), score: scoreButton(b), label: b.label }));
  const rawSections = (gptOut.sections || []).map((s, i) => ({ id: `sec_${i}`, kind: "section" as const, bbox: clamp(s.box), score: scoreSection(s) }));

  const filteredButtons = rawButtons.filter((b) => Math.min(b.bbox[2], b.bbox[3]) >= 16);
  const filteredSections = rawSections.filter((s) => Math.min(s.bbox[2], s.bbox[3]) >= 16);

  const keptButtons = nms(filteredButtons, 0.35);
  const keptSections = nms(filteredSections, 0.5);

  return { buttons: keptButtons, sections: keptSections };
}

function intersectsAnyText(b: BBox, perception: Perception): boolean {
  const [x, y, w, h] = b;
  const x2 = x + w, y2 = y + h;
  for (const t of perception.texts || []) {
    const [tx, ty, tw, th] = t.bbox;
    const tx2 = tx + tw, ty2 = ty + th;
    const inter = Math.max(0, Math.min(x2, tx2) - Math.max(x, tx)) * Math.max(0, Math.min(y2, ty2) - Math.max(y, ty));
    if (inter > 0) return true;
  }
  return false;
}


