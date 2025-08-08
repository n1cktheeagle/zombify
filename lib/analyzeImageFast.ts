// analyzeImageFast.ts (Fast Audit)
import { ZombifyAnalysis } from '@/types/analysis';

export async function analyzeImageFast(imageUrl: string): Promise<ZombifyAnalysis> {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID || undefined,
      project: process.env.OPENAI_PROJECT_ID || undefined
    });
    const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-5-vision';
    const VISION_FALLBACK_MODEL = process.env.OPENAI_VISION_FALLBACK_MODEL || 'gpt-4o';

    async function createVisionChatCompletion(params: any) {
      try {
        return await openai.responses.create({ ...params, model: VISION_MODEL });
      } catch (err: any) {
        const msg = err?.message || '';
        const code = err?.code || '';
        if (msg.includes('model_not_found') || code === 'model_not_found') {
          console.warn(`[FAST] Primary model "${VISION_MODEL}" unavailable. Falling back to "${VISION_FALLBACK_MODEL}"`);
          return await openai.responses.create({ ...params, model: VISION_FALLBACK_MODEL });
        }
        throw err;
      }
    }

    const response = await createVisionChatCompletion({
      max_output_tokens: 2000,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `You are a static interface design reviewer. Analyze ONLY what is visible in the static image. Do not assume interactivity or hidden flows.

Return a lightweight visual summary in JSON with:

1. GRIP SCORE
- Estimate overall gripScore (1–100) and key breakdowns: firstImpression, trustworthiness, visual clarity.
- Justify each score with 1–2 visual observations only.

2. TOP 3 VISUAL ISSUES
- List 3 key issues, each with: severity (1–4), region, finding, and visual-only fix.

3. AUDIENCE ALIGNMENT (Optional)
- Estimate primary generational appeal (Gen Z, Millennials, etc.) using only visible cues like font size, layout density, color tone.
- Give confidence score and short justification (1–2 lines).

4. UPGRADE TEASER
- End your response with a call to action that hints at the full audit value: “Want deeper analysis? Unlock full audit.”

DO NOT:
- Mention unseen interactions, hover states, or flows
- Output anything not directly observed from the image
- Guess WCAG numbers, spacing units, or exact font sizes` },
            { type: 'input_image', image_url: imageUrl, detail: 'low' }
          ]
        }
      ]
    });

    const content = (response as any).output_text;
    if (!content) throw new Error('No response from OpenAI');

    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let analysis: ZombifyAnalysis;
    try {
      analysis = JSON.parse(cleanContent);
    } catch (err) {
      console.error('Fast audit parse error:', cleanContent);
      throw new Error('Invalid JSON from OpenAI in fast audit');
    }

    if (!analysis.gripScore || !analysis.gripScore.overall) {
      throw new Error('Fast audit missing grip score');
    }

    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('analyzeImageFast failed:', err);
    throw new Error('Fast audit failed');
  }
}
