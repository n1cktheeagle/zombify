import { ExtractedData } from '@/lib/extractors/browserExtractor';
import type { HeatmapData } from '@/lib/heatmap/attentionInsight';

// Minimal type for clarity engine; avoid coupling to existing ZombifyAnalysis
export interface ClarityIssueFinding {
  issue: string;
  evidence: string[]; // strictly observed text/visual cues
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  fix: string; // specific, visual-only change
  confidence?: number; // 0..1
  box?: { x: number; y: number; width: number; height: number }; // percentages 0..100
}

export interface ClarityScoreBreakdown {
  firstImpression: number;
  visualClarity: number;
  informationScent: number;
  alignment: number; // intent vs UI
}

export interface ClarityAnalysisV2 {
  engineVersion: 'clarity-v2';
  model: string;
  imageUrl: string;
  clarityScore: { overall: number; breakdown: ClarityScoreBreakdown };
  confusionFindings: ClarityIssueFinding[]; // things that reduce understanding
  clarityBoosters: string[]; // what already helps clarity
  misalignments: Array<{
    statement: string; // misalignment between likely intent and the UI
    evidence: string[];
    fix: string;
    confidence?: number;
    box?: { x: number; y: number; width: number; height: number }; // percentages 0..100
  }>;
  observedTexts: string[]; // raw text snippets actually visible
  dominantColors?: string[];
  userContext?: string;
  // Added summaries
  saliency?: {
    clarityScore?: number;
    attentionPercentages?: Array<{ region: string; percentage: number; x?: number; y?: number; width?: number; height?: number }>
  };
  contrastAudit?: {
    fails: number;
    issues: Array<{ foreground: string; background: string; ratio: number; location: string; wcagLevel: string; severity: string }>
  };
  readability?: { fleschKincaid: number; level: string; notes: string[] };
  timestamp: string;
}

function sanitizeJsonBlock(content: string): string {
  let clean = content.trim();
  if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  else if (clean.startsWith('```')) clean = clean.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return clean;
}

// Robust JSON extractor inspired by classic analyzer's helper
function extractAndParseJSON(content: string): any {
  // 1) Try direct parse (with lightweight fence cleanup)
  try {
    return JSON.parse(sanitizeJsonBlock(content));
  } catch {}

  // 2) Regex-based extractions
  const patterns = [
    /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i,
    /(\{[\s\S]*\})/,
    /(\[[\s\S]*\])/,
    /(?:here's|here is|the|json|result|analysis|response)[\s\S]*?(\{[\s\S]*\})/i
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const jsonStr = match[1] || match[0];
      try {
        return JSON.parse(jsonStr.trim());
      } catch {}
    }
  }

  // 3) Brace balancing from first '{'
  const open = content.indexOf('{');
  if (open !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = open; i < content.length; i++) {
      const ch = content[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth === 0) {
          const jsonStr = content.substring(open, i + 1);
          try {
            return JSON.parse(jsonStr);
          } catch {}
          break;
        }
      }
    }
  }

  // 4) Cleanup common issues and retry
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let jsonStr = jsonMatch[0];
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    try {
      return JSON.parse(jsonStr);
    } catch {}
  }

  throw new Error('Could not extract valid JSON from response');
}

// Extract a best-effort text from Responses API result
function responseToText(res: any): string {
  if (res && typeof res.output_text === 'string' && res.output_text.trim()) {
    return res.output_text as string;
  }
  const roots: any[] = [];
  if (Array.isArray(res?.output)) roots.push(res.output);
  if (Array.isArray(res?.data)) roots.push(res.data);
  const parts: string[] = [];
  const visit = (node: any) => {
    if (!node) return;
    if (typeof node === 'string') {
      if (node.trim()) parts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === 'object') {
      if (typeof node.text === 'string' && node.text.trim()) parts.push(node.text);
      if (typeof node.output_text === 'string' && node.output_text.trim()) parts.push(node.output_text);
      if (typeof node.value === 'string' && node.value.trim()) parts.push(node.value);
      if (typeof node.message === 'string' && node.message.trim()) parts.push(node.message);
      if (node.content) visit(node.content);
      if (node.output) visit(node.output);
      if (node.data) visit(node.data);
    }
  };
  roots.forEach(visit);
  return parts.join('\n').trim();
}

export async function analyzeImageClarity(
  imageUrl: string,
  userContext?: string,
  extractedData?: ExtractedData,
  heatmapData?: HeatmapData
): Promise<ClarityAnalysisV2> {
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || undefined,
    project: process.env.OPENAI_PROJECT_ID || undefined
  });
  const REQUIRED_MODEL = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-5';

  async function respond(params: any) {
    // Hard-require GPT-5 Vision via Responses API; no fallback
    return await openai.responses.create({ ...params, model: REQUIRED_MODEL });
  }

  const visibleTextHint = extractedData?.text?.blocks?.map(b => b.text).filter(Boolean).slice(0, 50) || [];
  const domColorsHint = extractedData?.colors?.palette?.map((c) => c.hex).slice(0, 6) || [];
  const contrastIssues = extractedData?.contrast?.issues || [];

  const prompt = `You are a no-hallucination UI clarity auditor. Analyze ONLY what is visible in the provided static image. Use short, precise language.
Rules:
- Do not infer flows, states, or data that are not explicitly visible.
- Ground every finding in visible evidence (text, hierarchy, color, grouping).
- Prefer actionable fixes in the user's language, 1 sentence each.
- If uncertain, return confidence < 0.5 and/or say "INSUFFICIENT EVIDENCE".
- When possible, include a 'box' for each finding as percentages of the image (x, y = center; width, height) to pinpoint the region.
- Keep output concise. HARD LIMITS: confusionFindings ≤ 6 items; misalignments ≤ 4 items; clarityBoosters ≤ 6 items; observedTexts ≤ 20 items.
- Do NOT include hidden step-by-step reasoning. Produce only the final JSON.

Add-on mode (augment, don't replace):
- Preserve existing base fields exactly as defined below. Only APPEND a top-level key "extensions" with the additive sections specified after the base schema.
- No hallucinations. If not visually verifiable, use null or [].
- Stable ids: if you create ids, use deterministic e1, e2..., g1, g2... and reuse them consistently.

If provided, consider this user intent/context only for alignment checks, not to invent elements:
${userContext ? `USER_CONTEXT: ${userContext.slice(0, 300)}` : 'USER_CONTEXT: NONE'}

Hints (optional, from OCR/colors/contrast/attention):
OCR_TEXT_SAMPLES: ${JSON.stringify(visibleTextHint)}
DOMINANT_COLORS: ${JSON.stringify(domColorsHint)}
CONTRAST_FAILS: ${JSON.stringify(contrastIssues.slice(0, 5))}
ATTENTION_TOP: ${JSON.stringify(heatmapData?.attentionPercentages?.slice(0, 5) || [])}

Return strict JSON matching exactly this base schema (unchanged) PLUS an additional top-level "extensions" object:
{
  "engineVersion": "clarity-v2",
  "model": "gpt-5",
  "imageUrl": "<string>",
  "clarityScore": {
    "overall": 0,
    "breakdown": {
      "firstImpression": 0,
      "visualClarity": 0,
      "informationScent": 0,
      "alignment": 0
    }
  },
  "confusionFindings": [
    {"issue": "<string>", "evidence": ["<visible text or visual cue>"], "impact": "LOW|MEDIUM|HIGH", "fix": "<specific change>", "confidence": 0.0, "box": {"x": 0, "y": 0, "width": 0, "height": 0}}
  ],
  "clarityBoosters": ["<string>"],
  "misalignments": [
    {"statement": "<string>", "evidence": ["<visible cue>"], "fix": "<specific change>", "confidence": 0.0, "box": {"x": 0, "y": 0, "width": 0, "height": 0}}
  ],
  "observedTexts": ["<exact visible text snippets>"],
  "extensions": {
    "meta": {
      "version": "clarity-augment-1.0",
      "notes": ["visual evidence only", "additive mode: do not modify base fields"]
    },
    "inventory": { "groups": [], "elements": [] },
    "perception": {
      "attention_anchors": [],
      "scan_path_order": [],
      "balance": { "left": 0, "center": 0, "right": 0, "top": 0, "bottom": 0 },
      "whitespace_ratio": null
    },
    "clarity": {
      "copy": { "avg_line_len_chars": null, "paragraph_chunking": null, "jargon_flags": [] },
      "grouping_alignment": []
    },
    "conversion": {
      "primary_cta": { "element_id": null, "label": null, "group_label": null, "competition_count_same_tier": null },
      "path_ambiguity": { "count": 0, "examples": [] },
      "form_friction": []
    },
    "ethics": { "risk_overall": null, "findings": [] },
    "accessibility": { "contrast_checks": [], "touch_target_risks": [], "icon_only_controls": [] },
    "consistency": { "palette": [], "typography": [], "iconography": { "mixed_styles_flag": null, "evidence": null } },
    "aesthetic": { "style_tags": [], "mood_tags": [] },
    "scores": {
      "grip_score": { "value": null, "weights": { "cta_salience": 0.3, "scan_path_efficiency": 0.25, "copy_clarity": 0.2, "clutter_density": 0.15, "contrast_legibility": 0.1 }, "top_evidence": [] },
      "zombie_mass_appeal": { "value": null, "weights": { "anchor_strength": 0.35, "decision_simplicity": 0.25, "legibility": 0.2, "path_directness": 0.2 }, "top_evidence": [] }
    },
    "recommendations": []
  }
}`;

  const minimalPrompt = `Return STRICT JSON per the schema. Keep lists short and DO NOT modify base fields. Append only the 'extensions' object with concise, evidence-based content.`;

  const res = await respond({
    text: { format: { type: 'json_object' } },
    reasoning: { effort: 'low' },
    max_output_tokens: 3200,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          { type: 'input_image', image_url: imageUrl, detail: 'high' }
        ]
      }
    ]
  });

  let raw = responseToText(res);
  // Retry once with minimal prompt if incomplete or empty
  const isIncomplete = (res as any)?.status === 'incomplete' || !raw;
  if (isIncomplete) {
    const retry = await respond({
      text: { format: { type: 'json_object' } },
      reasoning: { effort: 'low' },
      max_output_tokens: 1800,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: minimalPrompt },
            { type: 'input_image', image_url: imageUrl, detail: 'high' }
          ]
        }
      ]
    });
    raw = responseToText(retry);
  }

  if (!raw || typeof raw !== 'string') {
    console.error('[CLARITY] Empty response received. Full object:', res);
    throw new Error('Clarity engine returned empty response');
  }

  let parsed: any;
  try {
    parsed = extractAndParseJSON(raw);
  } catch (e) {
    console.error('[CLARITY] JSON parse failed. Raw content:', raw);
    throw new Error('Clarity engine returned invalid JSON');
  }

  // Minimal validation and normalization
  if (parsed.engineVersion !== 'clarity-v2') parsed.engineVersion = 'clarity-v2';
  parsed.model = REQUIRED_MODEL;
  parsed.imageUrl = imageUrl;
  if (!parsed.observedTexts) parsed.observedTexts = visibleTextHint;
  if (!parsed.clarityScore) parsed.clarityScore = { overall: 0, breakdown: { firstImpression: 0, visualClarity: 0, informationScent: 0, alignment: 0 } };
  if (!Array.isArray(parsed.confusionFindings)) parsed.confusionFindings = [];
  if (!Array.isArray(parsed.clarityBoosters)) parsed.clarityBoosters = [];
  if (!Array.isArray(parsed.misalignments)) parsed.misalignments = [];

  // Coerce numeric score fields to numbers and clamp ranges
  const coerce = (v: any): number => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  if (parsed.clarityScore) {
    parsed.clarityScore.overall = coerce(parsed.clarityScore.overall);
    parsed.clarityScore.breakdown = parsed.clarityScore.breakdown || {};
    parsed.clarityScore.breakdown.firstImpression = coerce(parsed.clarityScore.breakdown.firstImpression);
    parsed.clarityScore.breakdown.visualClarity = coerce(parsed.clarityScore.breakdown.visualClarity);
    parsed.clarityScore.breakdown.informationScent = coerce(parsed.clarityScore.breakdown.informationScent);
    parsed.clarityScore.breakdown.alignment = coerce(parsed.clarityScore.breakdown.alignment);
  }

  // Add saliency from heatmap
  if (heatmapData) {
    parsed.saliency = {
      clarityScore: heatmapData.clarityScore,
      attentionPercentages: heatmapData.attentionPercentages
    };
  }

  // Add contrast audit summary from extracted data
  if (extractedData?.contrast?.issues) {
    parsed.contrastAudit = {
      fails: extractedData.contrast.issues.length,
      issues: extractedData.contrast.issues.map((i) => ({
        foreground: i.foreground,
        background: i.background,
        ratio: i.ratio,
        location: i.location,
        wcagLevel: i.wcagLevel,
        severity: i.severity
      })).slice(0, 10)
    };
  }

  // Basic readability summary from observed text (rough fallback if model omits)
  if (!parsed.readability) {
    const text = (parsed.observedTexts || []).join(' ').slice(0, 5000);
    const words: string[] = text.trim().split(/\s+/).filter(Boolean) as string[];
    const sentences: string[] = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0) as string[];
    const syllables = words.reduce((acc: number, w: string) => acc + (w.toLowerCase().match(/[aeiouy]{1,2}/g)?.length || 1), 0);
    const fk = sentences.length > 0 && words.length > 0
      ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
      : 0;
    parsed.readability = {
      fleschKincaid: Math.max(0, Math.min(100, Math.round(fk))),
      level: fk > 60 ? 'Easy' : fk > 30 ? 'Standard' : 'Challenging',
      notes: []
    };
  }

  // ADDITIVE: Build extensions block without altering existing fields
  const safeAvgLineLength = (() => {
    const lines = (parsed.observedTexts || []).map((t: string) => (t || '').trim()).filter(Boolean);
    if (lines.length === 0) return null;
    const avg = Math.round(lines.reduce((a: number, b: string) => a + b.length, 0) / lines.length);
    return Number.isFinite(avg) ? avg : null;
  })();

  const defaultExtensions = {
    meta: {
      version: 'clarity-augment-1.0',
      notes: ['visual evidence only', 'additive mode: do not modify base fields'] as string[],
    },
    inventory: { groups: [] as any[], elements: [] as any[] },
    perception: {
      attention_anchors: [] as any[],
      scan_path_order: [] as string[],
      balance: { left: 0, center: 0, right: 0, top: 0, bottom: 0 },
      whitespace_ratio: null as number | null,
    },
    clarity: {
      copy: { avg_line_len_chars: safeAvgLineLength, paragraph_chunking: null as null | string, jargon_flags: [] as any[] },
      grouping_alignment: [] as any[],
    },
    conversion: {
      primary_cta: { element_id: null as string | null, label: null as string | null, group_label: null as string | null, competition_count_same_tier: null as number | null },
      path_ambiguity: { count: 0, examples: [] as string[] },
      form_friction: [] as any[],
    },
    ethics: { risk_overall: null as 'LOW' | 'MEDIUM' | 'HIGH' | null, findings: [] as any[] },
    accessibility: { contrast_checks: [] as any[], touch_target_risks: [] as any[], icon_only_controls: [] as any[] },
    consistency: {
      palette: (extractedData?.colors?.palette || []).slice(0, 6).map((c) => ({ hex: c.hex, role_guess: null })) as any[],
      typography: [] as any[],
      iconography: { mixed_styles_flag: null as boolean | null, evidence: null as string | null },
    },
    aesthetic: { style_tags: [] as string[], mood_tags: [] as string[] },
    scores: {
      grip_score: { value: null as number | null, weights: { cta_salience: 0.3, scan_path_efficiency: 0.25, copy_clarity: 0.2, clutter_density: 0.15, contrast_legibility: 0.1 }, top_evidence: [] as string[] },
      zombie_mass_appeal: { value: null as number | null, weights: { anchor_strength: 0.35, decision_simplicity: 0.25, legibility: 0.2, path_directness: 0.2 }, top_evidence: [] as string[] },
    },
    recommendations: [] as any[],
  };

  // Populate contrast checks from extracted data (visual-only, deterministic)
  try {
    const issues = extractedData?.contrast?.issues || [];
    if (issues.length > 0) {
      defaultExtensions.accessibility.contrast_checks = issues.slice(0, 8).map((i) => {
        const ratioNum = typeof i.ratio === 'number' ? i.ratio : parseFloat(String(i.ratio));
        const wcagFlag = Number.isFinite(ratioNum) ? (ratioNum >= 4.5 ? 'PASS' : ratioNum >= 3 ? 'WARN' : 'FAIL') : 'WARN';
        return {
          element_id: null,
          fg_hex: i.foreground,
          bg_hex: i.background,
          ratio_est: Number.isFinite(ratioNum) ? Number(ratioNum.toFixed(2)) : 0,
          wcag_flag: wcagFlag
        };
      });
    }
  } catch {}

  // Populate inventory from OCR blocks if available (evidence-bound)
  try {
    const dims = extractedData?.metadata?.dimensions;
    const widthPx: number | undefined = dims?.width;
    const heightPx: number | undefined = dims?.height;
    const blocks = extractedData?.text?.blocks || [];
    if (widthPx && heightPx && blocks.length > 0) {
      // Single main group covering full image
      defaultExtensions.inventory.groups = [
        { id: 'g1', label: 'main', bbox: [0, 0, 100, 100] }
      ];
      // Map text blocks to simple elements
      const toPct = (loc: { x: number; y: number; w: number; h: number }) => {
        const px = (loc.x / widthPx) * 100;
        const py = (loc.y / heightPx) * 100;
        const pw = (loc.w / widthPx) * 100;
        const ph = (loc.h / heightPx) * 100;
        return [Math.max(0, Math.min(100, px)), Math.max(0, Math.min(100, py)), Math.max(0, Math.min(100, pw)), Math.max(0, Math.min(100, ph))];
      };
      const elements = blocks.slice(0, 80).map((b, idx: number) => {
        const id = `e${idx + 1}`;
        const bbox = b.location ? toPct({ x: b.location.x, y: b.location.y, w: b.location.w, h: b.location.h }) : [0, 0, 0, 0];
        return {
          id,
          group_id: 'g1',
          type: 'other',
          text: b.text || null,
          bbox,
          is_click_affordance: false,
          role_guess: null
        };
      });
      defaultExtensions.inventory.elements = elements;

      // Heuristic perception anchors: top 3-5 by area
      const withArea = elements
        .map((el: any) => ({ el, area: (el.bbox?.[2] || 0) * (el.bbox?.[3] || 0) }))
        .sort((a: any, b: any) => b.area - a.area)
        .slice(0, 5);
      defaultExtensions.perception.attention_anchors = withArea
        .filter((x: any) => x.area > 0)
        .map((x: any) => ({ element_id: x.el.id, reason: 'size', confidence: 0.6 }));

      // Heuristic scan path: first 3-6 by reading order (top to bottom, then left)
      const sorted = [...elements].sort((a: any, b: any) => (a.bbox?.[1] ?? 0) - (b.bbox?.[1] ?? 0) || (a.bbox?.[0] ?? 0) - (b.bbox?.[0] ?? 0));
      defaultExtensions.perception.scan_path_order = sorted.slice(0, 6).map((e: any) => e.id);

      // Heuristic balance (left/center/right & top/bottom)
      const centers = elements.map((el: any) => ({
        cx: (el.bbox?.[0] ?? 0) + (el.bbox?.[2] ?? 0) / 2,
        cy: (el.bbox?.[1] ?? 0) + (el.bbox?.[3] ?? 0) / 2,
      }));
      const total = Math.max(1, centers.length);
      const left = centers.filter(c => c.cx < 33.33).length / total;
      const center = centers.filter(c => c.cx >= 33.33 && c.cx <= 66.66).length / total;
      const right = centers.filter(c => c.cx > 66.66).length / total;
      const top = centers.filter(c => c.cy < 50).length / total;
      const bottom = centers.filter(c => c.cy >= 50).length / total;
      defaultExtensions.perception.balance = { left, center, right, top, bottom };

      // Accessibility: touch target risks < ~44x44 px
      const pxThreshold = 44;
      defaultExtensions.accessibility.touch_target_risks = elements
        .map((el: any) => {
          const pw = (el.bbox?.[2] ?? 0) * (widthPx / 100);
          const ph = (el.bbox?.[3] ?? 0) * (heightPx / 100);
          return { element_id: el.id, size: [Math.round(pw), Math.round(ph)], flag: (pw < pxThreshold || ph < pxThreshold) ? 'UNDER_MIN' : null };
        })
        .filter((r: any) => r.flag === 'UNDER_MIN')
        .slice(0, 10);

      // Conversion: detect CTA-like labels
      const ctaKeywords = ['sign up','signup','log in','login','get started','start free','start trial','try free','buy','add to cart','checkout','subscribe','download','continue','next','submit','join'];
      const ctaCandidates = elements
        .map((el: any) => ({ el, text: (el.text || '').toLowerCase() }))
        .filter((x: any) => x.text && ctaKeywords.some(k => x.text.includes(k)));
      if (ctaCandidates.length > 0) {
        const primary = ctaCandidates[0].el;
        defaultExtensions.conversion.primary_cta = {
          element_id: primary.id,
          label: primary.text || null,
          group_label: 'main',
          competition_count_same_tier: Math.max(0, ctaCandidates.length - 1)
        } as any;
      }

      // Consistency: simple typography impressions based on block lengths
      const sampleTypos = elements
        .filter((el: any) => typeof el.text === 'string' && el.text.trim().length > 0)
        .slice(0, 8)
        .map((el: any) => {
          const t = (el.text as string).trim();
          const role = t.length > 40 ? 'Body' : t.length > 20 ? 'H3' : 'H2';
          const style_hint = t.length > 40 ? 'regular' : 'bold';
          return { role, style_hint, example_text: t.slice(0, 60) };
        });
      if (sampleTypos.length > 0) {
        defaultExtensions.consistency.typography = sampleTypos;
      }

      // Recommendations (evidence-bound): contrast and touch targets
      const recs: any[] = [];
      if (defaultExtensions.accessibility.contrast_checks.length > 0) {
        recs.push({
          issue: 'Low contrast risks on key text',
          evidence: defaultExtensions.accessibility.contrast_checks.slice(0, 2).map((c: any) => `${c.fg_hex} on ${c.bg_hex} ~${c.ratio_est}:1`),
          action: 'Increase color contrast to meet WCAG 4.5:1 for body text (or 3:1 for large text)',
          expected_effect: 'Improved legibility and accessibility'
        });
      }
      if (defaultExtensions.accessibility.touch_target_risks.length > 0) {
        recs.push({
          issue: 'Touch targets appear smaller than ~44×44 px',
          evidence: defaultExtensions.accessibility.touch_target_risks.slice(0, 3).map((t: any) => t.element_id),
          action: 'Increase control size or padding to meet minimum touch area',
          expected_effect: 'Reduced mis-taps and better mobile usability'
        });
      }
      if (defaultExtensions.conversion.primary_cta.element_id && defaultExtensions.conversion.primary_cta.competition_count_same_tier && defaultExtensions.conversion.primary_cta.competition_count_same_tier > 1) {
        recs.push({
          issue: 'Multiple competing CTAs at similar weight',
          evidence: ctaCandidates.slice(0, 3).map((c: any) => c.el.id),
          action: 'Emphasize a single primary CTA and downplay secondary actions',
          expected_effect: 'Clearer path to action and higher conversion focus'
        });
      }
      if (recs.length > 0) defaultExtensions.recommendations = recs.slice(0, 10);
    } else if (Array.isArray(parsed?.observedTexts) && parsed.observedTexts.length > 0) {
      // Fallback: build minimal inventory from observed texts when OCR blocks are absent
      defaultExtensions.inventory.groups = [{ id: 'g1', label: 'main', bbox: [0, 0, 100, 100] }];
      defaultExtensions.inventory.elements = parsed.observedTexts.slice(0, 20).map((t: string, idx: number) => ({
        id: `e${idx + 1}`,
        group_id: 'g1',
        type: 'other',
        text: t,
        bbox: [0, 0, 0, 0],
        is_click_affordance: false,
        role_guess: null
      }));
      defaultExtensions.perception.scan_path_order = defaultExtensions.inventory.elements.slice(0, 6).map((e: any) => e.id);
    }
  } catch {}

  // Merge without overwriting any pre-existing extensions content
  const existingExtensions = parsed.extensions && typeof parsed.extensions === 'object' ? parsed.extensions : {};
  const preferNonEmptyMerge = (defVal: any, exVal: any): any => {
    // If existing value is meaningfully populated, use it; otherwise keep default
    if (Array.isArray(defVal)) {
      return Array.isArray(exVal) && exVal.length > 0 ? exVal : defVal;
    }
    if (defVal && typeof defVal === 'object') {
      const out: any = { ...defVal };
      if (exVal && typeof exVal === 'object') {
        for (const k of Object.keys(defVal)) {
          out[k] = preferNonEmptyMerge(defVal[k], exVal[k]);
        }
      }
      return out;
    }
    // primitives
    return exVal !== undefined && exVal !== null ? exVal : defVal;
  };
  const mergedExtensions: any = preferNonEmptyMerge(defaultExtensions, existingExtensions);

  parsed.extensions = mergedExtensions;

  const result: ClarityAnalysisV2 = {
    ...parsed,
    userContext,
    timestamp: new Date().toISOString()
  };

  return result;
}
