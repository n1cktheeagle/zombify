"use client";
import React, { useMemo } from "react";

type BBox = { x: number; y: number; w: number; h: number };
type Evidence = ({ detectionId: string; bbox: BBox; confidence: number; reason: string }) | ({ absence: string });
type Finding = {
  topic: string;
  evidence: Evidence;
  critique: string;
  action: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
};
type StrictOut = {
  summary: string;
  findings: Finding[];
  perceptualFallback?: { contrastScore: number; textDensity: number; spacingTightness: number; alignmentConsistency: number; notes?: string[] };
  meta: { detectionsUsed: number; hadAbsences: boolean; model: string; notes?: string[] };
  perceptualMetrics?: { contrastScore: number; textDensity: number; spacingTightness: number; alignmentConsistency: number; notes?: string[] };
  modelSaw?: { topCandidates: Array<{ id: string; bbox: BBox; text?: string; origin?: string; scoredConfidence?: number; aboveFold?: boolean; linkTextId?: string; textContrast?: number }> };
};

export default function StrictPanel({ raw, onHover, onSelect }: { raw: string; onHover: (id: string | null) => void; onSelect: (ids: string[]) => void }) {
  const data: StrictOut | null = useMemo(() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [raw]);

  const findings = data?.findings || [];
  const hadAbs = data?.meta?.hadAbsences;
  const isFallback = data?.meta?.model === "fallback";

  const onEnter = (f: Finding) => {
    if ("detectionId" in f.evidence) onHover((f.evidence as any).detectionId);
  };
  const onLeave = () => onHover(null);
  const onClick = (f: Finding) => {
    if ("detectionId" in f.evidence) onSelect([(f.evidence as any).detectionId]);
    else onSelect([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Review</h2>
        {isFallback && <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 border">Perceptual guidance only</span>}
      </div>
      {hadAbs && (
        <div className="text-xs text-gray-600">Absences present; some findings may reference explicit absences.</div>
      )}
      <div className="space-y-2">
        {findings.map((f, idx) => {
          const ev = f.evidence as any;
          const anchored = typeof ev?.detectionId === "string";
          const chip = anchored ? `anchor: ${ev.detectionId}` : "absence";
          const riskCls = f.risk === "HIGH" ? "bg-red-100 text-red-800 border-red-300" : f.risk === "MEDIUM" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-emerald-100 text-emerald-800 border-emerald-300";
          return (
            <div key={idx} className="border rounded p-3 hover:bg-gray-50 cursor-pointer" onMouseEnter={() => onEnter(f)} onMouseLeave={onLeave} onClick={() => onClick(f)}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-[2px] rounded border ${riskCls}`}>{f.risk}</span>
                <span className="text-xs uppercase tracking-wide text-gray-600">{f.topic}</span>
                <span className="text-[10px] px-2 py-[2px] rounded border bg-gray-100 text-gray-700 ml-auto">{chip}</span>
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{f.critique}</div>
                <div className="text-gray-700">{f.action}</div>
              </div>
            </div>
          );
        })}
      </div>
      {Array.isArray(data?.meta?.notes) && data!.meta!.notes!.length > 0 && (
        <div className="border rounded p-3 text-xs text-gray-700">
          <div className="font-medium mb-1">Notes</div>
          <ul className="list-disc list-inside">
            {data!.meta!.notes!.map((n: string, i: number) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
      {data?.modelSaw?.topCandidates && data.modelSaw.topCandidates.length > 0 && (
        <div className="border rounded p-3 text-xs">
          <div className="font-medium">Model saw</div>
          <ul className="mt-2 space-y-1">
            {data.modelSaw.topCandidates.slice(0,5).map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-gray-700">{c.id}</span>
                  {typeof c.text === 'string' && <span className="ml-1 text-gray-500">— {c.text}</span>}
                </div>
                <div className="text-gray-600">
                  score {(c.scoredConfidence ?? 0).toFixed(2)} {c.aboveFold ? '• above-fold' : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!findings.length && data?.perceptualFallback && (
        <div className="border rounded p-3 text-sm">
          <div className="font-medium mb-1">Perceptual guidance only</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Contrast: {data.perceptualFallback.contrastScore}</div>
            <div>Text density: {data.perceptualFallback.textDensity}</div>
            <div>Spacing: {data.perceptualFallback.spacingTightness}</div>
            <div>Alignment: {data.perceptualFallback.alignmentConsistency}</div>
          </div>
          {Array.isArray(data.perceptualFallback.notes) && data.perceptualFallback.notes.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-xs text-gray-700">
              {data.perceptualFallback.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


