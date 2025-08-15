import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type BBox = [number, number, number, number];
type Candidates = { buttons: BBox[]; sections: BBox[] };

function bad(status: number, code: string, detail?: any) {
  return NextResponse.json({ error: { code, detail } }, { status });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad(400, "invalid_json");
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return bad(500, "missing_openai_key");

  const img = body?.image;
  const texts = body?.texts;
  const candidates: Candidates | undefined = body?.candidates;
  if (!img || !Array.isArray(texts) || !candidates) {
    return bad(400, "invalid_payload", { need: ["image", "texts[]", "candidates{buttons[],sections[]}"] });
  }
  if (!Array.isArray(candidates.buttons) || !Array.isArray(candidates.sections)) {
    return bad(400, "invalid_candidates_shape");
  }
  if (candidates.buttons.length + candidates.sections.length === 0) {
    return bad(422, "no_candidates");
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const system = `You are a UI inspector. From candidates, choose real BUTTONS and SECTIONS.\n- BUTTON: a clickable control (text or icon) with a coherent hit area.\n- SECTION: a visually grouped panel/card/large container of related UI.\nRules:\n- Prefer tight boxes (don’t expand).\n- Reject decorative art, pure backgrounds, floating labels with no hit area.\n- Overlap: prefer the smallest box that still encloses the control.\n- If uncertain, abstain.\n- Output at most 8 buttons and at most 2 sections.\nReturn ONLY valid json. Output strictly as JSON object: { "buttons": Box[], "sections": Box[] } with original coords.`;
    const user = { imageMeta: { w: img.w, h: img.h }, texts, candidates };

    const primary = process.env.OPENAI_STRICT_FEEDBACK_MODEL || "gpt-5";
    const fallback = process.env.OPENAI_STRICT_FEEDBACK_FALLBACK || "gpt-4o-mini";

    async function callModel(model: string, jsonMode: boolean): Promise<{ buttons: any[]; sections: any[] }> {
      const params: any = {
        model,
        temperature: 0,
        messages: [
          { role: "system", content: jsonMode ? system : (system + "\nReturn ONLY json with keys buttons and sections.") },
          { role: "user", content: JSON.stringify(user) },
        ],
      };
      if (jsonMode) params.response_format = { type: "json_object" };
      const resp = await client.chat.completions.create(params);
      const raw = resp.choices?.[0]?.message?.content || "{}";
      const parsed = safeJson(raw);
      let buttons = Array.isArray(parsed.buttons) ? parsed.buttons : [];
      let sections = Array.isArray(parsed.sections) ? parsed.sections : [];
      // --- light post-validation ---
      const W = img.w, H = img.h;
      const clamp = (b: any) => {
        const a = Array.isArray(b) ? b : b.box;
        if (!Array.isArray(a) || a.length !== 4) return null;
        let [x,y,w,h] = a.map((n: any)=> Math.max(0, Number(n)||0));
        x = Math.min(x, W); y = Math.min(y, H); w = Math.min(w, Math.max(0, W - x)); h = Math.min(h, Math.max(0, H - y));
        if (w < 24 || h < 18) return null;
        return [x,y,w,h];
      };
      const isVerb = (s: string) => /\b(buy|join|repair|start|play|bet|confirm|continue|save|get|install|apply|submit|next|ok|yes)\b/i.test(s||"");
      const isMetric = (s: string) => /%|\b\d{1,2}:\d{2}\b|\d+\s*\/\s*\d+/.test(s||"");
      const nearText = (bb: number[]) => {
        const [x,y,w,h]=bb; const cx=x+w/2, cy=y+h/2; const tol=32; return (texts||[]).some((t:any)=>{ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; return Math.abs(tcx-cx)<=tol && Math.abs(tcy-cy)<=tol; });
      };
      const insideText = (bb: number[]) => {
        const [x,y,w,h]=bb; const x2=x+w, y2=y+h; return (texts||[]).some((t:any)=>{ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; return (tcx>=x&&tcx<=x2&&tcy>=y&&tcy<=y2); });
      };
      // buttons: clamp + require nearby OR inside text; tolerate unknown label but drop numeric metrics; allow large clear shapes
      buttons = buttons.map(clamp).filter(Boolean as any).filter((bb:any)=>{
        if (nearText(bb) || insideText(bb)) return true;
        // heuristic: allow clear large shapes
        const [ , , w, h ] = bb; return (w>=80 && h>=28);
      });
      // sections: clamp + area band + require ≥6 texts inside; reject near-fullscreen
      sections = sections.map(clamp).filter(Boolean as any).filter((bb:any)=>{ const area=(bb[2]*bb[3])/(W*H); if (area<0.03||area>0.60) return false; if(area>0.70) return false; const [x,y,w,h]=bb; const x2=x+w,y2=y+h; let cnt=0; for(const t of (texts||[])){ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; if (tcx>=x&&tcx<=x2&&tcy>=y&&tcy<=y2) cnt++; } return cnt>=3; });
      // cap counts
      buttons = buttons.slice(0,8); sections = sections.slice(0,2);
      return { buttons, sections };
    }

    function isJsonModeUnsupported(e: any): boolean {
      const msg = (e?.message || "").toString().toLowerCase();
      const code = (e?.code || "").toString().toLowerCase();
      return code.includes("unsupported") || msg.includes("unsupported") || msg.includes("response_format");
    }

    // Strategy: for gpt-5 try without JSON mode first; otherwise try with JSON mode.
    const primaryJsonMode = !/^gpt-5/i.test(primary);
    try {
      let { buttons, sections } = await callModel(primary, primaryJsonMode);
      // post-validate & backfill if empty handled below
      const validated = postValidate(buttons, sections, img, texts, candidates);
      if ((validated.buttons.length + validated.sections.length) === 0) {
        return NextResponse.json({ source: "fallback_post", ...relaxedBackfill(candidates, img) }, { status: 200 });
      }
      return NextResponse.json({ source: "gpt", ...validated }, { status: 200 });
    } catch (e: any) {
      // If primary failed due to JSON mode, retry primary without JSON mode once
      if (primaryJsonMode && isJsonModeUnsupported(e)) {
        try {
          let { buttons, sections } = await callModel(primary, false);
          const validated = postValidate(buttons, sections, img, texts, candidates);
          if ((validated.buttons.length + validated.sections.length) === 0) {
            return NextResponse.json({ source: "fallback_post", ...relaxedBackfill(candidates, img) }, { status: 200 });
          }
          return NextResponse.json({ source: "gpt", ...validated }, { status: 200 });
        } catch (e2: any) {
          // proceed to fallback
        }
      }
      // Fallback model with JSON mode
      try {
        let { buttons, sections } = await callModel(fallback, true);
        const validated = postValidate(buttons, sections, img, texts, candidates);
        if ((validated.buttons.length + validated.sections.length) === 0) {
          return NextResponse.json({ source: "fallback_post", ...relaxedBackfill(candidates, img) }, { status: 200 });
        }
        return NextResponse.json({ source: "gpt_fallback", ...validated }, { status: 200 });
      } catch (ef: any) {
        console.error("strict-feedback error", ef);
        const code = ef?.code ?? "gpt_error";
        const status = code === "ETIMEDOUT" ? 504 : 502;
        return bad(status, String(code), { message: ef?.message });
      }
    }
  } catch (err: any) {
    console.error("strict-feedback error", err);
    const code = err?.code ?? "gpt_error";
    const status = code === "ETIMEDOUT" ? 504 : 502;
    return bad(status, String(code), { message: err?.message });
  }
}

function safeJson(s: string): any {
  try {
    const t = s.trim().replace(/^```(json)?/i, "").replace(/```$/i, "");
    return JSON.parse(t);
  } catch {
    return {};
  }
}

// --- helpers: post-validate & relaxed backfill ---
function postValidate(rawButtons: any[], rawSections: any[], img: { w: number; h: number }, texts: any[], candidates: any) {
  const W = img.w, H = img.h;
  const clamp = (b: any) => {
    const a = Array.isArray(b) ? b : b.box;
    if (!Array.isArray(a) || a.length !== 4) return null;
    let [x,y,w,h] = a.map((n: any)=> Math.max(0, Number(n)||0));
    x = Math.min(x, W); y = Math.min(y, H); w = Math.min(w, Math.max(0, W - x)); h = Math.min(h, Math.max(0, H - y));
    if (w < 24 || h < 18) return null;
    return [x,y,w,h];
  };
  const nearText = (bb: number[]) => { const [x,y,w,h]=bb; const cx=x+w/2, cy=y+h/2; const tol=32; return (texts||[]).some((t:any)=>{ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; return Math.abs(tcx-cx)<=tol && Math.abs(tcy-cy)<=tol; }); };
  const insideText = (bb: number[]) => { const [x,y,w,h]=bb; const x2=x+w, y2=y+h; return (texts||[]).some((t:any)=>{ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; return (tcx>=x&&tcx<=x2&&tcy>=y&&tcy<=y2); }); };
  const nearestText = (bb: number[]) => { const [x,y,w,h]=bb; const cx=x+w/2, cy=y+h/2; let best:any=null,bd=1e9; for(const t of (texts||[])){ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; const d=Math.max(Math.abs(tcx-cx), Math.abs(tcy-cy)); if(d<bd){ bd=d; best=t; } } return best; };
  // buttons
  let buttons = (rawButtons||[]).map(clamp).filter(Boolean as any).filter((bb:any)=>{
    const t = nearestText(bb);
    if (t) {
      const label = String(t.text||"").trim();
      const words = label.split(/\s+/).filter(Boolean).length;
      // Accept only short action-y labels near the patch; drop long sentences/metrics
      if (isMetric(label)) return false;
      if (words<=3 && label.length<=20 && (isVerb(label) || /menu|bag|equip|apply|repair|save|ok|yes|play|start|next/i.test(label))) return true;
      return false;
    }
    // Shape-only fallback: stricter geometry
    const [ , , w, h ] = bb; const ar = w/Math.max(1,h); const area=(w*h)/(W*H);
    return w>=72 && h>=24 && ar>=1.2 && ar<=6.0 && area<=0.10;
  }).slice(0,8);
  // sections
  let sections = (rawSections||[]).map(clamp).filter(Boolean as any).filter((bb:any)=>{
    const [x,y,w,h]=bb; const area=(w*h)/(W*H); if (area<0.04||area>0.60) return false; if(area>0.80) return false;
    const x2=x+w,y2=y+h; let cnt=0; for(const t of (texts||[])){ const tb=t.bbox; const tcx=tb[0]+tb[2]/2, tcy=tb[1]+tb[3]/2; if (tcx>=x&&tcx<=x2&&tcy>=y&&tcy<=y2) cnt++; }
    return cnt>=2;
  }).slice(0,2);
  return { buttons, sections };
}

function relaxedBackfill(candidates: any, img: { w: number; h: number }) {
  const W=img.w, H=img.h;
  const clamp = (a: any) => { if(!Array.isArray(a)||a.length!==4) return null; let [x,y,w,h]=a.map((n:any)=> Math.max(0, Number(n)||0)); x=Math.min(x,W); y=Math.min(y,H); w=Math.min(w, Math.max(0,W-x)); h=Math.min(h, Math.max(0,H-y)); if(w<24||h<18) return null; return [x,y,w,h]; };
  const bs = ((candidates?.buttons)||[]).map(clamp).filter(Boolean as any).slice(0,8);
  const ss = ((candidates?.sections)||[]).map(clamp).filter(Boolean as any).filter((bb:any)=>{ const area=(bb[2]*bb[3])/(W*H); return area>=0.03 && area<=0.80; }).slice(0,2);
  return { buttons: bs, sections: ss };
}


