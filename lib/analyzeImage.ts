// analyzeImage.ts - HYBRID GPT + Vision API Analysis
import { ZombifyAnalysis, VisionAnalysisResult } from '@/types/analysis';

// Keep your existing extractAndParseJSON function exactly as is
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

// NEW: Google Vision API analysis function
async function analyzeImageWithVision(imageUrl: string): Promise<VisionAnalysisResult | null> {
  try {
    console.log('[VISION_API] Starting Vision analysis for:', imageUrl);
    
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.log('[VISION_API] No Vision API key found, skipping Vision analysis');
      return null;
    }

    // Import Vision API client
    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    
    // Initialize client with API key
    const client = new ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
    });

    // Perform multiple detection types in parallel
    const [
      textResult,
      logoResult,
      propertiesResult,
      webResult
    ] = await Promise.all([
      client.textDetection({ image: { source: { imageUri: imageUrl } } }),
      client.logoDetection({ image: { source: { imageUri: imageUrl } } }),
      client.imageProperties({ image: { source: { imageUri: imageUrl } } }),
      client.webDetection({ image: { source: { imageUri: imageUrl } } })
    ]);

    console.log('[VISION_API] All detections completed successfully');

    // Helper function to convert bounding box
    function convertBoundingBox(vertices: any[]): { x: number; y: number; width: number; height: number } {
      if (!vertices || vertices.length < 4) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      const xs = vertices.map(v => v.x || 0);
      const ys = vertices.map(v => v.y || 0);
      
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    // Process text annotations
    const textAnnotations: any[] = [];
    if (textResult[0].textAnnotations && textResult[0].textAnnotations.length > 1) {
      // Skip the first annotation as it's the full text, we want individual words/phrases
      for (let i = 1; i < textResult[0].textAnnotations.length; i++) {
        const annotation = textResult[0].textAnnotations[i];
        if (annotation.description && annotation.boundingPoly?.vertices) {
          textAnnotations.push({
            text: annotation.description,
            confidence: 0.9, // Vision API doesn't provide confidence for text
            boundingBox: convertBoundingBox(annotation.boundingPoly.vertices)
          });
        }
      }
    }

    // Process logo annotations
    const logoAnnotations = (logoResult[0].logoAnnotations || []).map(logo => ({
      description: logo.description || '',
      confidence: logo.score || 0,
      boundingBox: convertBoundingBox(logo.boundingPoly?.vertices || [])
    }));

    // Process color properties
    const dominantColors = (propertiesResult[0].imagePropertiesAnnotation?.dominantColors?.colors || []).map(colorInfo => ({
      color: {
        red: Math.round(colorInfo.color?.red || 0),
        green: Math.round(colorInfo.color?.green || 0),
        blue: Math.round(colorInfo.color?.blue || 0)
      },
      score: colorInfo.score || 0,
      pixelFraction: colorInfo.pixelFraction || 0
    }));

    // Process web detection
    const webDetection = webResult[0].webDetection ? {
      webEntities: (webResult[0].webDetection.webEntities || []).map(entity => ({
        entityId: entity.entityId || '',
        description: entity.description || '',
        score: entity.score || 0
      })),
      bestGuessLabels: (webResult[0].webDetection.bestGuessLabels || []).map(label => ({
        label: label.label || '',
        languageCode: label.languageCode || 'en'
      }))
    } : undefined;

    const result: VisionAnalysisResult = {
      textAnnotations,
      logoAnnotations,
      imageProperties: {
        dominantColors
      },
      webDetection
    };

    console.log('[VISION_API] Analysis completed:', {
      textCount: textAnnotations.length,
      logoCount: logoAnnotations.length,
      colorCount: dominantColors.length
    });

    return result;

  } catch (error) {
    console.error('[VISION_API] Vision analysis failed:', error);
    console.log('[VISION_API] Continuing without Vision data...');
    return null; // Don't fail the whole analysis, just skip Vision data
  }
}

// NEW: Function to enhance GPT analysis with Vision data
function enhanceAnalysisWithVision(analysis: any, visionData: VisionAnalysisResult | null): any {
  if (!visionData || !analysis.verdict) {
    console.log('[ENHANCE] No vision data or verdict available, returning original analysis');
    return analysis;
  }

  console.log('[ENHANCE] Enhancing analysis with Vision data...');

  // Generate real heatmap data based on text positions
  const heatmapData = {
    hotspots: [] as any[],
    coldspots: [] as any[]
  };

  // Convert text annotations to hotspots based on size and position
  visionData.textAnnotations.forEach((text, index) => {
    const area = text.boundingBox.width * text.boundingBox.height;
    const isLargeText = area > 1000; // Adjust threshold as needed
    
    // Prioritize larger text elements and top-left positions
    const intensity = isLargeText ? 0.9 : 0.6;
    const topLeftBonus = (1 - (text.boundingBox.x + text.boundingBox.y) / 2000) * 0.3;
    
    heatmapData.hotspots.push({
      x: text.boundingBox.x + text.boundingBox.width / 2,
      y: text.boundingBox.y + text.boundingBox.height / 2,
      intensity: Math.min(intensity + topLeftBonus, 1),
      element: text.text,
      description: `Text element: "${text.text}"`
    });
  });

  // Add logo positions as high-priority hotspots
  visionData.logoAnnotations.forEach(logo => {
    heatmapData.hotspots.push({
      x: logo.boundingBox.x + logo.boundingBox.width / 2,
      y: logo.boundingBox.y + logo.boundingBox.height / 2,
      intensity: 1.0, // Logos are always high priority
      element: logo.description,
      description: `Logo: ${logo.description}`
    });
  });

  // Sort hotspots by intensity (highest first)
  heatmapData.hotspots.sort((a, b) => b.intensity - a.intensity);

  // Take top 6 hotspots to avoid clutter
  heatmapData.hotspots = heatmapData.hotspots.slice(0, 6);

  // Enhance the verdict with real heatmap data
  const enhancedVerdict = {
    ...analysis.verdict,
    heatmapData
  };

  console.log('[ENHANCE] Enhanced verdict with', heatmapData.hotspots.length, 'hotspots');

  return {
    ...analysis,
    verdict: enhancedVerdict,
    visionData // Include raw vision data for debugging
  };
}

export async function analyzeImage(imageUrl: string): Promise<ZombifyAnalysis> {
  console.log('[ANALYZE_IMAGE] Starting hybrid analysis for:', imageUrl);
  
  try {
    // Step 1: Run your existing GPT-4V analysis (unchanged)
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[ANALYZE_IMAGE] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[ANALYZE_IMAGE] Starting GPT-4V analysis...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert UX designer providing strategic design critique. Focus on what matters for user experience, not pixel-perfect measurements.

ANALYSIS APPROACH:
1. First understand what this interface is trying to achieve
2. Identify design issues that impact user goals
3. Provide actionable feedback based on design principles
4. Focus on perceived hierarchy, clarity, and user flow

IMPORTANT RULES:
- Describe locations in plain language: "the main CTA in the hero section" not coordinates
- When identifying elements, describe what you see: "circular refresh icon" not "C button"
- Focus on holistic issues: hierarchy, contrast, clarity, flow
- Provide 2-5 items per category where relevant
- Give specific but realistic fixes

Return this JSON structure:

{
  "context": "What type of interface this is",
  "industry": "Industry based on visual cues or UNKNOWN",
  "industryConfidence": 0.85,
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": {"score": 80, "reasoning": "Does it immediately communicate purpose?", "evidence": ["What supports this score"]},
      "usability": {"score": 70, "reasoning": "Can users easily understand what to do?", "evidence": ["Specific observations"]},
      "trustworthiness": {"score": 75, "reasoning": "Does it look professional and reliable?", "evidence": ["Visual elements that build/hurt trust"]},
      "conversion": {"score": 65, "reasoning": "Are key actions prominent and compelling?", "evidence": ["CTA visibility and appeal"]},
      "accessibility": {"score": 60, "reasoning": "Can everyone use this effectively?", "evidence": ["Contrast, text size, clarity issues"]}
    }
  },
  "verdict": {
    "summary": "One-line assessment combining main strength and weakness",
    "attentionSpan": "Realistic estimate of how long users will stay engaged",
    "likelyAction": "What most users will probably do on this interface",
    "dropoffPoint": "Where users are most likely to lose interest or leave",
    "memorable": "What elements users will remember after leaving",
    "attentionFlow": [
      "First element that draws the eye",
      "Second place attention goes",
      "Areas that get skipped or ignored",
      "Final focus point before action or exit"
    ]
  },
  "visualDesignAnalysis": {
    "score": 80,
    "typography": {
      "score": 85, 
      "issues": [],
      "hierarchy": {"h1ToH2Ratio": 0, "consistencyScore": 90, "recommendation": "How to improve visual hierarchy"},
      "readability": {"fleschScore": 0, "avgLineLength": 0, "recommendation": "General readability assessment"}
    },
    "colorAndContrast": {
      "score": 85,
      "contrastFailures": [
        {
          "foreground": "describe color",
          "background": "describe color",
          "ratio": 0,
          "location": "plain language description of where",
          "fix": {
            "suggestion": "Make text darker/lighter or change background",
            "css": ""
          }
        }
      ],
      "colorHarmony": {"scheme": "What you observe", "brandColors": ["main colors used"], "accentSuggestion": "How to improve"}
    },
    "spacing": {"score": 80, "gridSystem": "What you observe", "consistency": 85, "issues": []},
    "modernPatterns": {"detected": ["What modern patterns you see"], "implementation": {}, "trendAlignment": {"2025Relevance": 70, "suggestions": ["How to modernize"]}},
    "visualHierarchy": {"scanPattern": "How the eye moves", "focalPoints": ["What draws attention"], "improvements": ["How to improve flow"]}
  },
  "uxCopyAnalysis": {
    "score": 70,
    "issues": [
      {
        "severity": "HIGH",
        "current": "Exact text you see",
        "location": "Where it appears in plain language",
        "issue": "Why this copy doesn't work",
        "suggested": ["Better alternative", "Another option"],
        "impact": "How this affects users",
        "reasoning": "UX writing principle"
      }
    ],
    "writingTone": {"current": "Observed tone", "recommended": "Better tone", "example": "Specific rewrite"}
  },
  "criticalIssues": [
    {
      "severity": 3,
      "category": "HIERARCHY",
      "issue": "Clear issue title",
      "location": {
        "element": "Plain language description of element",
        "region": "Where in the interface",
        "visualContext": "What's around it"
      },
      "impact": "How this affects users",
      "evidence": "What you specifically see",
      "fix": {
        "immediate": "Quick improvement",
        "better": "Optimal solution",
        "implementation": "How to achieve it"
      }
    }
  ],
  "usabilityIssues": [],
  "opportunities": [
    {
      "category": "ENGAGEMENT",
      "opportunity": "Specific enhancement",
      "potentialImpact": "Expected benefit",
      "implementation": "How to do it",
      "reasoning": "Why this matters",
      "location": {
        "element": "What element",
        "region": "Where it is"
      }
    }
  ],
  "behavioralInsights": [
    {
      "pattern": "User behavior pattern",
      "observation": "What triggers this",
      "psychology": "Why users do this",
      "recommendation": "How to design for it"
    }
  ],
  "accessibilityAudit": null,
  "generationalAnalysis": {
    "scores": {
      "genZ": {"score": 70, "reasoning": "Visual appeal assessment", "improvements": "What would resonate more", "specificIssues": []},
      "millennials": {"score": 80, "reasoning": "Design appropriateness", "improvements": "Minor adjustments", "specificIssues": []},
      "genX": {"score": 85, "reasoning": "Clarity assessment", "improvements": "Suggestions", "specificIssues": []},
      "boomers": {"score": 75, "reasoning": "Ease of use", "improvements": "Accessibility improvements", "specificIssues": []}
    },
    "primaryTarget": "Based on design style",
    "recommendations": ["How to better serve target"]
  }
}

Focus on strategic design insights that help designers improve their work, not technical precision.`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    });

    console.log('[ANALYZE_IMAGE] GPT-4V analysis completed');
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[ANALYZE_IMAGE] No content in OpenAI response:', response);
      throw new Error('No response from OpenAI');
    }

    // Parse GPT analysis
    const gptAnalysis = extractAndParseJSON(content);
    console.log('[ANALYZE_IMAGE] GPT analysis parsed successfully');

    // Step 2: Run Google Vision API analysis in parallel (new!)
    console.log('[ANALYZE_IMAGE] Starting Vision API analysis...');
    const visionData = await analyzeImageWithVision(imageUrl);
    
    // Step 3: Combine both analyses (new!)
    console.log('[ANALYZE_IMAGE] Combining GPT and Vision analyses...');
    const enhancedAnalysis = enhanceAnalysisWithVision(gptAnalysis, visionData);

    // Validate required fields
    if (!enhancedAnalysis.gripScore || !enhancedAnalysis.criticalIssues || !enhancedAnalysis.context) {
      throw new Error('Invalid response format from analysis');
    }

    const finalAnalysis = {
      ...enhancedAnalysis,
      timestamp: new Date().toISOString()
    };

    console.log('[✅ HYBRID ANALYSIS COMPLETE]', {
      gptSuccess: !!gptAnalysis,
      visionSuccess: !!visionData,
      hotspotsGenerated: finalAnalysis.verdict?.heatmapData?.hotspots?.length || 0
    });

    return finalAnalysis;

  } catch (error) {
    console.error('[ANALYZE_IMAGE] Hybrid analysis failed:', error);
    
    // Keep your existing error handling exactly as is
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
          verdict: {
            summary: 'Analysis failed due to image download timeout',
            attentionSpan: 'Unable to analyze',
            likelyAction: 'Unable to analyze',
            dropoffPoint: 'Unable to analyze',
            memorable: 'Unable to analyze',
            attentionFlow: []
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
      verdict: {
        summary: 'Analysis failed due to system error',
        attentionSpan: 'Unable to analyze',
        likelyAction: 'Unable to analyze',
        dropoffPoint: 'Unable to analyze',
        memorable: 'Unable to analyze',
        attentionFlow: []
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