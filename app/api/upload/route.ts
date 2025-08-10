import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImage } from '@/lib/analyzeImage';
import { analyzeImageClarity } from '@/lib/analyzeImageClarity';
import { analyzeImageGrounded } from '@/lib/analyzeImageGrounded';
import { ZombifyAnalysis } from '@/types/analysis';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isGuest = formData.get('is_guest') === 'true';
    const userContext = formData.get('user_context') as string | null;
    const engine = (formData.get('engine') as string | null) || 'classic';

    const extractedDataStr = formData.get('extractedData') as string | null;
    const extractedData = extractedDataStr ? JSON.parse(extractedDataStr) : null;
    const heatmapDataStr = formData.get('heatmapData') as string | null;
    const heatmapData = heatmapDataStr ? JSON.parse(heatmapDataStr) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const id = uuidv4();
    const filename = `${id}.png`;

    // Validate env for storage URL
    const publicUrlBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!publicUrlBase) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json({ error: 'Server misconfigured: storage URL missing' }, { status: 500 });
    }

    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/png',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload to storage failed', details: uploadError.message }, { status: 500 });
    }

    const imageUrl = `${publicUrlBase}/storage/v1/object/public/screenshots/${filename}`;

    console.log('Getting analysis for:', imageUrl, 'engine:', engine, 'user context:', userContext?.substring(0, 50));
    console.log('Using extracted data:', extractedData ? 'YES' : 'NO');
    if (extractedData) {
      const blockCount = extractedData?.text?.blocks?.length || 0;
      const paletteCount = extractedData?.colors?.palette?.length || 0;
      const dims = extractedData?.metadata?.dimensions || {};
      console.log(`[EXTRACTED] blocks=${blockCount}, palette=${paletteCount}, dims=${dims.width}x${dims.height}`);
    }
    console.log('Using heatmap data:', heatmapData ? 'YES' : 'NO');

    let analysis: any;
    if (engine === 'clarity') {
      analysis = await analyzeImageClarity(imageUrl, userContext || undefined, extractedData, heatmapData || undefined);
    } else if (engine === 'grounded') {
      analysis = await analyzeImageGrounded(imageUrl, userContext || undefined, extractedData || undefined, {
        uiType: 'unknown',
        goalTag: 'unknown',
        promptVersion: new Date().toISOString().slice(0, 10) + '-v1'
      });
    } else {
      analysis = await analyzeImage(imageUrl, userContext || undefined, extractedData, heatmapData);
    }

    // Diagnostic: extensions summary
    try {
      const ext = analysis?.extensions;
      if (ext) {
        console.log('[EXTENSIONS] inventory elements:', Array.isArray(ext?.inventory?.elements) ? ext.inventory.elements.length : 0);
        console.log('[EXTENSIONS] contrast_checks:', Array.isArray(ext?.accessibility?.contrast_checks) ? ext.accessibility.contrast_checks.length : 0);
        console.log('[EXTENSIONS] attention anchors:', Array.isArray(ext?.perception?.attention_anchors) ? ext.perception.attention_anchors.length : 0);
      } else {
        console.warn('[EXTENSIONS] extensions missing on analysis');
      }
    } catch (e) {
      console.warn('[EXTENSIONS] diagnostics failed:', e);
    }

    // Attach precise boxes from OCR if available (maps evidence → text blocks)
    try {
      const blocks: Array<{ text: string; confidence: number; location?: { x: number; y: number; w: number; h: number } }>
        = extractedData?.text?.blocks || [];
      const dims = extractedData?.metadata?.dimensions;
      const widthPx: number | undefined = dims?.width;
      const heightPx: number | undefined = dims?.height;
      if (blocks.length > 0 && widthPx && heightPx) {
        const toPercentBox = (loc: { x: number; y: number; w: number; h: number }) => {
          const cx = ((loc.x + loc.w / 2) / widthPx) * 100;
          const cy = ((loc.y + loc.h / 2) / heightPx) * 100;
          const pw = (loc.w / widthPx) * 100;
          const ph = (loc.h / heightPx) * 100;
          return {
            x: Math.max(0, Math.min(100, cx)),
            y: Math.max(0, Math.min(100, cy)),
            width: Math.max(0, Math.min(100, pw)),
            height: Math.max(0, Math.min(100, ph))
          };
        };
        const findBestBlock = (evidenceList: any[]): { box?: { x: number; y: number; width: number; height: number }, confidence?: number } | null => {
          if (!Array.isArray(evidenceList) || evidenceList.length === 0) return null;
          let best: { score: number; block: any } | null = null;
          for (const evRaw of evidenceList) {
            const ev = typeof evRaw === 'string' ? evRaw.toLowerCase() : '';
            if (!ev) continue;
            for (const b of blocks) {
              const t = (b.text || '').toLowerCase();
              if (!t) continue;
              if (t.includes(ev) || ev.includes(t)) {
                const score = (ev.length / Math.max(1, t.length)) * (b.confidence || 1);
                if (!best || score > best.score) best = { score, block: b };
              }
            }
          }
          if (best && best.block?.location) {
            return { box: toPercentBox({ x: best.block.location.x, y: best.block.location.y, w: best.block.location.w, h: best.block.location.h }), confidence: best.block.confidence };
          }
          return null;
        };

        const applyBoxes = (items?: any[]) => {
          if (!Array.isArray(items)) return;
          for (const it of items) {
            if (it?.box && typeof it.box.x === 'number') continue; // keep GPT box if present
            const mapped = findBestBlock(it?.evidence || []);
            if (mapped?.box) {
              it.box = mapped.box;
              if (typeof mapped.confidence === 'number') {
                it.confidence = Math.max(it.confidence || 0, Math.min(1, mapped.confidence / 100));
              }
            }
          }
        };

        applyBoxes(analysis?.confusionFindings);
        applyBoxes(analysis?.misalignments);
      }
    } catch (e) {
      console.warn('Box refinement from OCR failed (non-fatal):', e);
    }

    const authenticatedUser = session?.user;
    const finalUserId = authenticatedUser?.id || null;
    const finalIsGuest = !authenticatedUser || isGuest;

    const topIssues = (() => {
      if (analysis?.issuesAndFixes || analysis?.usabilityIssues) {
        return [
          ...(analysis.issuesAndFixes || []).map((i: any) => i.issue),
          ...(analysis.usabilityIssues || []).map((i: any) => i.issue)
        ].slice(0, 5);
      }
      if (analysis?.confusionFindings) {
        return (analysis.confusionFindings as any[]).slice(0, 5).map((f: any) => f.issue);
      }
      return [];
    })();

    // Normalize score to integer 0–100
    const rawScore = (analysis?.gripScore?.overall ?? analysis?.clarityScore?.overall ?? 0);
    let numericScore = typeof rawScore === 'string' ? parseFloat(rawScore) : Number(rawScore);
    if (!isFinite(numericScore)) numericScore = 0;
    // If model returns 0..1, scale up
    if (numericScore > 0 && numericScore <= 1) numericScore = numericScore * 100;
    // Clamp and round
    const safeScore = Math.max(0, Math.min(100, Math.round(numericScore)));

    const feedbackData = {
      id,
      image_url: imageUrl,
      score: safeScore,
      issues: topIssues,
      analysis: analysis,
      user_id: finalUserId,
      is_guest: finalIsGuest,
      chain_id: uuidv4(),
      created_at: new Date().toISOString(),
      original_filename: file.name,
    };

    const { error: insertError } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select('*');

    if (insertError) {
      console.error('DB insert error:', insertError);
      return NextResponse.json({ error: 'Database insert failed', details: insertError.message }, { status: 500 });
    }

    const { data: verifyData, error: verifyError } = await supabase
      .from('feedback')
      .select('id')
      .eq('id', id)
      .single();

    if (verifyError || !verifyData) {
      console.error('Record not found after insert:', { verifyError, verifyData });
      return NextResponse.json({ error: 'Record insert verification failed', details: verifyError?.message }, { status: 500 });
    }

    if (authenticatedUser && !finalIsGuest) {
      const { error: incrementError } = await supabase.rpc('increment_feedback_count', { user_uuid: authenticatedUser.id });
      if (incrementError) console.error('Error incrementing feedback count:', incrementError);
    }

    const redirectUrl = engine === 'clarity' || engine === 'grounded' ? `/feedback-v2/${id}` : `/feedback/${id}`;

    return NextResponse.json({ 
      success: true, 
      feedbackId: id,
      redirectUrl,
      analysisPreview: {
        engine,
        score: analysis?.gripScore?.overall || analysis?.clarityScore?.overall || 0,
        topIssueCount: topIssues.length
      }
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return NextResponse.json({ 
      error: 'Unexpected server error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}