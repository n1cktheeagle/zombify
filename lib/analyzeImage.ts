// analyzeImage.ts (Full Audit)
import { ZombifyAnalysis } from '@/types/analysis';

export async function analyzeImage(imageUrl: string): Promise<ZombifyAnalysis> {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a visual design analysis engine analyzing a STATIC IMAGE of a digital interface. You must not infer any interactive behaviors, flows, or unseen states. Do not hallucinate features. Focus only on what is visually observable.

Return your response in JSON format using the structure previously defined, and mark any non-standard or speculative content with \"experimental\": true.

Steps:
1. GRIP SCORE (OVERVIEW)
- Estimate gripScore (overall + breakdown: firstImpression, usability, trust, conversion, accessibility).
- Justify scores with visible evidence.

2. TOP VISUAL ISSUES
- List 3–5 most critical visual issues.
- For each: severity (1–4), region, finding, and suggested fix.

3. VISUAL DESIGN ANALYSIS
- Typography, color/contrast (WCAG approximation), spacing, grid, visual hierarchy, patterns.

4. ACCESSIBILITY (STATIC ONLY)
- Visual-only check: contrast, font size, whitespace, layout clarity.

5. UX COPY (EXPERIMENTAL)
- CTA language, headline clarity, tone.

6. AUDIENCE ALIGNMENT (EXPERIMENTAL)
- Estimate which generation this appeals to (visually). Use font, layout, color, tone only.
- Provide score per gen, primary target, short reasoning per.

7. RETURN JSON
- Do not guess hidden flows or behaviors.
- Mark uncertain observations clearly.
- No DOM paths or code.
- Only return visible insights.`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    });
    console.log('[GPT-4o RAW OUTPUT]', response.choices?.[0]?.message?.content || 'No content');
    const content = response.choices[0]?.message?.content;
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
      console.log('[✅ Parsed Analysis JSON]', analysis); // ← This is the only addition
    } catch (parseError) {
      console.log('Failed to parse as JSON, OpenAI returned:', cleanContent);

      if (cleanContent.includes('unable to assist') || cleanContent.includes("can't analyze")) {
        throw new Error('OpenAI cannot analyze this image. This may happen with certain content types or image formats.');
      }
      throw new Error('Invalid JSON response from OpenAI');
    }

    if (!analysis.gripScore || !analysis.criticalIssues || !analysis.context) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('OpenAI analysis failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('Timeout while downloading')) {
        return {
          context: 'ERROR',
          industry: 'UNKNOWN',
          industryConfidence: 0,
          gripScore: {
            overall: 0,
            breakdown: {
              firstImpression: { score: 0, reasoning: 'Analysis failed', evidence: [] },
              usability: { score: 0, reasoning: 'Analysis failed', evidence: [] },
              trustworthiness: { score: 0, reasoning: 'Analysis failed', evidence: [] },
              conversion: { score: 0, reasoning: 'Analysis failed', evidence: [] },
              accessibility: { score: 0, reasoning: 'Analysis failed', evidence: [] }
            }
          },
          visualDesignAnalysis: {
            score: 0,
            typography: {
              score: 0,
              issues: [],
              hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: 'Analysis failed' },
              readability: { fleschScore: 0, avgLineLength: 0, recommendation: 'Analysis failed' }
            },
            colorAndContrast: {
              score: 0,
              contrastFailures: [],
              colorHarmony: { scheme: 'UNKNOWN', brandColors: [], accentSuggestion: 'Analysis failed' }
            },
            spacing: {
              score: 0,
              gridSystem: 'UNKNOWN',
              consistency: 0,
              issues: []
            },
            modernPatterns: {
              detected: [],
              implementation: {},
              trendAlignment: { '2025Relevance': 0, suggestions: [] }
            },
            visualHierarchy: {
              scanPattern: 'UNKNOWN',
              focalPoints: [],
              improvements: []
            }
          },
          uxCopyAnalysis: {
            score: 0,
            issues: [],
            writingTone: {
              current: 'Unknown',
              recommended: 'Unknown',
              example: 'Analysis failed'
            }
          },
          criticalIssues: [
            {
              severity: 4,
              category: 'SYSTEM_ERROR',
              issue: 'Image download timeout',
              location: {
                element: 'system',
                region: 'none'
              },
              impact: "OpenAI couldn't download your image in time. This usually happens with large files.",
              evidence: 'The image URL timed out during download',
              fix: {
                immediate: 'Try uploading a smaller image (under 5MB)',
                better: 'Optimize your image before uploading (reduce resolution or compress)',
                implementation: 'Use an image optimization tool to reduce file size'
              }
            }
          ],
          usabilityIssues: [],
          opportunities: [],
          behavioralInsights: [],
          accessibilityAudit: null,
          generationalAnalysis: {
            scores: {},
            primaryTarget: 'unknown',
            recommendations: []
          },
          timestamp: new Date().toISOString(),
          error: true
        };
      }
    }

    return {
      context: 'ERROR',
      industry: 'UNKNOWN',
      industryConfidence: 0,
      gripScore: {
        overall: 0,
        breakdown: {
          firstImpression: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          usability: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          trustworthiness: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          conversion: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          accessibility: { score: 0, reasoning: 'Analysis failed', evidence: [] }
        }
      },
      visualDesignAnalysis: {
        score: 0,
        typography: {
          score: 0,
          issues: [],
          hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: 'Analysis failed' },
          readability: { fleschScore: 0, avgLineLength: 0, recommendation: 'Analysis failed' }
        },
        colorAndContrast: {
          score: 0,
          contrastFailures: [],
          colorHarmony: { scheme: 'UNKNOWN', brandColors: [], accentSuggestion: 'Analysis failed' }
        },
        spacing: {
          score: 0,
          gridSystem: 'UNKNOWN',
          consistency: 0,
          issues: []
        },
        modernPatterns: {
          detected: [],
          implementation: {},
          trendAlignment: { '2025Relevance': 0, suggestions: [] }
        },
        visualHierarchy: {
          scanPattern: 'UNKNOWN',
          focalPoints: [],
          improvements: []
        }
      },
      uxCopyAnalysis: {
        score: 0,
        issues: [],
        writingTone: {
          current: 'Unknown',
          recommended: 'Unknown',
          example: 'Analysis failed'
        }
      },
      criticalIssues: [
        {
          severity: 4,
          category: 'SYSTEM_ERROR',
          issue: 'Analysis service temporarily unavailable',
          location: {
            element: 'system',
            region: 'none'
          },
          impact: 'Unable to analyze the uploaded image',
          evidence: error instanceof Error ? error.message : 'Unknown error occurred',
          fix: {
            immediate: 'Please check your API key and try again',
            better: 'Ensure the image is in a supported format (PNG, JPG, GIF)',
            implementation: 'Contact support if the issue persists'
          }
        }
      ],
      usabilityIssues: [],
      opportunities: [],
      behavioralInsights: [],
      accessibilityAudit: null,
      generationalAnalysis: {
        scores: {},
        primaryTarget: 'unknown',
        recommendations: []
      },
      timestamp: new Date().toISOString(),
      error: true
    };
  }
}