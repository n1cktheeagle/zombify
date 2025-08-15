// analyzeImage.ts - Enhanced with all new features including PerceptionLayer and ModuleStrength
import { 
  ZombifyAnalysis, 
  AttentionFlowItem,
  DarkPattern,
  Issue,
  PerceptionLayer,
  ModuleStrength,
  EnhancedBehavioralInsight,
  VisualDesignFeedback,
  AccessibilityAudit,
  AccessibilityFailure
} from '@/types/analysis';
import { ExtractedData } from '@/lib/extractors/browserExtractor';
import crypto from 'crypto';

// Model configuration: prefer GPT-5 Vision if available, fallback to 4o
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-5-vision';
const VISION_FALLBACK_MODEL = process.env.OPENAI_VISION_FALLBACK_MODEL || 'gpt-5';
const GPT_VERSION = process.env.OPENAI_VISION_MODEL_VERSION || VISION_MODEL;

// Helper to perform a chat completion with fallback to an alternate model if the primary is unavailable
async function createVisionChatCompletion(openai: any, params: any) {
  const primaryModel = VISION_MODEL;
  const fallbackModel = VISION_FALLBACK_MODEL;
  try {
    return await openai.responses.create({ ...params, model: primaryModel });
  } catch (err: any) {
    const message: string = err?.message || '';
    const code: string = err?.code || '';
    // Try fallback if model not found or deactivated
    if (message.includes('model_not_found') || message.includes('The model') || code === 'model_not_found') {
      console.warn(`[ANALYZE_IMAGE] Primary model "${primaryModel}" unavailable. Falling back to "${fallbackModel}"`);
      return await openai.responses.create({ ...params, model: fallbackModel });
    }
    throw err;
  }
}

// Enhanced dark pattern interface with risk assessment
interface EnhancedDarkPattern extends DarkPattern {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  manipulativeness: number; // 1-10 scale
  intent: boolean; // is it deceptive?
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  fallbackExplanation: string;
}

// Helper function to parse user context into structured tags
function parseContextToTags(context: string): { interfaceType: string; strategicIntent: string } {
  // This function prepares the context for GPT to intelligently infer the tags
  // Rather than hardcoding patterns, we'll let GPT handle the inference
  // This is just to structure the request
  return {
    interfaceType: 'TO_BE_INFERRED',
    strategicIntent: 'TO_BE_INFERRED'
  };
}

// Helper to generate a hash of the prompt for tracking changes
function generatePromptHash(promptContent: string): string {
  return crypto.createHash('sha256')
    .update(promptContent)
    .digest('hex')
    .substring(0, 8); // First 8 chars is enough for tracking
}

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
    /\{[\s\S]*\}/,
    /\[[\s\S]*\]/,
    /(?:here's|here is|the|json|result|analysis|response)[\s\S]*?(\{[\s\S]*\})/i,
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
    
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    
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

// Vision API removed - now relying solely on GPT-4V for visual analysis

// Location processing simplified - GPT-4V handles element identification directly

// Analysis enhancement now handled directly by GPT-4V - no separate Vision API processing needed

// Helper functions for contrast calculation removed - GPT-4V now handles color analysis directly

// NEW: Calculate string similarity (simple Levenshtein-based approach)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Quick exact match check
  if (s1 === s2) return 1;
  
  // Simple word overlap similarity
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity coefficient
  return intersection.size / union.size;
}

// ENHANCED: Check if two insights are similar with improved pattern detection
function isSimilarInsight(insightA: string, insightB: string): boolean {
  const similarity = calculateSimilarity(insightA, insightB);
  
  // Also check for common patterns that indicate duplication
  const a = insightA.toLowerCase();
  const b = insightB.toLowerCase();
  
  // Check if they're talking about the same UI element (expanded list)
  const commonElements = ['button', 'cta', 'form', 'header', 'navigation', 'text', 'color', 'contrast', 'input', 'field', 'menu', 'link', 'icon'];
  const sharedElement = commonElements.some(elem => 
    a.includes(elem) && b.includes(elem)
  );
  
  // Check for common action patterns
  const commonActions = ['improve', 'add', 'remove', 'optimize', 'enhance', 'fix', 'change', 'make', 'increase', 'reduce'];
  const sharedAction = commonActions.some(action => 
    a.includes(action) && b.includes(action)
  );
  
  // Check for generic phrasing patterns that indicate bullshit duplication
  const genericPatterns = [
    /trust.*without/,
    /value.*prop/,
    /conversion.*funnel/,
    /user.*don't.*understand/,
    /improve.*clarity/,
    /add.*social.*proof/
  ];
  
  const bothGeneric = genericPatterns.some(pattern => 
    pattern.test(a) && pattern.test(b)
  );
  
  // More aggressive deduplication for common patterns
  if (bothGeneric && similarity > 0.4) return true;
  if (sharedElement && sharedAction && similarity > 0.45) return true;
  if (similarity > 0.65) return true;
  if (sharedElement && similarity > 0.5) return true;
  
  return false;
}

// ENHANCED: Cross-reference checker with similarity detection
function checkForDuplication(modules: any): Map<string, Set<string>> {
  const insightsByModule = new Map<string, string[]>();
  const duplicatesByModule = new Map<string, Set<string>>();
  
  // Collect all insights by module
  if (modules.darkPatterns?.length > 0) {
    insightsByModule.set('darkPatterns', modules.darkPatterns.map((dp: DarkPattern) => dp.evidence));
  }
  
  if (modules.issuesAndFixes?.length > 0) {
    insightsByModule.set('issuesAndFixes', modules.issuesAndFixes.map((issue: Issue) => issue.issue));
  }
  
  if (modules.uxCopyInsights?.issues?.length > 0) {
    insightsByModule.set('uxCopyInsights', modules.uxCopyInsights.issues.map((issue: any) => issue.issue));
  }
  
  if (modules.behavioralInsights?.length > 0) {
    insightsByModule.set('behavioralInsights', modules.behavioralInsights.map((insight: any) => insight.observation));
  }
  
  if (modules.opportunities?.length > 0) {
    insightsByModule.set('opportunities', modules.opportunities.map((opp: any) => opp.opportunity));
  }
  
  // Check for similar insights across all modules
  const allInsights: Array<{module: string, insight: string}> = [];
  insightsByModule.forEach((insights, module) => {
    insights.forEach(insight => {
      allInsights.push({module, insight});
    });
  });
  
  // Find duplicates using similarity check
  for (let i = 0; i < allInsights.length; i++) {
    for (let j = i + 1; j < allInsights.length; j++) {
      if (isSimilarInsight(allInsights[i].insight, allInsights[j].insight)) {
        // Mark the second occurrence as duplicate
        const moduleWithDupe = allInsights[j].module;
        if (!duplicatesByModule.has(moduleWithDupe)) {
          duplicatesByModule.set(moduleWithDupe, new Set());
        }
        duplicatesByModule.get(moduleWithDupe)!.add(allInsights[j].insight);
        
        console.log(`[DUPLICATE] Similar insights found:
          Module ${allInsights[i].module}: "${allInsights[i].insight.substring(0, 50)}..."
          Module ${allInsights[j].module}: "${allInsights[j].insight.substring(0, 50)}..."`);
      }
    }
  }
  
  return duplicatesByModule;
}

// NEW: Calculate module strength based on content quality
function calculateModuleStrength(moduleData: any, moduleName: string): number {
  if (!moduleData) return 0;
  
  // Base scoring criteria
  let score = 0;
  
  switch (moduleName) {
    case 'issuesAndFixes':
      if (Array.isArray(moduleData) && moduleData.length > 0) {
        score = Math.min(5, Math.ceil(moduleData.length / 2));
        // Reduce score if issues are generic
        const hasSpecificEvidence = moduleData.some((i: Issue) => i.evidence && i.evidence.length > 20);
        if (!hasSpecificEvidence) score = Math.max(1, score - 2);
      }
      break;
      
    case 'uxCopyInsights':
      if (moduleData.issues && moduleData.issues.length > 0) {
        score = Math.min(5, Math.ceil(moduleData.issues.length / 2));
        // Boost if audience alignment is clear
        if (moduleData.audienceAlignment?.toneMismatch < 30) score = Math.min(5, score + 1);
      }
      break;
      
    case 'visualDesign':
      if (moduleData.score > 0) {
        score = Math.ceil(moduleData.score / 20); // Convert 0-100 to 1-5
        // Reduce if no specific issues found
        const hasIssues = moduleData.typography?.issues?.length > 0 || 
                         moduleData.colorAndContrast?.contrastFailures?.length > 0;
        if (!hasIssues && score > 3) score = 3;
      }
      break;
      
    case 'darkPatterns':
      if (Array.isArray(moduleData)) {
        score = moduleData.length > 0 ? Math.min(5, moduleData.length + 2) : 0;
      }
      break;
      
    case 'behavioralInsights':
      if (Array.isArray(moduleData) && moduleData.length > 0) {
        score = Math.min(5, Math.ceil(moduleData.length * 1.5));
        // Boost for high emotional intensity
        const hasHighIntensity = moduleData.some((b: EnhancedBehavioralInsight) => 
          b.emotionalImpact?.intensity >= 7
        );
        if (hasHighIntensity) score = Math.min(5, score + 1);
      }
      break;
      
      
    case 'opportunities':
      if (Array.isArray(moduleData) && moduleData.length > 0) {
        score = Math.min(5, Math.ceil(moduleData.length / 2));
      }
      break;
      
    case 'frictionPoints':
      if (Array.isArray(moduleData) && moduleData.length > 0) {
        score = Math.min(5, moduleData.length + 1);
        // Boost for high dropoff risk
        const hasHighRisk = moduleData.some((f: any) => f.dropoffRisk === 'HIGH');
        if (hasHighRisk) score = Math.min(5, score + 1);
      }
      break;
      
    case 'generationalAnalysis':
      if (moduleData.scores && Object.keys(moduleData.scores).length > 0) {
        // Average the generation scores
        const scores = Object.values(moduleData.scores).map((g: any) => g.score || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        score = avgScore > 70 ? 3 : avgScore > 50 ? 4 : 5; // Inverse - lower scores = more issues
      }
      break;
      
    default:
      score = 1;
  }
  
  return Math.max(1, Math.min(5, Math.round(score)));
}

// Generate accessibility audit from extracted data
function generateAccessibilityAudit(extractedData?: ExtractedData): AccessibilityAudit {
  if (!extractedData) {
    return {
      score: 0,
      criticalFailures: [],
      strengths: [],
      weaknesses: ['No extracted data available for accessibility analysis'],
      recommendations: [{
        action: 'Upload a clearer image for automated accessibility analysis',
        priority: 'HIGH',
        effort: 'LOW'
      }],
      automated: true
    };
  }

  const failures: AccessibilityFailure[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Analyze contrast issues from extracted data
  if (extractedData.contrast.issues.length > 0) {
    extractedData.contrast.issues.forEach(issue => {
      failures.push({
        criterion: 'Color Contrast',
        issue: `Insufficient color contrast detected`,
        location: {
          element: issue.location
        },
        currentValue: `${issue.ratio}:1`,
        requiredValue: '4.5:1',
        fix: `Increase contrast between ${issue.foreground} and ${issue.background} to meet WCAG AA standards`
      });
    });
    
    weaknesses.push(`${extractedData.contrast.issues.length} color contrast violations detected`);
  } else {
    strengths.push('All detected color combinations meet WCAG contrast requirements');
  }

  // Since TextBlock doesn't have fontSize, we'll focus on text detection confidence
  // Low confidence might indicate small or poor quality text
  const lowConfidenceBlocks = extractedData.text.blocks.filter(block => 
    block.confidence < 70
  );
  
  if (lowConfidenceBlocks.length > 0) {
    failures.push({
      criterion: 'Text Clarity',
      issue: 'Low confidence text detection suggests readability issues',
      location: {
        element: 'Multiple text elements'
      },
      currentValue: `${lowConfidenceBlocks.length} low-confidence text elements`,
      requiredValue: 'High contrast, clear text with >80% detection confidence',
      fix: 'Improve text contrast and size for better readability'
    });
    
    weaknesses.push(`${lowConfidenceBlocks.length} text elements have poor detection confidence`);
  } else {
    strengths.push('Text appears to be clear and well-detected');
  }

  // Analyze spacing consistency
  if (extractedData.spacing.consistency < 60) {
    weaknesses.push('Inconsistent spacing may affect users with cognitive disabilities');
    failures.push({
      criterion: 'Layout Consistency',
      issue: 'Inconsistent spacing patterns detected',
      location: {
        element: 'Overall layout'
      },
      currentValue: `${extractedData.spacing.consistency}% consistency`,
      requiredValue: '80%+ consistency recommended',
      fix: 'Implement consistent spacing patterns using a design system'
    });
  } else {
    strengths.push('Good spacing consistency supports cognitive accessibility');
  }

  // Calculate score based on issues
  let score = 100;
  score -= failures.length * 15; // Each failure reduces score
  score -= weaknesses.length * 5; // Each weakness reduces score
  score = Math.max(0, Math.min(100, score));

  const recommendations = [];
  
  if (failures.length > 0) {
    recommendations.push({
      action: 'Fix color contrast issues to meet WCAG AA standards',
      priority: 'HIGH' as const,
      effort: 'MEDIUM' as const
    });
  }
  
  if (extractedData.spacing.consistency < 60) {
    recommendations.push({
      action: 'Implement consistent spacing patterns',
      priority: 'MEDIUM' as const,
      effort: 'HIGH' as const
    });
  }
  
  if (extractedData.text.confidence < 70) {
    recommendations.push({
      action: 'Improve text clarity and contrast for better OCR detection',
      priority: 'MEDIUM' as const,
      effort: 'MEDIUM' as const
    });
  }

  return {
    score,
    criticalFailures: failures,
    strengths,
    weaknesses,
    recommendations,
    automated: true,
    colorContrast: {
      issues: extractedData.contrast.issues.map(issue => ({
        element: issue.location,
        contrastRatio: `${issue.ratio}:1`,
        fix: `Change ${issue.foreground} or ${issue.background} to achieve 4.5:1 contrast`
      }))
    },
    textSize: lowConfidenceBlocks.length > 0 ? {
      smallTextCount: lowConfidenceBlocks.length,
      minimumSize: '14px',
      recommendation: 'Increase font size for better accessibility'
    } : undefined
  };
}

// MAIN ENHANCED FUNCTION WITH FIXED 3-PROMPT CHAIN
export async function analyzeImage(
  imageUrl: string, 
  userContext?: string,
  extractedData?: ExtractedData, // ADD THIS - Real data from browser extraction
  heatmapData?: any, // ADD THIS - Optional heatmap data
  previousAnalysis?: ZombifyAnalysis, // For future multi-upload comparison
  onProgress?: (stage: number) => void // Progress callback for UI updates
): Promise<ZombifyAnalysis> {
  console.log('[ANALYZE_IMAGE] Starting enhanced 3-stage prompt chain analysis for:', imageUrl);
  if (userContext) {
    console.log('[ANALYZE_IMAGE] User context provided:', userContext);
  }
  if (previousAnalysis) {
    console.log('[ANALYZE_IMAGE] Previous analysis provided for future comparison features');
    // TODO: Implement analyzeChange() logic here in future iterations
    // This would compare previousAnalysis with new results to detect:
    // - Regressions vs improvements
    // - Persistent issues vs resolved ones
    // - Behavioral shifts over time
  }
  
  try {
    // Vision API removed - now using GPT-4V native vision capabilities only
    console.log('[ANALYZE_IMAGE] Starting GPT-4V analysis...');
    
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[ANALYZE_IMAGE] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID || undefined,
      project: process.env.OPENAI_PROJECT_ID || undefined
    });
    
    // Build ground truth context from extracted data
    const groundTruthContext = extractedData ? `
EXTRACTED GROUND TRUTH DATA (USE THIS, DON'T HALLUCINATE):

REAL COLORS FOUND:
- Primary: ${extractedData.colors.primary}
- Secondary: ${extractedData.colors.secondary}
- Background: ${extractedData.colors.background}
- Text colors: ${extractedData.colors.text.join(', ')}
- Full palette: ${extractedData.colors.palette.map(c => c.hex).join(', ')}

ACTUAL TEXT CONTENT (${extractedData.text.confidence}% OCR confidence):
"${extractedData.text.extracted}"

MEASURED CONTRAST ISSUES:
${extractedData.contrast.issues.map(i => 
  `- ${i.location}: ${i.foreground} on ${i.background} = ${i.ratio}:1 (${i.wcagLevel})`
).join('\n')}

CRITICAL RULES:
1. ONLY use colors from the palette above
2. ONLY quote text from the extracted content
3. Use PROVIDED contrast ratios
4. Don't make up any data not listed above
` : '';
    
    // Parse user context if provided - let GPT infer this intelligently
    let contextPrompt = '';
    
    if (userContext) {
      console.log('[CONTEXT] User provided context:', userContext);
      contextPrompt = `
USER CONTEXT PROVIDED: "${userContext}"

IMPORTANT: Use this context to understand what the user is trying to achieve. Infer:
1. The type of interface (don't limit to predefined categories - be specific)
2. The strategic goal (what success looks like for this interface)
3. The target audience and use case
4. Any specific concerns or focus areas mentioned

Let this context guide your analysis to be more relevant and actionable.
`;
    }

    // STAGE 1: OBSERVATION WITH FIXED ATTENTION FLOW
    console.log('[ANALYZE_IMAGE] Stage 1: Observation');
    onProgress?.(1);
    const observationPrompt = `You are a glitchy oracle who's seen 10,000 failed startups. Your job is to decode interface psychology with brutal honesty.

${groundTruthContext}

${contextPrompt}

STAGE 1 - OBSERVE: Examine this interface with surgical precision.

First, deliver ONE brutal sentence that captures the core truth about this interface - the insight that makes users either engage or flee.

${userContext ? `
CONTEXT PARSING TASK:
The user described their interface as: "${userContext}"
From this description, infer:
- interfaceType: What category of interface is this? (e.g., "E-COMMERCE_CHECKOUT", "ONBOARDING_FORM", "ANALYTICS_DASHBOARD", "MARKETING_LANDING", etc.)
- strategicIntent: What's the primary goal? (e.g., "CONVERSION", "TRUST_BUILDING", "EDUCATION", "RETENTION", "ENGAGEMENT", etc.)
Be specific - don't limit to generic categories.
` : ''}

Then observe:
1. What type of interface is this? Be specific - don't just say "dashboard" or "form"
2. ${userContext ? 'How does your observation align with the user\'s description?' : ''}
3. Visual hierarchy - map the EXACT attention flow (3-6 elements minimum)
4. What emotions does the design trigger?
5. What specific text and CTAs can you actually read in the image?
6. Is this modern or dated? Why?

CRITICAL FOR ATTENTION FLOW:
- List 3-6 elements in order of visual dominance
- Consider: size, color contrast, position, whitespace
- First element = what eyes land on immediately
- Use EXACT element names/text you can see - no assumptions

Return this JSON:

{
  "punchline": "One brutal truth about this interface that users feel immediately",
  "context": "Specific interface type based on what you observe",
  "industry": "Best guess at industry/vertical",
  "industryConfidence": 0.85,
  ${userContext ? '"interfaceType": "Inferred category from user context (be specific)",' : ''}
  ${userContext ? '"strategicIntent": "Inferred primary goal from user context",' : ''}
  "visualObservations": {
    "attentionFlow": [
      {
        "priority": 1,
        "element": "Exact element name/text you can see",
        "reasoning": "Large size + high contrast + center position",
        "timeSpent": "2-3 seconds",
        "focusWeight": "HIGH"
      },
      {
        "priority": 2,
        "element": "Second most prominent element",
        "reasoning": "Why this draws attention second",
        "timeSpent": "1-2 seconds",
        "focusWeight": "MEDIUM"
      },
      {
        "priority": 3,
        "element": "Third element in visual hierarchy",
        "reasoning": "Visual reasoning",
        "timeSpent": "1 second",
        "focusWeight": "LOW"
      }
    ],
    "textElements": ["exact text you can read in the image"],
    "ctaElements": ["actual CTA text if present"],
    "dominantColors": ["primary", "secondary", "accent"],
    "designStyle": "modern|outdated|professional|amateur",
    "emotionalTriggers": ["specific emotions the design evokes"]
  },
  "firstImpressionScore": 75,
  "reasoning": "Why users react this way in first 3 seconds"
}`;
    
    // Generate prompt hash for tracking
    const observationPromptHash = generatePromptHash(observationPrompt);
    
    const observationResponse = await createVisionChatCompletion(openai, {
      max_output_tokens: 2500,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: observationPrompt },
            { type: 'input_image', image_url: imageUrl, detail: 'high' }
          ]
        }
      ]
    });

    const observationData = extractAndParseJSON((observationResponse as any).output_text || '{}');
    console.log('[ANALYZE_IMAGE] Stage 1 complete - Observation data captured');

    // STAGE 2: INTERPRETATION WITH DARK PATTERN DETECTION
    console.log('[ANALYZE_IMAGE] Stage 2: Interpretation');
    onProgress?.(2);
    const interpretationResponse = await createVisionChatCompletion(openai, {
      max_output_tokens: 3500,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `You are a ruthless UX psychologist analyzing user manipulation and emotional response.

${groundTruthContext}

OBSERVATION DATA:
${JSON.stringify(observationData, null, 2)}

STAGE 2 - INTERPRET: Decode the psychological warfare.

Analyze:` },
            { type: 'input_image', image_url: imageUrl, detail: 'high' }
          ]
        }
      ]
    });

    const interpretationData = extractAndParseJSON((interpretationResponse as any).output_text || '{}');
    console.log('[ANALYZE_IMAGE] Stage 2 complete - Psychological analysis captured');

    // STAGE 3: RECOMMENDATIONS WITH DEDUPLICATION
    console.log('[ANALYZE_IMAGE] Stage 3: Recommendations');
    onProgress?.(3);
    const recommendationsResponse = await createVisionChatCompletion(openai, {
      max_output_tokens: 4500,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `You are a conversion optimization specialist providing surgical fixes.

${groundTruthContext}

OBSERVATION DATA:
${JSON.stringify(observationData, null, 2)}

INTERPRETATION DATA:
${JSON.stringify(interpretationData, null, 2)}

${contextPrompt}` },
            { type: 'input_image', image_url: imageUrl, detail: 'high' }
          ]
        }
      ]
    });

    const recommendationsData = extractAndParseJSON((recommendationsResponse as any).output_text || '{}');
    console.log('[ANALYZE_IMAGE] Stage 3 complete - Recommendations captured');

    // COMBINE ALL THREE STAGES
    console.log('[ANALYZE_IMAGE] Combining all stages into final analysis...');
    
    // Process dark patterns with enhanced risk data
    const processedDarkPatterns = (interpretationData.darkPatterns || []).map((dp: any) => ({
      type: dp.type,
      severity: dp.severity || (dp.riskLevel === 'HIGH' ? 'HIGH' : dp.riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW'),
      element: dp.element,
      location: dp.location,
      evidence: dp.evidence,
      impact: dp.impact,
      ethicalAlternative: dp.ethicalAlternative,
      // Add enhanced risk fields
      riskLevel: dp.riskLevel || 'MEDIUM',
      fallbackExplanation: dp.fallbackExplanation || 'No additional explanation provided'
    }));
    
    const combinedAnalysis = {
      // Context from observation
      context: observationData.context || 'UNKNOWN',
      industry: observationData.industry || 'UNKNOWN',
      industryConfidence: observationData.industryConfidence || 0,
      
      // Core data from recommendations
      ...recommendationsData,
      
      // Process dark patterns with enhanced data
      darkPatterns: processedDarkPatterns,
      
      // Add generational analysis from interpretation
      generationalAnalysis: {
        scores: interpretationData.generationalBreakdown || {},
        primaryTarget: getBestGenerationMatch(interpretationData.generationalBreakdown || {}),
        recommendations: getGenerationalRecommendations(interpretationData.generationalBreakdown || {})
      },
      
      // Add intent analysis from interpretation
      intentAnalysis: interpretationData.intentAnalysis || null,
      
      // Add inferred context from observation (if user provided context)
      interfaceType: observationData.interfaceType || undefined,
      strategicIntent: observationData.strategicIntent || undefined,
      userContext: userContext || undefined
    };

    // Check for duplicates and adjust module strengths
    const duplicatesByModule = checkForDuplication(combinedAnalysis);
    if (duplicatesByModule.size > 0) {
      console.log(`[DEDUP] Found duplicates in ${duplicatesByModule.size} modules`);
      // Reduce module strength for modules with duplicates
      if (combinedAnalysis.moduleStrength) {
        duplicatesByModule.forEach((duplicates, moduleName) => {
          if (duplicates.size > 0 && combinedAnalysis.moduleStrength[moduleName] !== undefined) {
            // Reduce strength by 1 for each duplicate found (minimum 1)
            combinedAnalysis.moduleStrength[moduleName] = Math.max(1, 
              combinedAnalysis.moduleStrength[moduleName] - duplicates.size
            );
            console.log(`[DEDUP] Reduced ${moduleName} strength to ${combinedAnalysis.moduleStrength[moduleName]}`);
          }
        });
      }
    }

    // Generate accessibility audit from extracted data (needs to be done before module strength calculation)
    const accessibilityAudit = generateAccessibilityAudit(extractedData);

    // Recalculate module strengths based on actual content
    if (combinedAnalysis.moduleStrength) {
      combinedAnalysis.moduleStrength = {
        issuesAndFixes: calculateModuleStrength(combinedAnalysis.issuesAndFixes, 'issuesAndFixes'),
        uxCopyInsights: calculateModuleStrength(combinedAnalysis.uxCopyInsights, 'uxCopyInsights'),
        visualDesign: calculateModuleStrength(combinedAnalysis.visualDesign, 'visualDesign'),
        darkPatterns: calculateModuleStrength(combinedAnalysis.darkPatterns, 'darkPatterns'),
        opportunities: calculateModuleStrength(combinedAnalysis.opportunities, 'opportunities'),
        frictionPoints: calculateModuleStrength(combinedAnalysis.frictionPoints, 'frictionPoints'),
        behavioralInsights: calculateModuleStrength(combinedAnalysis.behavioralInsights, 'behavioralInsights'),
        generationalAnalysis: calculateModuleStrength(combinedAnalysis.generationalAnalysis, 'generationalAnalysis'),
        accessibility: accessibilityAudit.score >= 80 ? 5 : accessibilityAudit.score >= 60 ? 4 : accessibilityAudit.score >= 40 ? 3 : accessibilityAudit.score >= 20 ? 2 : 1
      };
      
      // Update clarity flags based on module strength and content quality
      // A module has clarity if its strength is >= 3 OR it has substantial content
      if (combinedAnalysis.perceptionLayer?.clarityFlags) {
        // Simple inline bullshit checker
        const hasBullshitKeywords = (text: string) => {
          const bullshitTerms = ['email marketing', 'referral program', 'viral loop', 'leverage social', 'growth hack', 'newsletter', 'gamify'];
          const lowerText = text.toLowerCase();
          return bullshitTerms.some(term => lowerText.includes(term));
        };
        
        combinedAnalysis.perceptionLayer.clarityFlags = {
          uxCopy: combinedAnalysis.moduleStrength.uxCopyInsights >= 3 || 
                   (combinedAnalysis.uxCopyInsights?.issues?.length > 0),
          visual: combinedAnalysis.moduleStrength.visualDesign >= 3 || 
                  (combinedAnalysis.visualDesign?.tileFeedback?.length > 0) ||
                  (combinedAnalysis.visualDesign?.score > 60),
          darkPattern: combinedAnalysis.darkPatterns?.length > 0,
          behavioral: combinedAnalysis.moduleStrength.behavioralInsights >= 3 && 
                      combinedAnalysis.behavioralInsights?.some((b: any) => 
                        b.observation && !hasBullshitKeywords(b.observation)
                      ),
          strategicIntent: combinedAnalysis.intentAnalysis?.alignmentScore >= 3,
          accessibility: combinedAnalysis.moduleStrength.accessibility >= 3 || 
                         (accessibilityAudit.score >= 60),
          issuesAndFixes: combinedAnalysis.issuesAndFixes?.length > 0,
          opportunities: combinedAnalysis.opportunities?.some((o: any) => 
                        o.opportunity && !hasBullshitKeywords(o.opportunity) && 
                        o.location?.element !== 'Where to add this'
                       ) || false
        };
      }
    }

    // Add extracted data and heatmap data to the final analysis
    const finalAnalysis = {
      ...combinedAnalysis,
      extractedData, // ADD THIS - Include the extracted data
      heatmapData, // ADD THIS - Include heatmap data if available
      accessibilityAudit, // ADD THIS - Include accessibility analysis
    };

    // Calculate diagnostics for debugging and transparency
    const totalInsights = 
      (finalAnalysis.issuesAndFixes?.length || 0) +
      (finalAnalysis.opportunities?.length || 0) +
      (finalAnalysis.uxCopyInsights?.issues?.length || 0) +
      (finalAnalysis.behavioralInsights?.length || 0) +
      (finalAnalysis.darkPatterns?.length || 0) +
      (finalAnalysis.frictionPoints?.length || 0);
    
    // Identify active modules (non-empty with actual content)
    const activeModules: string[] = [];
    if (finalAnalysis.issuesAndFixes?.length > 0) activeModules.push('issuesAndFixes');
    if (finalAnalysis.opportunities?.length > 0) activeModules.push('opportunities');
    if (finalAnalysis.uxCopyInsights?.issues?.length > 0) activeModules.push('uxCopyInsights');
    if (finalAnalysis.behavioralInsights?.length > 0) activeModules.push('behavioralInsights');
    if (finalAnalysis.darkPatterns?.length > 0) activeModules.push('darkPatterns');
    if (finalAnalysis.frictionPoints?.length > 0) activeModules.push('frictionPoints');
    if (finalAnalysis.visualDesign?.tileFeedback?.length > 0) activeModules.push('visualDesign');
    
    const weakModules: string[] = [];
    if (finalAnalysis.moduleStrength) {
      Object.entries(finalAnalysis.moduleStrength).forEach(([module, strength]) => {
        if (typeof strength === 'number' && strength <= 2) weakModules.push(module);
      });
    }
    
    // Enhanced diagnostics block
    finalAnalysis.diagnostics = {
      totalInsights,
      duplicateInsightCount: duplicatesByModule.size,
      activeModules,
      weakModules,
      visionDataUsed: false, // Vision API removed
      userContextProvided: !!userContext,
      analysisComplete: true
    };
    
    // Add metadata with model configuration
    finalAnalysis.timestamp = new Date().toISOString();
    finalAnalysis.gptVersion = GPT_VERSION;
    finalAnalysis.modelConfig = {
      model: VISION_MODEL,
      version: GPT_VERSION,
      promptHash: observationPromptHash // Track prompt changes
    };

    // Ensure attention flow has at least 3 items
    if (finalAnalysis.perceptionLayer?.attentionFlow?.length < 3) {
      console.log('[FIX] Attention flow has less than 3 items, using fallback');
      if (finalAnalysis.verdict?.attentionFlow?.length >= 3) {
        finalAnalysis.perceptionLayer.attentionFlow = finalAnalysis.verdict.attentionFlow;
      }
    }
    
    // Sync attention flow between perceptionLayer and verdict
    // verdict.attentionFlow shows only top 3 items for UI display to reduce visual overload
    if (finalAnalysis.perceptionLayer?.attentionFlow && finalAnalysis.verdict) {
      finalAnalysis.verdict.attentionFlow = finalAnalysis.perceptionLayer.attentionFlow.slice(0, 3);
    }

    console.log('[✅ ENHANCED ANALYSIS COMPLETE]', {
      stages: 3,
      hasPerceptionLayer: !!finalAnalysis.perceptionLayer,
      hasModuleStrength: !!finalAnalysis.moduleStrength,
      attentionFlowCount: finalAnalysis.perceptionLayer?.attentionFlow?.length || 0,
      darkPatternsFound: finalAnalysis.darkPatterns?.length || 0,
      duplicatesFound: duplicatesByModule.size,
      visionEnhanced: false, // Vision API removed
      userContextProvided: !!userContext,
      gptVersion: GPT_VERSION
    });

    onProgress?.(4); // Analysis complete
    return finalAnalysis;

  } catch (error) {
    console.error('[ANALYZE_IMAGE] Enhanced analysis failed:', error);
    
    // Enhanced error handling
    const errorAnalysis: ZombifyAnalysis = {
      context: 'ERROR',
      industry: 'UNKNOWN',
      industryConfidence: 0,
      darkPatterns: [],
      intentAnalysis: {
        perceivedPurpose: 'Unknown',
        actualPurpose: 'Unknown',
        clarity: 'unclear',
        alignmentScore: 0,
        misalignments: [],
        clarityImprovements: []
      },
      frictionPoints: [],
      gripScore: {
        overall: 0,
        breakdown: {
          firstImpression: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          usability: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          trustworthiness: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          conversion: { score: 0, reasoning: 'Analysis failed', evidence: [] }
        }
      },
      verdict: {
        summary: 'ANALYSIS FAILED: Unable to process the interface. The system encountered an error.',
        attentionSpan: 'Unable to analyze',
        likelyAction: 'Unable to analyze',
        dropoffPoint: 'Unable to analyze',
        memorable: 'Unable to analyze',
        attentionFlow: []
      },
      perceptionLayer: {
        primaryEmotion: { type: 'confusion', intensity: 10 },
        attentionFlow: [],
        clarityFlags: {
          uxCopy: false,
          visual: false,
          darkPattern: false,
          behavioral: false,
          strategicIntent: false,
          accessibility: false,
          issuesAndFixes: false,
          opportunities: false
        }
      },
      moduleStrength: {
        issuesAndFixes: 0,
        uxCopyInsights: 0,
        visualDesign: 0,
        darkPatterns: 0,
        opportunities: 0,
        frictionPoints: 0,
        behavioralInsights: 0,
        generationalAnalysis: 0,
        accessibility: 0
      },
      visualDesign: {
        score: 0,
        typography: {
          score: 0,
          issues: [],
          hierarchy: { recommendation: 'Analysis failed' },
          readability: { recommendation: 'Analysis failed' }
        },
        colorAndContrast: {
          score: 0,
          contrastFailures: [],
          colorHarmony: { scheme: 'UNKNOWN', brandColors: [], accentSuggestion: 'Analysis failed' }
        },
        spacing: {
          score: 0,
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
      uxCopyInsights: {
        score: 0,
        audienceAlignment: {
          detectedAudience: 'Unknown',
          copyStyle: 'Unknown',
          brandArchetype: 'Unknown',
          toneMismatch: 0
        },
        issues: [],
        microCopyOpportunities: [],
        writingTone: {
          current: 'Unknown',
          recommended: 'Unknown',
          example: 'Analysis failed'
        }
      },
      issuesAndFixes: [
        {
          severity: 4,
          category: 'SYSTEM_ERROR',
          issue: error instanceof Error && error.message.includes('Timeout') 
            ? 'Image download timeout' 
            : 'Analysis service error',
          location: {
            element: 'system',
            region: 'none'
          },
          impact: 'Unable to analyze the uploaded image',
          evidence: error instanceof Error ? error.message : 'Unknown error occurred',
          fix: {
            immediate: error instanceof Error && error.message.includes('Timeout')
              ? 'Try uploading a smaller image (under 5MB)'
              : 'Please check your API key and try again',
            better: error instanceof Error && error.message.includes('Timeout')
              ? 'Optimize your image before uploading (reduce resolution or compress)'
              : 'Ensure the image is in a supported format (PNG, JPG, GIF)',
            implementation: 'Use an image optimization tool or check service status'
          }
        }
      ],
      opportunities: [],
      behavioralInsights: [],
      generationalAnalysis: {
        scores: {},
        primaryTarget: 'unknown',
        recommendations: []
      },
      timestamp: new Date().toISOString(),
      error: true
    };

    return errorAnalysis;
  }
}

// Helper functions for generational analysis
function getBestGenerationMatch(generationalData: any): string {
  if (!generationalData) return 'millennials';
  
  let bestScore = 0;
  let bestGeneration = 'millennials';
  
  Object.entries(generationalData).forEach(([gen, data]: [string, any]) => {
    if (data && data.score > bestScore) {
      bestScore = data.score;
      bestGeneration = gen;
    }
  });
  
  return bestGeneration;
}

function getGenerationalRecommendations(generationalData: any): string[] {
  if (!generationalData) return [];
  
  const recommendations: string[] = [];
  
  Object.entries(generationalData).forEach(([gen, data]: [string, any]) => {
    if (data && data.improvements) {
      recommendations.push(`${gen}: ${data.improvements}`);
    }
  });
  
  return recommendations.slice(0, 3);
}