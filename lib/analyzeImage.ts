// analyzeImage.ts - Enhanced with all new features including PerceptionLayer and ModuleStrength
import { 
  ZombifyAnalysis, 
  VisionAnalysisResult, 
  AttentionFlowItem,
  DarkPattern,
  Issue,
  PerceptionLayer,
  ModuleStrength,
  EnhancedBehavioralInsight,
  VisualDesignFeedback
} from '@/types/analysis';
import crypto from 'crypto';

// Model version tracking
const GPT_MODEL = 'gpt-4o';
const GPT_VERSION = 'gpt-4o-2025-08-04';

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

// Keep your existing analyzeImageWithVision function
async function analyzeImageWithVision(imageUrl: string): Promise<VisionAnalysisResult | null> {
  try {
    console.log('[VISION_API] Starting Vision analysis for:', imageUrl);
    
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.log('[VISION_API] No Vision API key found, skipping Vision analysis');
      return null;
    }

    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    
    const client = new ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
    });

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

    const textAnnotations: any[] = [];
    if (textResult[0].textAnnotations && textResult[0].textAnnotations.length > 1) {
      for (let i = 1; i < textResult[0].textAnnotations.length; i++) {
        const annotation = textResult[0].textAnnotations[i];
        if (annotation.description && annotation.boundingPoly?.vertices) {
          textAnnotations.push({
            text: annotation.description,
            confidence: 0.9,
            boundingBox: convertBoundingBox(annotation.boundingPoly.vertices)
          });
        }
      }
    }

    const logoAnnotations = (logoResult[0].logoAnnotations || []).map(logo => ({
      description: logo.description || '',
      confidence: logo.score || 0,
      boundingBox: convertBoundingBox(logo.boundingPoly?.vertices || [])
    }));

    const dominantColors = (propertiesResult[0].imagePropertiesAnnotation?.dominantColors?.colors || []).map(colorInfo => ({
      color: {
        red: Math.round(colorInfo.color?.red || 0),
        green: Math.round(colorInfo.color?.green || 0),
        blue: Math.round(colorInfo.color?.blue || 0)
      },
      score: colorInfo.score || 0,
      pixelFraction: colorInfo.pixelFraction || 0
    }));

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
    return null;
  }
}

// Enhanced location processing - ChatGPT feedback #5
function enhanceLocationWithVision(element: string, region: string, visionData: VisionAnalysisResult | null) {
  if (!visionData) {
    return {
      element,
      region,
      visualContext: `Look for "${element}" in the ${region.toLowerCase()} area of the interface`
    };
  }

  // Try to find matching text elements
  const matchingText = visionData.textAnnotations?.find((annotation: any) => 
    annotation.text.toLowerCase().includes(element.toLowerCase()) ||
    element.toLowerCase().includes(annotation.text.toLowerCase())
  );

  let visualContext = `Look for "${element}" in the ${region.toLowerCase()}`;
  
  if (matchingText) {
    const { x, y, height } = matchingText.boundingBox;
    
    // Add precise position context
    if (y < 100) visualContext += " at the top of the page";
    else if (y > 500) visualContext += " towards the bottom";
    else visualContext += " in the middle section";
    
    if (x < 200) visualContext += ", on the left side";
    else if (x > 600) visualContext += ", on the right side";
    else visualContext += ", centered horizontally";

    // Add size context for easier finding
    if (height > 40) visualContext += ". This is large, prominent text that should be easy to spot.";
    else if (height < 16) visualContext += ". This is small text that may be easy to miss - look carefully.";
    else visualContext += ". This is medium-sized text.";

    // Add nearby elements for context
    const nearbyElements = visionData.textAnnotations
      ?.filter((annotation: any) => 
        annotation.text !== matchingText.text &&
        Math.abs(annotation.boundingBox.y - y) < 100
      )
      ?.slice(0, 2)
      ?.map((annotation: any) => `"${annotation.text}"`)
      ?.join(' and ');

    if (nearbyElements) {
      visualContext += ` Look for it near ${nearbyElements}.`;
    }
  }

  return {
    element,
    region,
    visualContext
  };
}

// Enhanced analysis with Vision data
function enhanceAnalysisWithVision(analysis: any, visionData: VisionAnalysisResult | null): any {
  if (!visionData) {
    console.log('[ENHANCE] No vision data available, returning original analysis');
    return analysis;
  }

  console.log('[ENHANCE] Enhancing analysis with Vision data...');

  // Enhanced locations for critical issues - ChatGPT feedback #5
  if (analysis.criticalIssues) {
    analysis.criticalIssues = analysis.criticalIssues.map((issue: any) => ({
      ...issue,
      location: issue.location ? enhanceLocationWithVision(
        issue.location.element,
        issue.location.region,
        visionData
      ) : undefined
    }));
  }

  // Enhanced locations for opportunities
  if (analysis.opportunities) {
    analysis.opportunities = analysis.opportunities.map((opp: any) => ({
      ...opp,
      location: opp.location ? enhanceLocationWithVision(
        opp.location.element,
        opp.location.region,
        visionData
      ) : undefined
    }));
  }

  // Calculate real contrast ratios for automated accessibility
  const contrastIssues: any[] = [];
  const dominantColors = visionData.imageProperties.dominantColors;
  
  if (dominantColors.length >= 2) {
    const color1 = dominantColors[0].color;
    const color2 = dominantColors[1].color;
    const contrast = calculateContrast(color1, color2);
    
    if (contrast < 4.5) {
      contrastIssues.push({
        element: 'Dominant color combination',
        contrastRatio: contrast,
        wcagLevel: 'AA' as const,
        passes: false,
        fix: contrast < 3 
          ? 'Increase contrast significantly - current ratio is too low for any WCAG standard'
          : 'Increase contrast slightly to meet WCAG AA standard (4.5:1 minimum)'
      });
    }
  }

  // Detect small text that might be hard to read
  const smallTextElements = visionData.textAnnotations.filter(text => {
    return text.boundingBox.height < 14; // Approximately 16px or smaller
  });

  // Enhanced accessibility audit with automated checks
  const enhancedAccessibilityAudit = {
    ...analysis.accessibilityAudit,
    automated: true,
    colorContrast: {
      issues: contrastIssues
    },
    textSize: smallTextElements.length > 0 ? {
      smallTextCount: smallTextElements.length,
      minimumSize: `${Math.min(...smallTextElements.map(t => t.boundingBox.height))}px estimated`,
      recommendation: `Consider increasing size of ${smallTextElements.length} small text elements for better readability`
    } : {
      smallTextCount: 0,
      minimumSize: 'All text appears adequately sized',
      recommendation: 'Text sizes appear appropriate for readability'
    },
    overallRecommendation: contrastIssues.length > 0 || smallTextElements.length > 0
      ? 'Improve color contrast and increase small text sizes for better accessibility'
      : 'Visual accessibility appears good based on automated analysis'
  };

  // Enhanced visual design analysis with Vision data - check if visualDesign exists
  const enhancedVisualDesign = analysis.visualDesign ? {
    ...analysis.visualDesign,
    colorAndContrast: {
      ...analysis.visualDesign.colorAndContrast,
      measuredContrasts: contrastIssues.map(issue => ({
        severity: issue.contrastRatio < 3 ? 'HIGH' : 'MEDIUM',
        colors: [dominantColors[0].color, dominantColors[1].color],
        ratio: issue.contrastRatio.toFixed(2),
        recommendation: issue.fix
      })),
      dominantColorPalette: dominantColors.slice(0, 5).map(c => ({
        hex: rgbToHex(c.color),
        percentage: (c.pixelFraction * 100).toFixed(1) + '%'
      }))
    },
    typography: {
      ...analysis.visualDesign.typography,
      smallTextWarnings: smallTextElements.length > 0 ? {
        count: smallTextElements.length,
        message: `${smallTextElements.length} text elements may be too small for comfortable reading`
      } : null
    }
  } : null;

  return {
    ...analysis,
    accessibilityAudit: enhancedAccessibilityAudit,
    ...(enhancedVisualDesign && { visualDesign: enhancedVisualDesign }),
    visionData: {
      textCount: visionData.textAnnotations.length,
      hasLogos: visionData.logoAnnotations.length > 0,
      dominantColors: dominantColors,
      hasCTAs: visionData.textAnnotations.some(t => 
        ['buy', 'start', 'sign', 'get', 'download', 'submit', 'continue', 'next'].some(cta => 
          t.text.toLowerCase().includes(cta)
        )
      ),
      detectedText: visionData.textAnnotations.slice(0, 20).map(t => t.text)
    }
  };
}

// Helper functions
function calculateContrast(color1: any, color2: any): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function relativeLuminance(color: any): number {
  const rsRGB = color.red / 255;
  const gsRGB = color.green / 255;
  const bsRGB = color.blue / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToHex(color: any): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return '#' + toHex(color.red) + toHex(color.green) + toHex(color.blue);
}

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

// NEW: Check if two insights are similar (>60% threshold for more aggressive deduplication)
function isSimilarInsight(insightA: string, insightB: string): boolean {
  const similarity = calculateSimilarity(insightA, insightB);
  
  // Also check for common patterns that indicate duplication
  const a = insightA.toLowerCase();
  const b = insightB.toLowerCase();
  
  // Check if they're talking about the same UI element
  const commonElements = ['button', 'cta', 'form', 'header', 'navigation', 'text', 'color', 'contrast'];
  const sharedElement = commonElements.some(elem => 
    a.includes(elem) && b.includes(elem)
  );
  
  // If they share an element and have >60% similarity, they're duplicates
  return similarity > 0.6 || (sharedElement && similarity > 0.5);
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
      
    case 'accessibility':
      if (moduleData && moduleData.score !== undefined) {
        score = moduleData.score > 80 ? 2 : moduleData.score > 60 ? 3 : 4;
        // Boost if critical failures found
        if (moduleData.criticalFailures?.length > 0) score = Math.min(5, score + 1);
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

// MAIN ENHANCED FUNCTION WITH FIXED 3-PROMPT CHAIN
export async function analyzeImage(
  imageUrl: string, 
  userContext?: string,
  previousAnalysis?: ZombifyAnalysis // For future multi-upload comparison
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
    // Step 1: Run Vision API FIRST to get element data
    console.log('[ANALYZE_IMAGE] Starting Vision API analysis...');
    const visionData = await analyzeImageWithVision(imageUrl);
    
    // Step 2: Prepare Vision context
    let visionContext = '';
    if (visionData) {
      visionContext = `
VISION API DATA AVAILABLE - YOU MUST USE THIS DATA:
- Detected ${visionData.textAnnotations.length} text elements
- Found ${visionData.logoAnnotations.length} logos/brand elements
- Dominant colors: ${visionData.imageProperties.dominantColors.slice(0, 3).map(c => 
  `rgb(${c.color.red},${c.color.green},${c.color.blue})`
).join(', ')}
- Text elements: ${visionData.textAnnotations.slice(0, 15).map(t => `"${t.text}"`).join(', ')}${visionData.textAnnotations.length > 15 ? '...' : ''}

CRITICAL: Reference this actual text and color data in your analysis. Do not make up elements you cannot see.
`;
    }
    
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[ANALYZE_IMAGE] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
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
    const observationPrompt = `You are a glitchy oracle who's seen 10,000 failed startups. Your job is to decode interface psychology with brutal honesty.

${visionContext}
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
5. What text/CTAs can you see from Vision data?
6. Is this modern or dated? Why?

CRITICAL FOR ATTENTION FLOW:
- List 3-6 elements in order of visual dominance
- Consider: size, color contrast, position, whitespace
- First element = what eyes land on immediately
- Include actual element names from Vision data

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
        "element": "Exact element name from Vision data",
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
    "textElements": ["exact text from Vision data only"],
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
    
    const observationResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: observationPrompt
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    });

    const observationData = extractAndParseJSON(observationResponse.choices[0]?.message?.content || '{}');
    console.log('[ANALYZE_IMAGE] Stage 1 complete - Observation data captured');

    // STAGE 2: INTERPRETATION WITH DARK PATTERN DETECTION
    console.log('[ANALYZE_IMAGE] Stage 2: Interpretation');
    const interpretationResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a ruthless UX psychologist analyzing user manipulation and emotional response.

OBSERVATION DATA:
${JSON.stringify(observationData, null, 2)}

${visionContext}

STAGE 2 - INTERPRET: Decode the psychological warfare.

Analyze:
1. Primary emotion triggered (with 1-10 intensity)
2. How users will actually behave vs intended behavior
3. Dark patterns - ENHANCED DETECTION with risk assessment:
   For each potential dark pattern, evaluate:
   - manipulativeness: 1-10 scale (how much it exploits psychology)
   - intent: true/false (is it deceptive?)
   - impact: LOW/MEDIUM/HIGH (harm to user goals)
   
   ONLY flag as dark pattern if ALL conditions met:
   - manipulativeness >= 6
   - intent === true
   - impact === MEDIUM or HIGH
   
   Include fallbackExplanation for why something was/wasn't flagged
4. Business intent vs user perception alignment
5. Generational responses to design

Return JSON:

{
  "psychologicalAnalysis": {
    "primaryEmotion": "trust|anxiety|excitement|confusion|frustration|delight|anticipation|skepticism",
    "intensity": 7,
    "reasoning": "Specific elements from Vision data causing this emotion",
    "behavioralPrediction": "Users will likely... vs business wants them to..."
  },
  "generationalBreakdown": {
    "genAlpha": {
      "score": 45,
      "reasoning": "Lacks gamification and instant gratification elements",
      "specificIssues": ["No interactive elements", "Static design"],
      "improvements": "Add micro-interactions and achievement systems"
    },
    "genZ": {
      "score": 72,
      "reasoning": "Visual-first but missing authenticity markers",
      "specificIssues": ["Stock photos", "Corporate tone"],
      "improvements": "Use real user content and casual language"
    },
    "millennials": {
      "score": 85,
      "reasoning": "Clear value prop and efficiency-focused",
      "specificIssues": ["Could use more personalization"],
      "improvements": "Add customization options"
    },
    "genX": {
      "score": 78,
      "reasoning": "Professional but needs more details",
      "specificIssues": ["Missing comprehensive features list"],
      "improvements": "Add detailed specifications"
    },
    "boomers": {
      "score": 65,
      "reasoning": "Text could be larger, navigation complex",
      "specificIssues": ["Small fonts", "Unclear navigation"],
      "improvements": "Increase text size, simplify menu"
    }
  },
  "darkPatterns": [
    {
      "type": "URGENCY_MANIPULATION",
      "severity": "HIGH",
      "element": "Exact text showing fake urgency",
      "location": "Where this appears",
      "evidence": "Timer resets on refresh + no real inventory",
      "impact": "Erodes trust when users discover deception",
      "ethicalAlternative": "Show real inventory or remove timer",
      "riskLevel": "HIGH",
      "manipulativeness": 8,
      "intent": true,
      "impactLevel": "HIGH",
      "fallbackExplanation": "Flagged because it uses false scarcity (manipulativeness=8) with deceptive intent to pressure purchases"
    }
  ],
  "intentAnalysis": {
    "perceivedPurpose": "What users think this is for",
    "actualPurpose": "What business actually wants",
    "clarity": "clear|mixed|unclear",
    "alignmentScore": 3,
    "misalignments": ["Specific conflicts between perception and intent"],
    "clarityImprovements": ["How to align user and business goals"]
  }
}`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    });

    const interpretationData = extractAndParseJSON(interpretationResponse.choices[0]?.message?.content || '{}');
    console.log('[ANALYZE_IMAGE] Stage 2 complete - Psychological analysis captured');

    // STAGE 3: RECOMMENDATIONS WITH DEDUPLICATION
    console.log('[ANALYZE_IMAGE] Stage 3: Recommendations');
    const recommendationsResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 4500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a conversion optimization specialist providing surgical fixes.

OBSERVATION DATA:
${JSON.stringify(observationData, null, 2)}

INTERPRETATION DATA:
${JSON.stringify(interpretationData, null, 2)}

${visionContext}
${contextPrompt}

STAGE 3 - RECOMMEND: Provide actionable fixes with NO DUPLICATION.

CRITICAL RULES:
1. Each insight should appear ONLY ONCE across all sections
2. Visual design should focus on spacing, typography, layout - NOT copy issues
3. UX copy should focus on messaging and tone - NOT visual presentation
4. Don't assume everything is about conversion - respect the interface type
5. Score each module's quality (1-5) based on how useful the insights are
6. Include clarity flags (true/false) for confidence in each analysis

SIGNAL QUALITY RULE: Only include a module if there is REAL SIGNAL.
- Empty or generic modules waste user time and reduce trust
- Better to have 3 high-quality modules than 6 mediocre ones
- If you can't find specific, actionable insights for a module, set its clarity flag to false

ANTI-BULLSHIT RULES - NEVER suggest these unless you can see them in the UI:
- Email marketing, newsletters, lead magnets
- Referral programs, affiliate marketing
- Social media campaigns, influencer marketing
- Gamification (unless game elements are visible)
- Generic growth hacks, viral loops
- Community building (unless community features are visible)
- A/B testing everything
- SEO optimization

FRICTION POINT RULES - ONLY identify friction from VISIBLE UI elements:
- Evidence MUST quote actual text or describe specific visual issues
- Valid friction examples:
  * "Submit button is gray (#ccc) on light gray background - hard to see"
  * "Form shows 12 required fields with no progress indicator"
  * "Error messages appear in small text below the fold"
- BANNED generic phrases:
  * "Users don't understand value prop" (without quoting actual confusing text)
  * "Improve trust" (without specific trust-breaking element)
  * "Optimize conversion funnel" (too vague)
  * "Add social proof" (unless you see missing testimonials/reviews)

Journey stages should match what you actually see:
- ENTRY: Issues understanding what this interface is/does
- EXPLORATION: Problems finding or accessing features
- TASK: Obstacles completing the main action
- COMPLETION: Barriers to finishing the workflow

ONLY suggest improvements for what you can SEE in the interface.
Every suggestion must reference a specific UI element from the Vision data.

Return JSON:

{
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": {"score": 80, "reasoning": "Clear value prop but overwhelming options", "evidence": ["Large hero text visible", "Multiple CTAs competing"]},
      "usability": {"score": 70, "reasoning": "Navigation clear but form complex", "evidence": ["Menu structure logical", "Form has 12 fields"]},
      "trustworthiness": {"score": 75, "reasoning": "Professional design but lacks social proof", "evidence": ["Clean layout", "No testimonials found"]},
      "conversion": {"score": 65, "reasoning": "CTAs present but not optimally placed", "evidence": ["CTA below fold", "Weak action words"]},
      "accessibility": {"score": 60, "reasoning": "Poor color contrast and small text", "evidence": ["Gray on white text", "14px font size"]}
    }
  },
  "perceptionLayer": {
    "primaryEmotion": {
      "type": "${interpretationData.psychologicalAnalysis?.primaryEmotion || 'confusion'}",
      "intensity": ${interpretationData.psychologicalAnalysis?.intensity || 5}
    },
    "attentionFlow": ${JSON.stringify(observationData.visualObservations?.attentionFlow || [])},
    "clarityFlags": {
      "uxCopy": true,
      "visual": true,
      "darkPattern": true,
      "behavioral": true,
      "accessibility": true
    }
  },
  "verdict": {
    "summary": "${observationData.punchline} The ${interpretationData.psychologicalAnalysis?.primaryEmotion || 'confused'} user faces ${interpretationData.darkPatterns?.length || 0} manipulation tactics while trying to ${interpretationData.intentAnalysis?.perceivedPurpose || 'complete their task'}.",
    "attentionSpan": "Power users: 3-5 minutes. Casual visitors: 15-30 seconds before bounce.",
    "likelyAction": "Most will ${interpretationData.psychologicalAnalysis?.behavioralPrediction || 'leave confused'}",
    "dropoffPoint": "Primary abandonment at ${observationData.visualObservations?.attentionFlow?.[2]?.element || 'third element'}",
    "memorable": "The ${observationData.visualObservations?.emotionalTriggers?.[0] || 'confusion'} from ${observationData.visualObservations?.attentionFlow?.[0]?.element || 'main element'}",
    "attentionFlow": ${JSON.stringify(observationData.visualObservations?.attentionFlow || [])}
  },
  "issuesAndFixes": [
    {
      "severity": 3,
      "category": "HIERARCHY",
      "issue": "Most critical usability/hierarchy problem (not copy or visual style)",
      "area": "Specific interface section",
      "location": {
        "element": "Exact element name from Vision data",
        "region": "Top header|Main content|etc"
      },
      "impact": "Quantified business impact",
      "evidence": "What proves this is a problem",
      "fix": {
        "immediate": "Quick fix in 1 day",
        "better": "Optimal fix in 1 week",
        "implementation": "Step-by-step implementation"
      }
    }
  ],
  "uxCopyInsights": {
    "score": 70,
    "audienceAlignment": {
      "detectedAudience": "Professional|Consumer|Technical|etc",
      "copyStyle": "Formal|Casual|Technical|etc",
      "brandArchetype": "Expert|Friend|Guide|etc",
      "toneMismatch": 35
    },
    "issues": [
      {
        "severity": "HIGH",
        "element": "Exact text from Vision data",
        "location": "Where this appears",
        "issue": "Why this copy fails (focus on messaging, not visuals)",
        "psychologicalImpact": "How this affects user emotions",
        "audienceSpecific": {
          "genZ": "Rewrite for Gen Z",
          "millennial": "Rewrite for Millennials",
          "corporate": "Rewrite for B2B"
        },
        "suggested": ["Better option 1", "Better option 2"],
        "impact": "Expected improvement",
        "reasoning": "UX writing principle"
      }
    ],
    "microCopyOpportunities": [
      {
        "type": "ERROR_MESSAGING",
        "current": "Current message",
        "location": "Where it appears",
        "issue": "Why it's unclear",
        "improved": "Clearer version",
        "reasoning": "UX principle applied"
      }
    ],
    "writingTone": {
      "current": "Observed tone",
      "recommended": "Better tone for audience",
      "example": "Specific rewrite"
    }
  },
  "visualDesign": {
    "score": 75,
    "typography": {
      "score": 80,
      "issues": [],
      "hierarchy": {"h1ToH2Ratio": 1.5, "consistencyScore": 85, "recommendation": "Hierarchy is clear"},
      "readability": {"fleschScore": 65, "avgLineLength": 12, "recommendation": "Good readability"}
    },
    "colorAndContrast": {
      "score": 70,
      "contrastFailures": [],
      "colorHarmony": {"scheme": "Complementary", "brandColors": ["#actual colors"], "accentSuggestion": "Add warmer accent"}
    },
    "spacing": {"score": 75, "gridSystem": "CSS Grid", "consistency": 80, "issues": []},
    "modernPatterns": {"detected": ["Cards", "Gradients"], "implementation": {}, "trendAlignment": {"2025Relevance": 70, "suggestions": ["Add glassmorphism"]}},
    "visualHierarchy": {"scanPattern": "F-pattern", "focalPoints": [{"element": "Hero", "weight": 9}], "improvements": []},
    "tileFeedback": [
      {
        "area": "Navigation bar",
        "feedback": "Items spaced inconsistently - standardize to 24px gaps for cleaner look",
        "confidence": 0.9
      },
      {
        "area": "Hero section",
        "feedback": "Strong focal point with clear visual hierarchy directing eyes to headline first",
        "confidence": 0.85
      },
      {
        "area": "Button styling",
        "feedback": "Primary CTA could be 20% larger to improve thumb-tap accuracy on mobile",
        "confidence": 0.8
      },
      {
        "area": "Footer",
        "feedback": "Text at 12px is too small for comfortable mobile reading - increase to 14px minimum",
        "confidence": 0.9
      }
    ]
  },
  "opportunities": [
    {
      "category": "ENGAGEMENT|TRUST|CLARITY|CONVERSION",
      "opportunity": "Specific improvement based on VISIBLE UI elements only",
      "potentialImpact": "Measurable impact (e.g., 'Reduce form abandonment by 20%')",
      "implementation": "Step-by-step changes to existing UI elements",
      "reasoning": "Based on what I can see: [specific element] could be improved because...",
      "location": {
        "element": "EXACT element name from Vision data that needs improvement",
        "region": "EXACT region where this element exists"
      }
    }
  ],
  "frictionPoints": [
    {
      "stage": "ENTRY|EXPLORATION|TASK|COMPLETION",
      "friction": "Specific UI obstacle preventing smooth interaction",
      "evidence": "EXACT description of problematic element - quote text or describe specific visual issue",
      "dropoffRisk": "HIGH|MEDIUM|LOW based on impact severity",
      "quickFix": "Specific change to [named UI element]",
      "impact": "Clear benefit (e.g., 'Easier navigation', 'Clearer feedback')"
    }
  ],
  "behavioralInsights": [
    {
      "pattern": "Specific behavioral pattern observed in the UI",
      "observation": "What I can see: [exact elements and their arrangement]",
      "psychology": "Why this specific UI pattern affects user behavior",
      "emotionalImpact": {
        "primaryEmotion": "${interpretationData.psychologicalAnalysis?.primaryEmotion || 'confusion'}",
        "intensity": ${interpretationData.psychologicalAnalysis?.intensity || 5},
        "reasoning": "How these specific UI elements trigger this emotion"
      },
      "recommendation": "Change [specific element] to [specific improvement]"
    }
  ],
  "darkPatterns": [
    {
      "type": "URGENCY_MANIPULATION",
      "severity": "HIGH", 
      "element": "Exact element from Vision data",
      "location": "Where this appears",
      "evidence": "What makes this manipulative",
      "impact": "How this affects users",
      "ethicalAlternative": "Better approach",
      "riskLevel": "HIGH"
    }
  ],
  "accessibility": {
    "score": 65,
    "wcagLevel": "AA",
    "strengths": ["Semantic HTML structure"],
    "weaknesses": ["Poor color contrast", "Small text"],
    "criticalFailures": [],
    "recommendations": [
      {"priority": "HIGH", "action": "Increase text contrast to 4.5:1", "effort": "LOW"},
      {"priority": "MEDIUM", "action": "Add alt text to images", "effort": "LOW"}
    ]
  },
  "moduleStrength": {
    "issuesAndFixes": 4,
    "uxCopyInsights": 3,
    "visualDesign": 4,
    "darkPatterns": 0,
    "accessibility": 3,
    "opportunities": 3,
    "frictionPoints": 4,
    "behavioralInsights": 4,
    "generationalAnalysis": 3
  }
}`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    });

    const recommendationsData = extractAndParseJSON(recommendationsResponse.choices[0]?.message?.content || '{}');
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

    // Recalculate module strengths based on actual content
    if (combinedAnalysis.moduleStrength) {
      combinedAnalysis.moduleStrength = {
        issuesAndFixes: calculateModuleStrength(combinedAnalysis.issuesAndFixes, 'issuesAndFixes'),
        uxCopyInsights: calculateModuleStrength(combinedAnalysis.uxCopyInsights, 'uxCopyInsights'),
        visualDesign: calculateModuleStrength(combinedAnalysis.visualDesign, 'visualDesign'),
        darkPatterns: calculateModuleStrength(combinedAnalysis.darkPatterns, 'darkPatterns'),
        accessibility: calculateModuleStrength(combinedAnalysis.accessibility, 'accessibility'),
        opportunities: calculateModuleStrength(combinedAnalysis.opportunities, 'opportunities'),
        frictionPoints: calculateModuleStrength(combinedAnalysis.frictionPoints, 'frictionPoints'),
        behavioralInsights: calculateModuleStrength(combinedAnalysis.behavioralInsights, 'behavioralInsights'),
        generationalAnalysis: calculateModuleStrength(combinedAnalysis.generationalAnalysis, 'generationalAnalysis')
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
          accessibility: combinedAnalysis.moduleStrength.accessibility >= 3 || 
                         (combinedAnalysis.accessibility?.score > 50),
          strategicIntent: combinedAnalysis.intentAnalysis?.alignmentScore >= 3,
          issuesAndFixes: combinedAnalysis.issuesAndFixes?.length > 0,
          opportunities: combinedAnalysis.opportunities?.some((o: any) => 
                        o.opportunity && !hasBullshitKeywords(o.opportunity) && 
                        o.location?.element !== 'Where to add this'
                       ) || false
        };
      }
    }

    // Step 4: Enhance with Vision data
    const finalAnalysis = enhanceAnalysisWithVision(combinedAnalysis, visionData);

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
    if (finalAnalysis.accessibility?.score > 0) activeModules.push('accessibility');
    
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
      visionDataUsed: !!visionData,
      userContextProvided: !!userContext,
      analysisComplete: true
    };
    
    // Add metadata with model configuration
    finalAnalysis.timestamp = new Date().toISOString();
    finalAnalysis.gptVersion = GPT_VERSION;
    finalAnalysis.modelConfig = {
      model: GPT_MODEL,
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
      visionEnhanced: !!visionData,
      userContextProvided: !!userContext,
      gptVersion: GPT_VERSION
    });

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
          conversion: { score: 0, reasoning: 'Analysis failed', evidence: [] },
          accessibility: { score: 0, reasoning: 'Analysis failed', evidence: [] }
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
          accessibility: false,
          strategicIntent: false,
          issuesAndFixes: false,
          opportunities: false
        }
      },
      moduleStrength: {
        issuesAndFixes: 0,
        uxCopyInsights: 0,
        visualDesign: 0,
        darkPatterns: 0,
        accessibility: 0,
        opportunities: 0,
        frictionPoints: 0,
        behavioralInsights: 0,
        generationalAnalysis: 0
      },
      visualDesign: {
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
      accessibilityAudit: null,
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