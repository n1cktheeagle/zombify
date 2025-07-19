// analyzeImage.ts (Full Audit)
import { ZombifyAnalysis } from '@/types/analysis';

// Robust JSON extraction function
function extractAndParseJSON(content: string): any {
  console.log('[DEBUG] Raw content length:', content.length);
  console.log('[DEBUG] Raw content preview:', content.substring(0, 200) + '...');

  // Step 1: Try direct JSON parse first
  try {
    const parsed = JSON.parse(content.trim());
    console.log('[SUCCESS] Direct JSON parse worked');
    return parsed;
  } catch (e) {
    console.log('[DEBUG] Direct parse failed, trying extraction methods...');
  }

  // Step 2: Remove common markdown wrappers
  let cleanContent = content.trim();
  
  // Remove various code block formats
  cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  
  try {
    const parsed = JSON.parse(cleanContent);
    console.log('[SUCCESS] Markdown removal worked');
    return parsed;
  } catch (e) {
    console.log('[DEBUG] Markdown removal failed, trying regex extraction...');
  }

  // Step 3: Find JSON using regex patterns
  const jsonPatterns = [
    // Look for content between first { and last }
    /\{[\s\S]*\}/,
    // Look for content between first [ and last ]
    /\[[\s\S]*\]/,
    // Look for JSON after common prefixes
    /(?:here's|here is|the|json|result|analysis|response)[\s\S]*?(\{[\s\S]*\})/i,
    // Look for JSON in code blocks
    /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i,
  ];

  for (const pattern of jsonPatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        const parsed = JSON.parse(jsonStr.trim());
        console.log('[SUCCESS] Regex extraction worked with pattern:', pattern.source);
        return parsed;
      } catch (e) {
        console.log('[DEBUG] Regex pattern failed:', pattern.source);
        continue;
      }
    }
  }

  // Step 4: Try to find and extract valid JSON by finding balanced braces
  const openBrace = content.indexOf('{');
  if (openBrace !== -1) {
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = openBrace; i < content.length; i++) {
      const char = content[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        
        if (braceCount === 0) {
          const jsonStr = content.substring(openBrace, i + 1);
          try {
            const parsed = JSON.parse(jsonStr);
            console.log('[SUCCESS] Brace balancing worked');
            return parsed;
          } catch (e) {
            console.log('[DEBUG] Brace balancing found invalid JSON');
            break;
          }
        }
      }
    }
  }

  // Step 5: Try to clean up common JSON issues
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let jsonStr = jsonMatch[0];
    
    // Fix common issues
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
    
    try {
      const parsed = JSON.parse(jsonStr);
      console.log('[SUCCESS] JSON cleanup worked');
      return parsed;
    } catch (e) {
      console.log('[DEBUG] JSON cleanup failed');
    }
  }

  throw new Error('Could not extract valid JSON from response');
}

export async function analyzeImage(imageUrl: string): Promise<ZombifyAnalysis> {
  console.log('[ANALYZE_IMAGE] Starting analysis for:', imageUrl);
  
  try {
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[ANALYZE_IMAGE] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[ANALYZE_IMAGE] OpenAI client created, making API call...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent JSON
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
                            text: `Analyze this interface image for visual design quality. Focus only on what you can see in the static image.

CRITICAL: For each issue you identify, you MUST provide precise visual coordinates by looking at the image.

RULES:
- Only analyze visible elements (colors, typography, spacing, layout)
- Don't suggest adding new features or functionality 
- Give contextually appropriate recommendations
- Be specific to this exact interface type
- For EVERY issue, provide exact percentage coordinates where that element appears in the image

COORDINATE REQUIREMENTS:
- Use percentage coordinates (0-100%) relative to image dimensions
- X: left edge = 0%, right edge = 100%
- Y: top edge = 0%, bottom edge = 100%
- Measure from the TOP-LEFT corner of elements
- Be precise - look carefully at where each problematic element is located

Return ONLY this JSON structure:

{
  "context": "INTERFACE_TYPE_YOU_SEE",
  "industry": "INDUSTRY_FROM_VISUAL_CUES",
  "industryConfidence": 85,
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": {"score": 80, "reasoning": "Visual impact assessment", "evidence": ["Specific visual elements"]},
      "usability": {"score": 70, "reasoning": "Layout clarity assessment", "evidence": ["Navigation clarity", "Information architecture"]},
      "trustworthiness": {"score": 75, "reasoning": "Professional appearance", "evidence": ["Design consistency"]},
      "conversion": {"score": 65, "reasoning": "Visual emphasis of key actions", "evidence": ["Button prominence"]},
      "accessibility": {"score": 60, "reasoning": "Contrast and readability", "evidence": ["Text contrast", "Font sizing"]}
    }
  },
  "visualDesignAnalysis": {
    "score": 80,
    "typography": {"score": 85, "issues": [], "hierarchy": {"h1ToH2Ratio": 1.2, "consistencyScore": 90, "recommendation": "Specific typography improvement"}, "readability": {"fleschScore": 70, "avgLineLength": 50, "recommendation": "Readability assessment"}},
    "colorAndContrast": {"score": 85, "contrastFailures": [], "colorHarmony": {"scheme": "Color scheme type", "brandColors": ["#color1", "#color2"], "accentSuggestion": "Color recommendation"}},
    "spacing": {"score": 80, "gridSystem": "Layout system used", "consistency": 85, "issues": []},
    "modernPatterns": {"detected": ["Pattern 1", "Pattern 2"], "implementation": {"assessment": "Quality rating"}, "trendAlignment": {"2025Relevance": 90, "suggestions": ["Specific visual improvements"]}},
    "visualHierarchy": {"scanPattern": "Pattern type", "focalPoints": ["Element 1", "Element 2"], "improvements": ["Specific hierarchy improvements"]}
  },
  "uxCopyAnalysis": {"score": 70, "issues": [], "writingTone": {"current": "Tone assessment", "recommended": "Recommended tone", "example": "Copy improvement example"}},
  "criticalIssues": [{"severity": 3, "category": "VISUAL_ISSUE", "issue": "Specific visual problem", "location": {"element": "specific element", "region": "location", "percentage": {"x": "45", "y": "23"}}, "impact": "User impact", "evidence": "What you see", "fix": {"immediate": "Quick fix", "better": "Better solution", "implementation": "How to implement"}}],
  "usabilityIssues": [{"severity": 2, "category": "LAYOUT", "issue": "Layout issue", "location": {"element": "element", "region": "area", "percentage": {"x": "67", "y": "45"}}, "impact": "Usability impact", "evidence": "Visual evidence", "fix": {"immediate": "Quick improvement", "better": "Better approach", "implementation": "Implementation details"}}],
  "opportunities": [{"category": "VISUAL_IMPROVEMENT", "opportunity": "Specific visual enhancement", "potentialImpact": "Expected improvement", "implementation": "Visual design change", "location": {"element": "specific element", "region": "area", "percentage": {"x": "30", "y": "60"}}}],
  "behavioralInsights": [{"pattern": "Visual pattern observed", "observation": "What you notice", "psychology": "Design principle", "recommendation": "Visual improvement"}],
  "accessibilityAudit": {"score": 65, "violations": ["Contrast issues"], "wcagLevel": "AA", "colorContrast": {"issues": ["Specific contrast problems"], "recommendations": ["Contrast improvements"]}, "keyboardNavigation": {"score": 70, "issues": []}, "screenReader": {"compatibility": 60, "issues": ["Accessibility issues"]}, "cognitiveLoad": {"assessment": "Load level", "recommendations": ["Cognitive improvements"]}},
  "generationalAnalysis": {"scores": {"genZ": {"score": 75, "reasoning": "Appeal reasoning", "improvements": "Visual improvements", "specificIssues": []}, "millennials": {"score": 85, "reasoning": "Appeal reasoning", "improvements": "Improvements", "specificIssues": []}, "genX": {"score": 80, "reasoning": "Appeal reasoning", "improvements": "Improvements", "specificIssues": []}, "boomers": {"score": 70, "reasoning": "Appeal reasoning", "improvements": "Improvements", "specificIssues": []}}, "primaryTarget": "target generation", "recommendations": ["Design recommendations"]}
}

Replace all placeholder text with real analysis of this specific image. IMPORTANT: Look at the actual image and provide real percentage coordinates for where each issue is located.`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
          });

    console.log('[ANALYZE_IMAGE] API call completed. Response status:', response.choices?.length || 0, 'choices');
    console.log('[GPT-4o RAW OUTPUT]', response.choices?.[0]?.message?.content || 'No content');
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[ANALYZE_IMAGE] No content in OpenAI response:', response);
      throw new Error('No response from OpenAI');
    }
    
    console.log('[ANALYZE_IMAGE] Content received, length:', content.length);

    // Use our robust JSON extraction
    const analysis = extractAndParseJSON(content);
    console.log('[✅ Successfully parsed analysis]', analysis);

    // Validate required fields
    if (!analysis.gripScore || !analysis.criticalIssues || !analysis.context) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[ANALYZE_IMAGE] Analysis failed with error:', error);
    console.error('[ANALYZE_IMAGE] Error type:', typeof error);
    console.error('[ANALYZE_IMAGE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

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