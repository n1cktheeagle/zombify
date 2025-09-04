export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { postprocess } from "../../../../src/perception/postprocess";
import { analyzePerception } from "../../../../src/perception/pipeline";

const DEFAULT_PY_URL = "http://127.0.0.1:8090/analyze";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const passRaw = url.searchParams.get("raw") === "1";
  const PY_URL = process.env.PERCEPTION_PY_URL || DEFAULT_PY_URL;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const pyRes = await fetch(PY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!pyRes.ok) {
      const detail = await pyRes.text().catch(() => "");
      return NextResponse.json({ error: "Analyzer failed", detail }, { status: 502 });
    }

    const raw = await pyRes.json();
    if (passRaw || process.env.PERCEPTION_MODE === "raw") {
      return NextResponse.json(raw, { status: 200 });
    }

    // New pipeline with GPT; fallback to strict postprocess if needed
    try {
      const post = await analyzePerception(raw);
      const out = { ...raw, buttons: post.buttons ?? [], sections: post.sections ?? [], blocks: post.sections ?? [] } as any;
      return NextResponse.json(out, { status: 200 });
    } catch {
      const pp = postprocess(raw);
      const out = { ...raw, buttons: pp.buttons ?? [], sections: pp.sections ?? [], blocks: pp.sections ?? [], ...(process.env.NODE_ENV !== "production" && pp._debug !== undefined ? { _debug: pp._debug } : {}) } as any;
      return NextResponse.json(out, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Proxy error" }, { status: 500 });
  }
}


