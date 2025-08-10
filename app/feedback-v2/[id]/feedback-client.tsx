'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface FeedbackRow {
  id: string;
  created_at: string;
  image_url: string;
  original_filename: string | null;
  analysis: any;
}

export default function FeedbackV2Client({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient();
  const [row, setRow] = useState<FeedbackRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBox, setActiveBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('id', params.id)
          .single();
        if (error) throw error;
        if (mounted) setRow(data as any);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [params.id, supabase]);

  const a = row?.analysis || {};
  const isClarity = a?.engineVersion === 'clarity-v2';
  const isGrounded = a?.engineVersion === 'grounded-v1';
  const modelName: string = (a?.model || a?.modelConfig?.model || '').toString();
  const isGpt5Model = modelName.toLowerCase().includes('gpt-5');
  const ext = a?.extensions || null;
  const extElements = useMemo(() => {
    const map = new Map<string, any>();
    if (ext?.inventory?.elements) {
      for (const el of ext.inventory.elements) {
        if (el?.id) map.set(el.id, el);
      }
    }
    return map;
  }, [ext]);
  const highlightExtElement = (id: string) => {
    const el = extElements.get(id);
    if (!el || !Array.isArray(el.bbox)) return;
    const [x, y, w, h] = el.bbox;
    setActiveBox({ x: x + w / 2, y: y + h / 2, width: w, height: h });
  };

  const highlightByRef = (ref: string) => {
    if (!ref) return;
    const trimmed = String(ref).trim();
    // 1) If ref is an element id, use it directly
    if (extElements.has(trimmed)) {
      highlightExtElement(trimmed);
      return;
    }
    // 2) Otherwise try to find an inventory element whose text matches the ref
    const lowerRef = trimmed.toLowerCase();
    let bestMatch: any = null;
    for (const el of Array.from(extElements.values())) {
      const t = (el?.text || '').toLowerCase();
      if (!t) continue;
      if (t.includes(lowerRef) || lowerRef.includes(t)) {
        if (!bestMatch || (el.text?.length || 0) > (bestMatch.text?.length || 0)) {
          bestMatch = el;
        }
      }
    }
    if (bestMatch && Array.isArray(bestMatch.bbox)) {
      const [x, y, w, h] = bestMatch.bbox;
      setActiveBox({ x: x + w / 2, y: y + h / 2, width: w, height: h });
    }
  };

  const score: number = a?.clarityScore?.overall ?? a?.gripScore?.overall ?? 0;
  const breakdown = a?.clarityScore?.breakdown || { firstImpression: 0, visualClarity: 0, informationScent: 0, alignment: 0 };
  const confusion = Array.isArray(a?.confusionFindings) ? a.confusionFindings : [];
  const boosters = Array.isArray(a?.clarityBoosters) ? a.clarityBoosters : [];
  const misalignments = Array.isArray(a?.misalignments) ? a.misalignments : [];
  const observed = Array.isArray(a?.observedTexts) ? a.observedTexts : [];

  const imageBoxes = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      box: { x: number; y: number; width: number; height: number };
    }> = [];
    confusion.forEach((f: any, idx: number) => {
      if (f?.box && typeof f.box.x === 'number') items.push({ key: `c-${idx}`, label: f.issue, box: f.box });
    });
    misalignments.forEach((m: any, idx: number) => {
      if (m?.box && typeof m.box.x === 'number') items.push({ key: `m-${idx}`, label: m.statement, box: m.box });
    });
    return items.slice(0, 12);
  }, [confusion, misalignments]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-black font-mono">Loading Clarity results...</div>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="p-8">
        <div className="text-red-600 font-mono">{error || 'Not found'}</div>
        <div className="mt-4"><Link href="/dashboard" className="underline">Back to dashboard</Link></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-black/60 font-mono">
            {isClarity ? 'ENGINE: CLARITY-V2' : isGrounded ? 'ENGINE: GROUNDED-V1' : 'ENGINE: UNKNOWN'}
          </div>
          <h1 className="text-2xl font-bold">{isGrounded ? 'Grounded Report' : 'Clarity Report'}</h1>
          <div className="text-sm text-black/60 font-mono">ID {row.id} • {new Date(row.created_at).toLocaleString()}</div>
          <div className="mt-1">
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${isGpt5Model ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
              Model: {modelName || 'unknown'}{isGpt5Model ? '' : ' (not GPT-5)'}
            </span>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm underline font-mono">Back</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Screenshot + overlays */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-black/20 p-3 bg-white relative">
            <div className="text-xs text-black/60 font-mono mb-1">SCREENSHOT</div>
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.image_url} alt={row.original_filename || 'screenshot'} className="w-full h-auto" />
              {activeBox && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${activeBox.x}%`,
                    top: `${activeBox.y}%`,
                    width: `${activeBox.width}%`,
                    height: `${activeBox.height}%`,
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.45) 0%, rgba(220,38,38,0.25) 40%, rgba(220,38,38,0.1) 70%, rgba(220,38,38,0) 100%)',
                    mixBlendMode: 'multiply',
                    filter: 'blur(2px)'
                  }}
                />
              )}
            </div>
          </div>

          {/* Saliency and contrast summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">ATTENTION</div>
              {a?.saliency?.attentionPercentages?.length ? (
                <ul className="text-sm space-y-1 font-mono">
                  {a.saliency.attentionPercentages.slice(0, 5).map((r: any, i: number) => (
                    <li key={i}>{r.region}: {r.percentage}%</li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-black/60 font-mono">No attention data</div>
              )}
            </div>
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">CONTRAST</div>
              <div className="text-sm font-mono">Fails: {a?.contrastAudit?.fails ?? 0}</div>
              {a?.contrastAudit?.issues?.length ? (
                <ul className="mt-1 text-xs space-y-1">
                  {a.contrastAudit.issues.slice(0, 5).map((i: any, idx: number) => (
                    <li key={idx}>
                      {i.foreground} on {i.background} • {i.ratio}:1 • {i.wcagLevel}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        {/* Extensions (additive) */}
        {ext && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">PERCEPTION (EXT)</div>
              {Array.isArray(ext?.perception?.attention_anchors) && ext.perception.attention_anchors.length > 0 ? (
                <ul className="text-sm space-y-1 font-mono">
                  {ext.perception.attention_anchors.slice(0, 5).map((r: any, i: number) => (
                    <li key={i}><button className="underline" onClick={() => highlightExtElement(r.element_id)}>{r.element_id}</button>: {r.reason} ({Math.round((r.confidence || 0) * 100)}%)</li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-black/60 font-mono">No attention anchors</div>
              )}
              {Array.isArray(ext?.perception?.scan_path_order) && ext.perception.scan_path_order.length > 0 && (
                <div className="mt-2 text-xs font-mono">Scan path: {ext.perception.scan_path_order.map((id: string, idx: number) => (
                  <button key={id} className="underline mr-1" onClick={() => highlightExtElement(id)}>
                    {id}{idx < ext.perception.scan_path_order.length - 1 ? ' →' : ''}
                  </button>
                ))}</div>
              )}
            </div>
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">ACCESSIBILITY (EXT)</div>
              {Array.isArray(ext?.accessibility?.contrast_checks) && ext.accessibility.contrast_checks.length > 0 ? (
                <ul className="mt-1 text-xs space-y-1">
                  {ext.accessibility.contrast_checks.slice(0, 6).map((i: any, idx: number) => (
                    <li key={idx}>
                      {i.element_id ? <button className="underline" onClick={() => highlightExtElement(i.element_id)}>{i.element_id}</button> : <span>—</span>}: {i.fg_hex} on {i.bg_hex} • {i.ratio_est}:1 • {i.wcag_flag}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-black/60 font-mono">No contrast samples</div>
              )}
              {Array.isArray(ext?.accessibility?.touch_target_risks) && ext.accessibility.touch_target_risks.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {ext.accessibility.touch_target_risks.slice(0, 6).map((t: any, idx: number) => (
                    <li key={idx}><button className="underline" onClick={() => highlightExtElement(t.element_id)}>{t.element_id}</button>: {t.size?.[0]}×{t.size?.[1]} — UNDER_MIN</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">CONSISTENCY (EXT)</div>
              {Array.isArray(ext?.consistency?.palette) && ext.consistency.palette.length > 0 && (
                <div className="text-xs font-mono">Palette: {ext.consistency.palette.slice(0, 6).map((p: any, i: number) => (
                  <span key={i} className="inline-flex items-center mr-2">
                    <span className="w-3 h-3 rounded-full border border-black/20 mr-1" style={{ backgroundColor: p.hex }} />{p.hex}
                  </span>
                ))}</div>
              )}
              {Array.isArray(ext?.consistency?.typography) && ext.consistency.typography.length > 0 && (
                <ul className="list-disc pl-5 text-xs mt-2">
                  {ext.consistency.typography.slice(0, 6).map((t: any, i: number) => (
                    <li key={i}>{t.role}: {t.style_hint} — <span className="font-mono">{t.example_text}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">AESTHETIC (EXT)</div>
              <div className="text-xs font-mono">Style: {(ext?.aesthetic?.style_tags || []).join(', ') || '—'}</div>
              <div className="text-xs font-mono">Mood: {(ext?.aesthetic?.mood_tags || []).join(', ') || '—'}</div>
            </div>
            <div className="border border-black/20 p-3 bg-white">
              <div className="text-xs text-black/60 font-mono mb-1">SCORES (EXT)</div>
              <div className="text-sm font-mono">Grip score: {ext?.scores?.grip_score?.value ?? '—'}</div>
              <div className="text-sm font-mono">Zombie appeal: {ext?.scores?.zombie_mass_appeal?.value ?? '—'}</div>
            </div>
            <div className="border border-black/20 p-3 bg-white md:col-span-2">
              <div className="text-xs text-black/60 font-mono mb-2">RECOMMENDATIONS (EXT)</div>
              {Array.isArray(ext?.recommendations) && ext.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {ext.recommendations.slice(0, 10).map((r: any, i: number) => (
                    <li key={i} className="text-sm border-l-2 border-emerald-400 pl-3">
                      <div className="font-semibold">{r.issue}</div>
                      {Array.isArray(r.evidence) && r.evidence.length > 0 && (
                        <div className="text-xs font-mono mt-1">Evidence: {r.evidence.slice(0, 6).map((ref: string, j: number) => (
                          <button key={j} className="underline mr-1" onClick={() => highlightByRef(ref)}>{ref}</button>
                        ))}</div>
                      )}
                      {r.action && <div className="text-xs mt-1 font-mono">Action: {r.action}</div>}
                      {r.expected_effect && <div className="text-[11px] text-black/60 font-mono">Effect: {r.expected_effect}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-black/60 font-mono">No recommendations</div>
              )}
            </div>
          </div>
        )}

        {/* Right: Scores and findings */}
        <div className="space-y-4">
          <div className="border border-black/20 p-3 bg-white">
            <div className="text-xs text-black/60 font-mono mb-1">SCORES</div>
            <div className="text-4xl font-bold font-mono">{score.toString().padStart(2, '0')}</div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs font-mono">
              <div>First impression: {breakdown.firstImpression}</div>
              <div>Visual clarity: {breakdown.visualClarity}</div>
              <div>Info scent: {breakdown.informationScent}</div>
              <div>Alignment: {breakdown.alignment}</div>
            </div>
          </div>

          <div className="border border-black/20 p-3 bg-white">
            <div className="text-xs text-black/60 font-mono mb-2">CONFUSION FINDINGS</div>
            {confusion.length === 0 ? (
              <div className="text-sm text-black/60 font-mono">No confusion issues reported</div>
            ) : (
              <div className="space-y-3">
                {confusion.map((f: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-red-400 pl-3">
                    <div className="text-sm font-semibold flex items-center justify-between">
                      <span>{f.issue}</span>
                      {typeof f.confidence === 'number' && (
                        <span className="text-[10px] text-black/60 font-mono">conf {Math.round(f.confidence * 100)}%</span>
                      )}
                    </div>
                    <div className="text-xs text-black/60">Impact: {f.impact}</div>
                    {Array.isArray(f.evidence) && f.evidence.length > 0 && (
                      <ul className="list-disc pl-5 text-xs mt-1">
                        {f.evidence.slice(0, 5).map((e: string, i: number) => (
                          <li key={i} className="font-mono">
                            <button className="underline" onClick={() => highlightByRef(e)}>{e}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {f.fix && <div className="text-xs mt-1 font-mono">Fix: {f.fix}</div>}
                    {f.box && (
                      <button
                        className="mt-2 text-[11px] underline font-mono"
                        onClick={() => setActiveBox(f.box)}
                      >Highlight</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-black/20 p-3 bg-white">
            <div className="text-xs text-black/60 font-mono mb-2">CLARITY BOOSTERS</div>
            {boosters.length === 0 ? (
              <div className="text-sm text-black/60 font-mono">No boosters identified</div>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {boosters.map((b: string, i: number) => <li key={i} className="font-mono">{b}</li>)}
              </ul>
            )}
          </div>

          <div className="border border-black/20 p-3 bg-white">
            <div className="text-xs text-black/60 font-mono mb-2">MISALIGNMENTS</div>
            {misalignments.length === 0 ? (
              <div className="text-sm text-black/60 font-mono">No misalignments detected</div>
            ) : (
              <div className="space-y-3">
                {misalignments.map((m: any, i: number) => (
                  <div key={i} className="border-l-2 border-yellow-600 pl-3">
                    <div className="text-sm font-semibold flex items-center justify-between">
                      <span>{m.statement}</span>
                      {typeof m.confidence === 'number' && (
                        <span className="text-[10px] text-black/60 font-mono">conf {Math.round(m.confidence * 100)}%</span>
                      )}
                    </div>
                    {Array.isArray(m.evidence) && m.evidence.length > 0 && (
                      <ul className="list-disc pl-5 text-xs mt-1">
                        {m.evidence.slice(0, 5).map((e: string, j: number) => (
                          <li key={j} className="font-mono">
                            <button className="underline" onClick={() => highlightByRef(e)}>{e}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {m.fix && <div className="text-xs mt-1 font-mono">Fix: {m.fix}</div>}
                    {m.box && (
                      <button
                        className="mt-2 text-[11px] underline font-mono"
                        onClick={() => setActiveBox(m.box)}
                      >Highlight</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-black/20 p-3 bg-white">
            <div className="text-xs text-black/60 font-mono mb-2">READABILITY</div>
            <div className="text-sm font-mono">Flesch-Kincaid: {a?.readability?.fleschKincaid ?? '—'}</div>
            {a?.readability?.level && (
              <div className="text-xs text-black/60 font-mono">Level: {a.readability.level}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 