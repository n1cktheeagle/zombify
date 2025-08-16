import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// --- Schema ---
const BBox = z.array(z.number()).length(4); // [x,y,w,h]
const Text = z.object({ id: z.string(), text: z.string(), bbox: BBox });
const Cand = z.object({
  id: z.string().min(1),
  source: z.enum(["ocr_pad","raw_block","raw_button","cluster"]),
  bbox: BBox,
});
const Body = z.object({
  image: z.object({ w: z.number(), h: z.number(), hash: z.string() }),
  texts: z.array(Text),
  candidates: z.object({
    buttons: z.array(Cand),
    sections: z.array(Cand),
  }),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { image, texts, candidates } = Body.parse(json);

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY", code: "MISSING_OPENAI_KEY" }, { status: 500 });
    }

    const base = process.env.OPENAI_BASE_URL?.replace(/\/+$/,"") || "https://api.openai.com/v1";
    const model = process.env.OPENAI_STRICT_FEEDBACK_MODEL || "gpt-5";

    // Trim very large candidate sets deterministically (keep as you already had)
    const btns = (candidates.buttons || []).slice(0, 200);
    const secs = (candidates.sections || []).slice(0, 120);

    // Build compact payload the model expects (Responses API)
    const compact = { image, texts, candidates: { buttons: btns, sections: secs }, ask: { buttons: 6, sections: 2 } };
    const systemPrompt = "You are selecting actionable UI buttons and logical sections from candidates. Return strictly valid JSON object with keys: picks{buttons[],sections[]}, ranked{buttons[],sections[]}, meta{model,temp}.";
    const requestBody = {
      model,
      instructions: systemPrompt,
      temperature: 0,
      max_output_tokens: 1500,
      text: { format: "json_object" },
      input: [
        { role: "user", content: [{ type: "input_text", text: JSON.stringify(compact) }] }
      ]
    } as any;

    // 12s timeout with AbortController; NOTE: signal is passed to fetch OPTIONS, not requestBody
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 12_000);

    const res = await fetch(`${base}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).catch((e) => {
      throw new Error(`UPSTREAM_FETCH: ${e?.message || String(e)}`);
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      // eslint-disable-next-line no-console
      console.error("[strict-feedback] upstream non-2xx:", res.status, text.slice(0, 500));
      return NextResponse.json({ error: text, code: "UPSTREAM" }, { status: 502 });
    }

    const data = await res.json();
    const output = data?.output?.[0]?.content?.[0]?.text;
    let parsed: any;
    try { parsed = JSON.parse(output); } catch {
      return NextResponse.json({ error: "Invalid JSON from model", code: "UPSTREAM_FORMAT" }, { status: 502 });
    }
    if (!parsed?.picks) {
      return NextResponse.json({ error: "Missing picks in model response", code: "UPSTREAM_FORMAT" }, { status: 502 });
    }

    return NextResponse.json({ from: "gpt", ...parsed }, { status: 200 });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: JSON.stringify(err.issues, null, 2), code: "INVALID_PAYLOAD" }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error("[strict-feedback] local error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error", code: "SERVER" }, { status: 500 });
  }
}
