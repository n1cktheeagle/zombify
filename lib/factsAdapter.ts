import type { PerceptionJson } from "./perceptionClient";

export function buildFactsAdapter(perception: PerceptionJson): { text: string; allowedIds: Set<string> } {
  const lines: string[] = [];
  const allowed = new Set<string>();

  for (const t of perception.texts) {
    lines.push(`[${t.id}] ${JSON.stringify(t.text)} size≈${t.approxSizePx}px`);
    allowed.add(t.id);
  }

  for (const c of perception.contrast) {
    lines.push(`[${c.id}] ${c.textId} ratio=${c.ratio} wcag=${c.wcag}`);
    allowed.add(c.id);
    if (c.textId) allowed.add(c.textId);
  }

  const buttonCount = perception.buttons.length;
  lines.push(`[layout.buttonCount]=${buttonCount}`);

  if (perception.metrics) {
    lines.push(`[metrics.medianVSpace]=${perception.metrics.medianVSpace}`);
  }

  if (perception.palette) {
    lines.push(`[palette]=${perception.palette.dominant.join(",")} (mode=${perception.palette.mode})`);
  }

  for (const b of perception.buttons) {
    allowed.add(b.id);
  }

  // Synthetic IDs
  allowed.add("layout.buttonCount");
  allowed.add("metrics.medianVSpace");
  allowed.add("palette");

  return { text: lines.join("\n"), allowedIds: allowed };
}
