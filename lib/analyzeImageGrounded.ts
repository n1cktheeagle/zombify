import { ExtractedData } from '@/lib/extractors/browserExtractor';

// Output schema for the grounded engine (intentionally aligned to requested MVP)
export interface GroundedAnalysisV1 {
  engineVersion: 'grounded-v1';
  model: string; // e.g., gpt-5-thinking
  goal: string;
  uiType: string;
  clarityScore: {
    overall: number;
    breakdown: {
      firstImpression: number;
      visualClarity: number;
      informationScent: number;
      alignment: number;
    };
  };
  highlights: Array<{
    title: string;
    insight: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    evidence: string[]; // IDs from FACTS
  }>;
  conversionFriction: Array<{
    stage: 'AWARENESS' | 'CONSIDERATION' | 'DECISION' | 'ACTION';
    problem: string;
    fix: string;
    evidence: string[]; // IDs from FACTS
  }>;
  accessibility: Array<{
    issue: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    evidence: string[]; // IDs from FACTS
  }>;
  hierarchy: {
    issues: Array<{ description: string; evidence: string[] }>; // IDs from FACTS
  };
  darkPatterns: Array<{ risk: 'LOW' | 'MEDIUM' | 'HIGH'; rationale: string; evidence: string[] }>;
  observedTexts: string[];
}

function sanitizeJsonBlock(content: string): string {
  let clean = content.trim();
  if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  else if (clean.startsWith('```')) clean = clean.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return clean;
}

function extractAndParseJSON(content: string): any {
  try {
    return JSON.parse(sanitizeJsonBlock(content));
  } catch {}
  const patterns = [
    /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i,
    /(\{[\s\S]*\})/,
    /(\[[\s\S]*\])/,
    /(?:here's|here is|the|json|result|analysis|response)[\s\S]*?(\{[\s\S]*\})/i,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) {
      const j = m[1] || m[0];
      try { return JSON.parse(j.trim()); } catch {}
    }
  }
  // Brace-balance from first '{'
  const open = content.indexOf('{');
  if (open !== -1) {
    let depth = 0, inStr = false, esc = false;
    for (let i = open; i < content.length; i++) {
      const ch = content[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (!inStr) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth === 0) {
          const str = content.substring(open, i + 1);
          try { return JSON.parse(str); } catch {}
          break;
        }
      }
    }
  }
  // Cleanup
  const jm = content.match(/\{[\s\S]*\}/);
  if (jm) {
    let s = jm[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    try { return JSON.parse(s); } catch {}
  }
  throw new Error('Could not extract valid JSON from response');
}

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
    if (typeof node === 'string') { if (node.trim()) parts.push(node); return; }
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (typeof node === 'object') {
      if (typeof node.text === 'string' && node.text.trim()) parts.push(node.text);
      if (node.text && typeof node.text === 'object' && typeof node.text.value === 'string' && node.text.value.trim()) parts.push(node.text.value);
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

type GroundedOptions = {
  uiType?: string;
  goalTag?: string;
  promptVersion?: string; // e.g., 2025-08-10-v1
};

// Build a compact PERCEPTION_JSON by enriching ExtractedData with derived metrics
function buildPerceptionJSON(extractedData?: ExtractedData) {
  if (!extractedData) return null;
  // Derived metrics
  const blocks = extractedData.text.blocks || [];
  const dims = extractedData.metadata?.dimensions;
  const sortedByY = [...blocks].filter(b => b.location).sort((a, b) => (a.location!.y - b.location!.y));
  const vGaps: number[] = [];
  for (let i = 1; i < sortedByY.length; i++) {
    const prev = sortedByY[i - 1].location!;
    const cur = sortedByY[i].location!;
    const prevBottom = prev.y + prev.h;
    const gap = Math.max(0, cur.y - prevBottom);
    vGaps.push(gap);
  }
  const medianVSpace = vGaps.length ? vGaps.sort((a, b) => a - b)[Math.floor(vGaps.length / 2)] : 0;
  // CTA-like detection from text (heuristic, but these become provided facts)
  const ctaKeywords = ['sign up','signup','log in','login','get started','start free','start trial','try free','buy','add to cart','checkout','subscribe','download','continue','next','submit','join'];
  const buttonCount = blocks
    .map(b => (b.text || '').toLowerCase())
    .filter(t => t && ctaKeywords.some(k => t.includes(k))).length;
  const perception = {
    ...extractedData,
    derived: {
      metrics: {
        medianVSpace,
      },
      layout: {
        buttonCount,
      },
      palette: extractedData.colors?.palette?.slice(0, 6)?.map(c => c.hex) || [],
      texts: blocks.slice(0, 50).map((b, i) => ({ id: `texts.t${i}`, text: b.text, approxSizePx: b.location ? Math.round(b.location.h) : null }))
    }
  };
  return perception;
}

// Render FACTS_TEXT as stable, line-based IDs
function buildFactsText(perception: any | null): string {
  if (!perception) return '';
  const lines: string[] = [];
  // texts
  const texts: Array<{ id: string; text: string; approxSizePx?: number | null }> = perception.derived?.texts || [];
  for (const t of texts) {
    const sizePart = typeof t.approxSizePx === 'number' && Number.isFinite(t.approxSizePx) ? ` size≈${t.approxSizePx}px` : '';
    lines.push(`[${t.id}] ${JSON.stringify(t.text)}${sizePart}`);
  }
  // contrast issues
  const contrastIssues = (perception.contrast?.issues || []).slice(0, 12);
  contrastIssues.forEach((c: any, idx: number) => {
    const id = `contrast.c${idx}`;
    lines.push(`[${id}] ${c.location || 'unknown'} ratio=${c.ratio} wcag=${c.wcagLevel}`);
  });
  // layout/buttonCount
  if (typeof perception.derived?.layout?.buttonCount === 'number') {
    lines.push(`[layout.buttonCount]=${perception.derived.layout.buttonCount}`);
  }
  // metrics/medianVSpace
  if (typeof perception.derived?.metrics?.medianVSpace === 'number') {
    lines.push(`[metrics.medianVSpace]=${perception.derived.metrics.medianVSpace}`);
  }
  // palette
  const palette = perception.derived?.palette || [];
  if (palette.length > 0) {
    lines.push(`[palette]=${palette.join(',')}`);
  }
  return lines.join('\n');
}

// Normalize WCAG level to our severity union type
function toSeverity(level: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  return level === 'FAIL' ? 'HIGH' : level === 'AA' ? 'MEDIUM' : 'LOW';
}

function buildGroundedPrompt({ promptVersion, uiType, goalTag, perception, facts }: { promptVersion: string; uiType: string; goalTag: string; perception: any; facts: string; }): { system: string; user: string } {
  const schemaBlock = `{
  "engineVersion": "clarity-v2",
  "model": "gpt-5-thinking",
  "goal": "<string>",
  "uiType": "<string>",
  "clarityScore": {
    "overall": 0,
    "breakdown": {
      "firstImpression": 0,
      "visualClarity": 0,
      "informationScent": 0,
      "alignment": 0
    }
  },
  "highlights": [
    { "title": "<string>", "insight": "<string>", "impact": "LOW|MEDIUM|HIGH", "evidence": ["<ID from FACTS>"] }
  ],
  "conversionFriction": [
    { "stage": "AWARENESS|CONSIDERATION|DECISION|ACTION", "problem": "<string>", "fix": "<string>", "evidence": ["<ID from FACTS>"] }
  ],
  "accessibility": [
    { "issue": "<string>", "severity": "LOW|MEDIUM|HIGH", "evidence": ["<ID from FACTS>"] }
  ],
  "hierarchy": {
    "issues": [ { "description": "<string>", "evidence": ["<ID from FACTS>"] } ]
  },
  "darkPatterns": [ { "risk": "LOW|MEDIUM|HIGH", "rationale": "<string>", "evidence": ["<ID from FACTS>"] } ],
  "observedTexts": ["<verbatim OCR text or empty>"]
}`;

  const system = `You are Zombify’s Grounded Interpreter.\nYou are blind to pixels and may only use facts present in PERCEPTION_JSON and FACTS.\nEvery claim must cite at least one evidence ID from FACTS.\nIf a claim lacks valid evidence IDs, omit it.\nDo not invent copy, counts, sizes, flows, or coordinates.\nReturn strict JSON that matches the provided schema. No prose, no markdown.`;

  const user = `PROMPT_VERSION: ${promptVersion}\nUI_TYPE: ${uiType}\nGOAL_TAG: ${goalTag}\n\nPERCEPTION_JSON:\n${JSON.stringify(perception, null, 2)}\n\nFACTS:\n${facts}\n\nSCHEMA:\n${schemaBlock}`;

  return { system, user };
}

export async function analyzeImageGrounded(
  imageUrl: string,
  userContext?: string,
  extractedData?: ExtractedData,
  options?: GroundedOptions
): Promise<GroundedAnalysisV1> {
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || undefined,
    project: process.env.OPENAI_PROJECT_ID || undefined,
  });

  // Prefer explicit grounded model env, then general model, then known good defaults
  const REQUIRED_MODEL = process.env.OPENAI_GROUNDED_MODEL
    || process.env.OPENAI_MODEL
    || process.env.OPENAI_VISION_FALLBACK_MODEL
    || process.env.OPENAI_VISION_MODEL
    || 'gpt-5';
  const FALLBACK_MODEL = process.env.OPENAI_GROUNDED_FALLBACK || 'gpt-5';

  async function respond(params: any) {
    try {
      return await openai.responses.create({ ...params, model: REQUIRED_MODEL });
    } catch (err: any) {
      const msg: string = err?.message || '';
      // Fallback if model missing or not available
      if (
        msg.includes('model_not_found') ||
        msg.includes('does not exist') ||
        msg.includes('The requested model') ||
        msg.includes('The model')
      ) {
        return await openai.responses.create({ ...params, model: FALLBACK_MODEL });
      }
      // Strip unknown/unsupported params and retry once with fallback too
      if (msg.includes('Unsupported parameter')) {
        const { text, input, max_output_tokens } = params || {};
        return await openai.responses.create({ text, input, max_output_tokens, model: FALLBACK_MODEL });
      }
      throw err;
    }
  }

  // Prepare inputs
  const perception = buildPerceptionJSON(extractedData);
  const factsText = buildFactsText(perception);
  const promptVersion = options?.promptVersion || new Date().toISOString().slice(0, 10) + '-v1';
  const uiType = options?.uiType || 'unknown';
  const goalTag = options?.goalTag || (userContext ? 'inferred' : 'unknown');

  const { system, user } = buildGroundedPrompt({ promptVersion, uiType, goalTag, perception, facts: factsText });

  const res = await respond({
    text: { format: { type: 'json_object' } },
    max_output_tokens: 2200,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: system },
          { type: 'input_text', text: user },
        ],
      },
    ],
  });

  const raw = responseToText(res);
  // Helper: deterministic grounded output from facts only
  const deterministicFromFacts = (): GroundedAnalysisV1 => {
    const texts = (extractedData?.text?.blocks || []).map(b => b.text).filter(Boolean).slice(0, 20);
    const contrastIssues = (extractedData?.contrast?.issues || []).slice(0, 6);
    const buttonCount = perception?.derived?.layout?.buttonCount || 0;
    const fails = contrastIssues.length;
    let base = 72;
    base -= fails * 6;
    if (buttonCount > 1) base -= 6;
    const overall = Math.max(0, Math.min(100, Math.round(base)));
    const accessibility = contrastIssues.map((c: any, i: number) => ({
      issue: `Contrast below AA at ${c.location || 'unknown'}`,
      severity: toSeverity(String(c.wcagLevel || '')),
      evidence: [`contrast.c${i}`],
    }));
    const highlights: any[] = [];
    if (fails > 0) {
      highlights.push({
        title: 'Low contrast detected',
        insight: 'Some text colors may be hard to read against their backgrounds.',
        impact: 'HIGH',
        evidence: ['contrast.c0'],
      });
    }
    const conversionFriction: any[] = [];
    if (buttonCount > 1) {
      conversionFriction.push({
        stage: 'ACTION',
        problem: 'Multiple action labels compete',
        fix: 'Present one primary action and reduce competing buttons.',
        evidence: ['layout.buttonCount'],
      });
    }
    const out: GroundedAnalysisV1 = {
      engineVersion: 'grounded-v1',
      model: (res as any)?.model || REQUIRED_MODEL,
      goal: goalTag,
      uiType,
      clarityScore: {
        overall,
        breakdown: {
          firstImpression: overall,
          visualClarity: Math.max(0, overall - (fails ? 5 : 0)),
          informationScent: overall,
          alignment: overall,
        },
      },
      highlights: highlights.slice(0, 5),
      conversionFriction: conversionFriction.slice(0, 6),
      accessibility: accessibility.slice(0, 6),
      hierarchy: { issues: [] },
      darkPatterns: [],
      observedTexts: texts,
    };
    return out;
  };

  if (!raw) {
    // Fall back to deterministic output so the UI always renders
    const out = deterministicFromFacts();
    // attach audits similar to clarity engine for UI parity
    if (extractedData?.contrast?.issues) {
      (out as any).contrastAudit = {
        fails: extractedData.contrast.issues.length,
        issues: extractedData.contrast.issues.map((i) => ({
          foreground: i.foreground,
          background: i.background,
          ratio: i.ratio,
          location: i.location,
          wcagLevel: i.wcagLevel,
          severity: i.severity,
        })).slice(0, 10),
      };
    }
    // readability quick calc
    const words = out.observedTexts.join(' ').trim().split(/\s+/).filter(Boolean);
    const sentences = out.observedTexts.join(' ').split(/[.!?]+/).filter((s) => s.trim());
    const syllables = words.reduce((acc, w) => acc + ((w.toLowerCase().match(/[aeiouy]{1,2}/g)?.length) || 1), 0);
    const fk = sentences.length > 0 && words.length > 0 ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length) : 0;
    (out as any).readability = {
      fleschKincaid: Math.max(0, Math.min(100, Math.round(fk))),
      level: fk > 60 ? 'Easy' : fk > 30 ? 'Standard' : 'Challenging',
      notes: [],
    };
    return out;
  }

  let parsed: any;
  try {
    parsed = extractAndParseJSON(raw);
  } catch (e) {
    // Retry once with only the SCHEMA and FACTS if parse fails
    const minimal = await respond({
      text: { format: { type: 'json_object' } },
      max_output_tokens: 1800,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: system },
            { type: 'input_text', text: `FACTS:\n${factsText}\n\nSCHEMA ONLY:\n${buildGroundedPrompt({ promptVersion, uiType, goalTag, perception: {}, facts: '' }).user.split('SCHEMA:\n')[1]}` },
          ],
        },
      ],
    });
    const retryText = responseToText(minimal);
    try {
      parsed = extractAndParseJSON(retryText);
    } catch {
      // Final fallback: build deterministic grounded output so UI doesn't fail
      const out = deterministicFromFacts();
      return out;
    }
  }

  // Minimal normalization & fallbacks
  const observedFallback = (extractedData?.text?.blocks || []).map(b => b.text).filter(Boolean).slice(0, 20);
  if (!Array.isArray(parsed.observedTexts)) parsed.observedTexts = observedFallback;
  if (!parsed.clarityScore) parsed.clarityScore = { overall: 0, breakdown: { firstImpression: 0, visualClarity: 0, informationScent: 0, alignment: 0 } };
  const coerce = (v: any): number => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  parsed.clarityScore.overall = coerce(parsed.clarityScore.overall);
  parsed.clarityScore.breakdown = parsed.clarityScore.breakdown || {};
  parsed.clarityScore.breakdown.firstImpression = coerce(parsed.clarityScore.breakdown.firstImpression);
  parsed.clarityScore.breakdown.visualClarity = coerce(parsed.clarityScore.breakdown.visualClarity);
  parsed.clarityScore.breakdown.informationScent = coerce(parsed.clarityScore.breakdown.informationScent);
  parsed.clarityScore.breakdown.alignment = coerce(parsed.clarityScore.breakdown.alignment);

  // Force required identifiers for compatibility
  parsed.engineVersion = 'grounded-v1';
  parsed.model = (res as any)?.model || REQUIRED_MODEL;
  parsed.goal = parsed.goal || (options?.goalTag || 'unknown');
  parsed.uiType = parsed.uiType || (options?.uiType || 'unknown');

  // Attach audits for UI parity
  if (extractedData?.contrast?.issues) {
    (parsed as any).contrastAudit = {
      fails: extractedData.contrast.issues.length,
      issues: extractedData.contrast.issues.map((i) => ({
        foreground: i.foreground,
        background: i.background,
        ratio: i.ratio,
        location: i.location,
        wcagLevel: i.wcagLevel,
        severity: i.severity,
      })).slice(0, 10),
    };
  }

  // Readability fallback
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
      notes: [],
    };
  }

  return parsed as GroundedAnalysisV1;
}


