"use client";

import React, { useMemo, useState } from "react";
import PerceptionOverlay from "@/components/PerceptionOverlay";
import StrictPanel from "../../../components/StrictPanel";
import { postprocess } from "../../../src/perception/postprocess";

type AnalyzeModes = Array<"ocr" | "geometry" | "contrast" | "palette">;
type PerceptionJson = any;
const DEFAULT_URL = "";

export default function PerceptionDevPage() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [data, setData] = useState<PerceptionJson | null>(null);
  const [facts, setFacts] = useState<string>("");
  const [strictJson, setStrictJson] = useState<string>("");
  const [strict, setStrict] = useState(true);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showTexts, setShowTexts] = useState(true);
  const [showButtons, setShowButtons] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const targetWidth = 1440 as const;
  const modes: AnalyzeModes = ["ocr", "geometry", "contrast", "palette"];

  const API_BASE = process.env.NEXT_PUBLIC_PERCEPTION_URL ?? "/api/perception";

  const onRun = async () => {
    setLoading(true);
    setError("");
    setData(null);
    setFacts("");
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: url.trim(), target_width: 1440, modes }),
      });
      const raw = await res.json();
      if (!res.ok || raw?.source?.ocr?.startsWith("error")) {
        throw new Error(raw?.source?.ocr || `HTTP ${res.status}`);
      }

      // Client-side postprocess to ensure candidates are built even if server skips it
      const pp = postprocess(raw);
      const candidatesRaw = pp?.candidates ?? { buttons: [], sections: [] };
      // ---- client-side trim to avoid huge payloads ----
      const iou = (a: number[], b: number[]) => {
        const [ax, ay, aw, ah] = a; const [bx, by, bw, bh] = b;
        const ax2 = ax + aw, ay2 = ay + ah, bx2 = bx + bw, by2 = by + bh;
        const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(ax, bx));
        const iy = Math.max(0, Math.min(ay2, by2) - Math.max(ay, by));
        const inter = ix * iy; const uni = aw * ah + bw * bh - inter; return uni <= 0 ? 0 : inter / uni;
      };
      const dedupe = (boxes: number[][], thr = 0.3, limit = 999) => {
        const kept: number[][] = [];
        for (const b of boxes) { let over=false; for (const k of kept){ if(iou(b,k)>thr){ over=true; break; } } if(!over) kept.push(b); if(kept.length>=limit) break; }
        return kept;
      };
      const textsSlim = (raw.texts || []).slice(0, 120).map((t: any) => ({ text: t.text, bbox: t.bbox }));
      const buttonsSlim = dedupe((candidatesRaw.buttons || []).slice(0, 200), 0.3, 60);
      const sectionsSlim = (candidatesRaw.sections || []).slice(0, 30);
      const candidates = { buttons: buttonsSlim, sections: sectionsSlim };
      const totalCands = buttonsSlim.length + sectionsSlim.length;
      if (totalCands === 0) {
        setError("no_candidates");
        setData(null);
        return;
      }

      const r = await fetch("/api/strict-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: raw.image, texts: textsSlim, candidates })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({} as any));
        const msg = err?.error?.code ? `${err.error.code}` : `strict_feedback_${r.status}`;
        throw new Error(msg);
      }
      const picked = await r.json();
      const buttons = Array.isArray(picked?.buttons) ? picked.buttons : [];
      const sections = Array.isArray(picked?.sections) ? picked.sections : [];
      // Normalize to overlay's expected shape { id, bbox }
      const normButtons = buttons.map((b: any, i: number) => ({
        id: b?.id ?? `btn_${i}`,
        bbox: (Array.isArray(b?.bbox) ? b.bbox : (Array.isArray(b?.box) ? b.box : (Array.isArray(b) ? b : [0,0,0,0])))
      }));
      const normBlocks = sections.map((s: any, i: number) => ({
        id: s?.id ?? `sec_${i}`,
        bbox: (Array.isArray(s?.bbox) ? s.bbox : (Array.isArray(s?.box) ? s.box : (Array.isArray(s) ? s : [0,0,0,0]))),
        kind: 'section'
      }));
      setData({ ...raw, buttons: normButtons, blocks: normBlocks });
      setFacts(`Texts: ${raw.texts?.length ?? 0}`);

      try {
        const strictRes = await fetch('/api/strict-feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: raw.image, texts: raw.texts, candidates }), cache: 'no-store'
        });
        const strictText = await strictRes.text();
        setStrictJson(strictText);
      } catch (_) {}
    } catch (e: any) {
      setError(e?.message || "Failed to fetch");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const onCopyCurl = async () => {
    const cmd = `curl -s -X POST \"http://127.0.0.1:8090/analyze\" -H \"Content-Type: application/json\" -d '{\"image_url\":\"${url.trim()}\",\"target_width\":1440,\"modes\":[\"ocr\",\"geometry\",\"contrast\",\"palette\"]}' | jq '{texts:(.texts|length), ocr:.source.ocr}'`;
    try { await navigator.clipboard.writeText(cmd); } catch {}
  };

  return (
    <div className="p-6 w-full max-w-none space-y-4">
      <h1 className="text-2xl font-semibold">Perception Dev</h1>
      <div className="flex gap-2 items-center">
        <input className="flex-1 border rounded px-3 py-2" placeholder="Paste signed screenshot URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="border rounded px-4 py-2" onClick={onRun} disabled={!url || loading}>{loading ? "Analyzing…" : "Analyze"}</button>
        <button className="border rounded px-3 py-2 text-xs" onClick={onCopyCurl} disabled={!url}>Copy curl</button>
        <label className="ml-2 text-xs flex items-center gap-2">
          <input type="checkbox" checked={strict} onChange={(e)=> setStrict(e.target.checked)} />
          <span>Strict v3</span>
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-red-500 bg-red-50 text-red-800 px-3 py-2">
          Strict mode failed: <strong>{error}</strong> — no overlays shown.
        </div>
      )}

      {data && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-3 lg:col-span-2 xl:col-span-3">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-2"><input type="checkbox" checked={showTexts} onChange={(e) => setShowTexts(e.target.checked)} /><span>Texts</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showButtons} onChange={(e) => setShowButtons(e.target.checked)} /><span>Buttons</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showBlocks} onChange={(e) => setShowBlocks(e.target.checked)} /><span>Blocks</span></label>
            </div>

            <PerceptionOverlay
              imageUrl={url}
              targetWidth={targetWidth}
              imageNatural={data.image}
              texts={(data.texts || []).map((t: any) => ({ id: t.id, bbox: t.bbox }))}
              buttons={(data.buttons || []).map((b: any) => ({ id: b.id, bbox: b.bbox }))}
              blocks={(data.blocks || []).map((b: any) => ({ id: b.id, bbox: b.bbox, kind: b.kind || 'section' }))}
              grid={null}
              gridCandidates={[]}
              show={{ texts: showTexts, buttons: showButtons, blocks: showBlocks, grid: false }}
              highlightedButtonIds={highlightIds}
              hoveredButtonId={hoverId}
            />

            <div className="rounded-lg border p-3 text-sm">
              <div><strong>Texts:</strong> {(data.texts || []).length}</div>
              <div><strong>Buttons:</strong> {(data.buttons || []).length}</div>
              <div><strong>Blocks:</strong> {(data.blocks || []).length}</div>
              {data.source?.ocr && <div><strong>OCR:</strong> {String(data.source.ocr)}</div>}
            </div>
          </div>

          <div className="xl:col-span-1">
            <h2 className="font-medium mb-2">Perception JSON</h2>
            <pre className="text-xs bg-black text-green-300 p-3 rounded overflow-auto" style={{ maxHeight: 480 }}>{JSON.stringify(data, null, 2)}</pre>
            {strictJson && (<StrictPanel raw={strictJson} onHover={(id: string | null)=> setHoverId(id)} onSelect={(ids: string[])=> setHighlightIds(ids)} />)}
          </div>
        </div>
      )}
    </div>
  );
}
