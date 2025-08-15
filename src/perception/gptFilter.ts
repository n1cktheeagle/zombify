import OpenAI from "openai";
import type { BBox, TextSpan } from "./types";

type Input = {
  imageMeta: { w: number; h: number };
  texts: TextSpan[];
  candidates: { buttons: BBox[]; sections: BBox[] };
};

type Output = {
  buttons: Array<{ box: BBox; reason: string; label?: string }>;
  sections: Array<{ box: BBox; reason: string; title?: string }>;
};

const SYSTEM_PROMPT = `You are a UI auditor. You receive OCR texts and rectangular candidates (boxes). Decide which boxes are actual Buttons or Sections on a generic digital UI.
Definitions:
• Button: a clickable control (may be solid or outlined; can be wide, square, or circular; may contain text and/or icon).
• Section: a visually grouped content area (a panel/card/region that contains multiple related items like titles, labels, stats, or buttons).
Rules:
1. Prefer candidates whose box encloses distinctive visual framing: filled/outlined shapes, rounded corners, or repeated list/card layouts.
2. A Button often has a short action label nearby or inside (e.g., “Buy”, “Repair”, “Deposit”, “Next”, “Bet”), or a clear icon; long sentences are not button labels.
3. A Section usually contains multiple OCR texts within or immediately inside its bounds (title + rows, metrics, lists), and is larger than a button.
4. If uncertain, abstain (exclude).
5. Output only JSON with arrays buttons and sections. Each item: { box:[x,y,w,h], reason:"why", label? } or { box:[x,y,w,h], reason:"why", title? }.`.trim();

export async function filterWithGPT(input: Input, opts?: { model?: string }): Promise<Output> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Safe fallback: abstain
    return { buttons: [], sections: [] };
  }
  const client = new OpenAI({ apiKey });
  const model = opts?.model || process.env.PERCEPTION_MODEL || "gpt-5";

  const userPayload = {
    image: input.imageMeta,
    texts: input.texts.map((t) => ({ text: t.text, bbox: t.bbox })),
    candidates: input.candidates,
  };

  const resp = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
  const parsed = safeJson(raw);
  const out: Output = {
    buttons: Array.isArray(parsed?.buttons) ? parsed.buttons.filter(validBtn) : [],
    sections: Array.isArray(parsed?.sections) ? parsed.sections.filter(validSec) : [],
  };
  return out;
}

function safeJson(s: string): any {
  try {
    const trimmed = s.trim().replace(/^```(json)?/i, "").replace(/```$/, "");
    return JSON.parse(trimmed);
  } catch {
    return {};
  }
}

function validBox(b: any): b is BBox {
  return Array.isArray(b) && b.length === 4 && b.every((n) => Number.isFinite(n));
}
function validBtn(x: any) {
  return x && typeof x === "object" && validBox(x.box) && typeof x.reason === "string";
}
function validSec(x: any) {
  return x && typeof x === "object" && validBox(x.box) && typeof x.reason === "string";
}


