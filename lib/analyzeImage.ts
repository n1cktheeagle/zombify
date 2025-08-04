// analyzeImage.ts - Enhanced with ALL ChatGPT feedback implementation
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

  // Enhanced visual design analysis with Vision data
  const enhancedVisualDesign = {
    ...analysis.visualDesignAnalysis,
    colorAndContrast: {
      ...analysis.visualDesignAnalysis.colorAndContrast,
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
      ...analysis.visualDesignAnalysis.typography,
      smallTextWarnings: smallTextElements.length > 0 ? {
        count: smallTextElements.length,
        message: `${smallTextElements.length} text elements may be too small for comfortable reading`
      } : null
    }
  };

  return {
    ...analysis,
    accessibilityAudit: enhancedAccessibilityAudit,
    visualDesignAnalysis: enhancedVisualDesign,
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

// MAIN ENHANCED FUNCTION WITH 3-PROMPT CHAIN - ChatGPT feedback #1, #2, #3, #4
export async function analyzeImage(imageUrl: string): Promise<ZombifyAnalysis> {
  console.log('[ANALYZE_IMAGE] Starting enhanced 3-stage prompt chain analysis for:', imageUrl);
  
  try {
    // Step 1: Run Vision API FIRST to get element data
    console.log('[ANALYZE_IMAGE] Starting Vision API analysis...');
    const visionData = await analyzeImageWithVision(imageUrl);
    
    // Step 2: Prepare Vision context - ChatGPT feedback #4 (mandatory usage)
    let visionContext = '';
    if (visionData) {
      visionContext = `
VISION API DATA AVAILABLE - MANDATORY TO USE:
- Detected ${visionData.textAnnotations.length} text elements
- Found ${visionData.logoAnnotations.length} logos/brand elements
- Dominant colors: ${visionData.imageProperties.dominantColors.slice(0, 3).map(c => 
  `rgb(${c.color.red},${c.color.green},${c.color.blue})`
).join(', ')}
- Text elements: ${visionData.textAnnotations.slice(0, 15).map(t => t.text).join(', ')}${visionData.textAnnotations.length > 15 ? '...' : ''}

MANDATORY: Use this data to make your analysis more specific and accurate. Do not guess about text, colors, or layout without referencing this data.
`;
    }
    
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[ANALYZE_IMAGE] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // STAGE 1: OBSERVATION - ChatGPT feedback #1 (break into stages)
    console.log('[ANALYZE_IMAGE] Stage 1: Observation');
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
              text: `You are a glitchy oracle who's seen 10,000 failed startups. You are not here to be polite. Your job is to decode interface psychology with brutal honesty.

${visionContext}

STAGE 1 - OBSERVE: Examine this interface with ruthless precision.

First, in 1 brutal sentence, state the most critical insight about this interface. Don't hold back. This is your punchline that will hit users in the face.

Then systematically observe:
- Interface type and industry context
- Visual hierarchy and attention flow (what draws eyes first, second, third)
- Text elements, CTA placement, and messaging tone
- Color psychology and emotional triggers
- Modern vs outdated design patterns
- Specific elements you can see using the Vision data

Return this JSON structure:

{
  "punchline": "One brutal sentence that captures the biggest insight - this will be the opening line",
  "context": "LANDING_PAGE|DASHBOARD|FORM|ECOMMERCE|MOBILE|etc",
  "industry": "SAAS|ECOMMERCE|FINTECH|HEALTHCARE|etc",
  "industryConfidence": 0.85,
  "visualObservations": {
    "attentionFlow": [
      {
        "priority": 1,
        "element": "Specific element name from Vision data",
        "reasoning": "Why this draws attention first",
        "timeSpent": "2-3 seconds evaluation time",
        "conversionImpact": "HIGH"
      }
    ],
    "textElements": ["exact text you can see from Vision data"],
    "ctaElements": ["specific call-to-action text"],
    "dominantColors": ["primary color", "secondary", "accent"],
    "designStyle": "modern|outdated|professional|amateur|etc",
    "emotionalTriggers": ["urgency", "trust", "fear", "excitement"]
  },
  "firstImpressionScore": 75,
  "reasoning": "Why users will react this way in the first 3 seconds"
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

    const observationData = extractAndParseJSON(observationResponse.choices[0]?.message?.content || '{}');
    console.log('[ANALYZE_IMAGE] Stage 1 complete - Observation data captured');

    // STAGE 2: INTERPRETATION - ChatGPT feedback #1 (psychology and strategy)
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
              text: `You are a ruthless UX psychologist. The interface has been observed. Now decode what's happening in users' minds.

OBSERVATION DATA:
${JSON.stringify(observationData, null, 2)}

${visionContext}

STAGE 2 - INTERPRET: Analyze the psychological warfare happening here.

Focus on:
- What emotions is this triggering and why? (MUST include intensity 1-10)
- What behavioral patterns will this create?
- How do different generations respond to these design choices?
- What dark patterns or manipulative tactics are present?
- Where is business intent misaligned with user perception?

Return this JSON structure:

{
  "psychologicalAnalysis": {
    "primaryEmotion": "trust|anxiety|excitement|confusion|frustration|delight|anticipation|skepticism",
    "intensity": 7,
    "reasoning": "Specific design elements causing this emotional response with evidence from Vision data",
    "behavioralPrediction": "How users will actually behave vs intended behavior"
  },
  "generationalBreakdown": {
    "genAlpha": {
      "score": 45,
      "reasoning": "Why this appeals/doesn't appeal with specific evidence",
      "specificIssues": ["Static layout lacks interactivity", "No gamification"],
      "improvements": "Add micro-animations and interactive elements"
    },
    "genZ": {
      "score": 72,
      "reasoning": "Gen Z appeal analysis with evidence",
      "specificIssues": ["Lacks social proof", "Missing authenticity markers"],
      "improvements": "Add user testimonials and authentic imagery"
    },
    "millennials": {
      "score": 85,
      "reasoning": "Millennial compatibility with evidence",
      "specificIssues": ["Could use more personalization"],
      "improvements": "Add customization options"
    },
    "genX": {
      "score": 78,
      "reasoning": "Gen X appeal with evidence",
      "specificIssues": ["Needs more detailed information"],
      "improvements": "Add comprehensive feature details"
    },
    "boomers": {
      "score": 65,
      "reasoning": "Boomer accessibility and appeal",
      "specificIssues": ["Text may be too small", "Complex navigation"],
      "improvements": "Increase text size and simplify navigation"
    }
  },
  "darkPatterns": [
    {
      "type": "URGENCY_MANIPULATION",
      "severity": "HIGH",
      "element": "Specific text from Vision data showing fake urgency",
      "evidence": "What makes this manipulative with proof",
      "impact": "How this damages user trust and long-term business",
      "ethicalAlternative": "Honest alternative approach that builds trust"
    }
  ],
  "intentAnalysis": {
    "perceivedPurpose": "What users think this interface is for based on visual cues",
    "actualPurpose": "Likely business intention based on structure",
    "alignmentScore": 75,
    "misalignments": ["Specific areas where purpose is unclear"],
    "clarityImprovements": ["How to make intent clearer"]
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

    // STAGE 3: RECOMMENDATIONS - ChatGPT feedback #1 (actionable fixes)
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
              text: `You are a conversion optimization specialist. Time to fix this interface's problems with surgical precision.

OBSERVATION DATA:
${JSON.stringify(observationData, null, 2)}

INTERPRETATION DATA:
${JSON.stringify(interpretationData, null, 2)}

${visionContext}

STAGE 3 - RECOMMEND: Provide surgical fixes that boost conversions.

Focus on:
- Critical issues that kill conversions with EXACT locations
- Specific copy improvements with before/after examples
- Visual hierarchy fixes with precise positioning
- Psychological optimization tactics
- Growth opportunities that increase revenue
- Friction points in the user journey

Return this JSON structure:

{
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": {"score": 80, "reasoning": "Clear assessment with evidence", "evidence": ["Specific visual elements supporting this score"]},
      "usability": {"score": 70, "reasoning": "Task completion ease assessment", "evidence": ["Navigation clarity evidence"]},
      "trustworthiness": {"score": 75, "reasoning": "Professional credibility assessment", "evidence": ["Trust signals present"]},
      "conversion": {"score": 65, "reasoning": "Action-driving effectiveness", "evidence": ["CTA prominence issues"]},
      "accessibility": {"score": 60, "reasoning": "Inclusive design assessment", "evidence": ["Contrast and text size issues"]}
    }
  },
  "verdict": {
    "summary": "The brutal punchline from observation + main strength and critical weakness combined",
    "attentionSpan": "2-3 minutes for focused users, 30 seconds for browsers",
    "likelyAction": "Most probable user behavior on this interface",
    "dropoffPoint": "Where users are most likely to abandon",
    "memorable": "What users remember after leaving",
    "attentionFlow": [
      {
        "priority": 1,
        "element": "Specific element from Vision data",
        "reasoning": "Why this draws attention first with evidence",
        "timeSpent": "2-3 seconds evaluation time",
        "conversionImpact": "HIGH"
      }
    ]
  },
  "criticalIssues": [
    {
      "severity": 3,
      "category": "HIERARCHY|ACCESSIBILITY|CONVERSION|TRUST|USABILITY",
      "issue": "Specific problem with precise description",
      "location": {
        "element": "Exact element from Vision data you can see",
        "region": "Top-left header|Center CTA|Main content area|etc"
      },
      "impact": "How this hurts business goals with metrics",
      "evidence": "What you observe from Vision data that proves this",
      "fix": {
        "immediate": "Quick fix available now",
        "better": "Optimal solution with more effort",
        "implementation": "Step-by-step how to implement the better solution"
      }
    }
  ],
  "uxCopyAnalysis": {
    "score": 70,
    "audienceAlignment": {
      "detectedAudience": "Professional|Consumer|GenZ|Corporate|etc",
      "copyStyle": "Formal|Casual|Technical|Friendly|etc",
      "brandArchetype": "Hero|Expert|Caregiver|Rebel|etc",
      "toneMismatch": 65
    },
    "issues": [
      {
        "severity": "HIGH",
        "element": "Exact text from Vision data",
        "location": "Where this text appears",
        "issue": "Why this copy doesn't work",
        "psychologicalImpact": "How this affects user emotions/behavior",
        "audienceSpecific": {
          "genZ": "Alternative for Gen Z users",
          "millennial": "Alternative for Millennials",
          "corporate": "Alternative for business users"
        },
        "suggested": ["Better alternative 1", "Better alternative 2"],
        "impact": "Expected improvement from change",
        "reasoning": "UX writing principle applied"
      }
    ],
    "microCopyOpportunities": [
      {
        "type": "ERROR_MESSAGING",
        "current": "Current text from interface",
        "location": "Where it appears",
        "issue": "Why current copy is suboptimal",
        "improved": "Better version",
        "reasoning": "Psychological principle"
      }
    ],
    "writingTone": {
      "current": "Observed tone from text analysis",
      "recommended": "Better tone for target audience",
      "example": "Specific rewrite example"
    }
  },
  "opportunities": [
    {
      "category": "CONVERSION|ENGAGEMENT|TRUST|PERSONALIZATION",
      "opportunity": "Revenue-boosting enhancement with specific details",
      "potentialImpact": "Expected business benefit with estimated impact",
      "implementation": "Detailed how to implement",
      "reasoning": "Why this matters strategically",
      "location": {
        "element": "Where to make this change",
        "region": "Specific area of interface"
      }
    }
  ],
  "frictionPoints": [
    {
      "stage": "AWARENESS|CONSIDERATION|DECISION|ACTION",
      "friction": "Specific barrier preventing user success",
      "evidence": "What creates this friction with proof from Vision data",
      "dropoffRisk": "HIGH|MEDIUM|LOW",
      "quickFix": "Immediate improvement available",
      "impact": "Expected improvement from fixing this"
    }
  ],
  "behavioralInsights": [
    {
      "pattern": "Specific user behavior pattern observed",
      "observation": "What in the design triggers this behavior",
      "psychology": "Psychological principle explaining why this happens",
      "emotionalImpact": {
        "primaryEmotion": "From interpretation data",
        "intensity": "From interpretation data",
        "reasoning": "From interpretation data"
      },
      "recommendation": "How to optimize for better behavioral outcomes"
    }
  ],
  "visualDesignAnalysis": {
    "score": 80,
    "typography": {
      "score": 85,
      "issues": [],
      "hierarchy": {"h1ToH2Ratio": 1.5, "consistencyScore": 90, "recommendation": "Typography hierarchy assessment"},
      "readability": {"fleschScore": 65, "avgLineLength": 12, "recommendation": "Readability assessment"}
    },
    "colorAndContrast": {
      "score": 75,
      "contrastFailures": [],
      "colorHarmony": {"scheme": "Complementary", "brandColors": ["#colors from Vision data"], "accentSuggestion": "How to improve colors"}
    },
    "spacing": {"score": 80, "gridSystem": "CSS Grid|Flexbox|Custom", "consistency": 85, "issues": []},
    "modernPatterns": {"detected": ["Modern patterns seen"], "implementation": {}, "trendAlignment": {"2025Relevance": 70, "suggestions": ["Modernization tips"]}},
    "visualHierarchy": {"scanPattern": "F-pattern|Z-pattern", "focalPoints": [{"element": "Main focus", "weight": 9}], "improvements": []}
  },
  "accessibilityAudit": {
    "score": 65,
    "wcagLevel": "AA",
    "strengths": ["What accessibility works well"],
    "weaknesses": ["What needs improvement"],
    "criticalFailures": [],
    "recommendations": [
      {
        "priority": "HIGH",
        "action": "Specific accessibility improvement",
        "effort": "LOW"
      }
    ]
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

    // COMBINE ALL THREE STAGES - ChatGPT feedback #3 (brutal punchline first)
    console.log('[ANALYZE_IMAGE] Combining all stages into final analysis...');
    
    // Debug logging for data validation
    console.log('[DEBUG] Stage data validation:', {
      hasObservationData: !!observationData,
      hasObservationPunchline: !!observationData?.punchline,
      observationContext: observationData?.context,
      observationIndustry: observationData?.industry,
      hasInterpretationData: !!interpretationData,
      hasPsychologicalAnalysis: !!interpretationData?.psychologicalAnalysis,
      hasRecommendationsData: !!recommendationsData,
      hasGripScore: !!recommendationsData?.gripScore
    });
    
    const combinedAnalysis = {
      ...recommendationsData,
      // Add observation data - ChatGPT feedback #2 (context and industry)
      context: observationData.context,
      industry: observationData.industry,
      industryConfidence: observationData.industryConfidence,
      // Enhanced verdict with brutal punchline first - ChatGPT feedback #3
      verdict: {
        ...recommendationsData.verdict,
        summary: observationData.punchline + (recommendationsData.verdict?.summary ? ' ' + recommendationsData.verdict.summary : '')
      },
      // Add generational analysis from interpretation
      generationalAnalysis: {
        scores: interpretationData.generationalBreakdown || {},
        primaryTarget: getBestGenerationMatch(interpretationData.generationalBreakdown || {}),
        recommendations: getGenerationalRecommendations(interpretationData.generationalBreakdown || {})
      },
      // Add dark patterns and intent analysis from interpretation
      darkPatterns: interpretationData.darkPatterns || [],
      intentAnalysis: interpretationData.intentAnalysis || null,
      // Enhanced behavioral insights with emotional impact
      behavioralInsights: (interpretationData.psychologicalAnalysis && 
                          interpretationData.psychologicalAnalysis.primaryEmotion &&
                          interpretationData.psychologicalAnalysis.reasoning) ? [
        ...(recommendationsData.behavioralInsights || []),
        {
          pattern: "Primary emotional response pattern",
          observation: `Interface triggers ${interpretationData.psychologicalAnalysis.primaryEmotion} at intensity ${interpretationData.psychologicalAnalysis.intensity || 0}/10`,
          psychology: interpretationData.psychologicalAnalysis.reasoning,
          emotionalImpact: {
            primaryEmotion: interpretationData.psychologicalAnalysis.primaryEmotion,
            intensity: interpretationData.psychologicalAnalysis.intensity || 0,
            reasoning: interpretationData.psychologicalAnalysis.reasoning
          },
          recommendation: interpretationData.psychologicalAnalysis.behavioralPrediction || "No behavioral prediction available"
        }
      ] : (recommendationsData.behavioralInsights || [])
    };

    // Step 4: Enhance with Vision data - ChatGPT feedback #5 (better locations)
    const finalAnalysis = enhanceAnalysisWithVision(combinedAnalysis, visionData);

    // Add metadata
    finalAnalysis.timestamp = new Date().toISOString();

    console.log('[✅ ENHANCED 3-STAGE ANALYSIS COMPLETE]', {
      stages: 3,
      observationSuccess: !!observationData.punchline,
      interpretationSuccess: !!interpretationData.psychologicalAnalysis,
      recommendationsSuccess: !!recommendationsData.gripScore,
      visionEnhanced: !!visionData,
      punchlineFirst: finalAnalysis.verdict.summary.includes(observationData.punchline)
    });

    return finalAnalysis;

  } catch (error) {
    console.error('[ANALYZE_IMAGE] Enhanced 3-stage analysis failed:', error);
    
    // Keep your existing error handling
    if (error instanceof Error) {
      if (error.message.includes('Timeout while downloading')) {
        return {
          context: 'ERROR',
          industry: 'UNKNOWN',
          industryConfidence: 0,
          darkPatterns: [],
          intentAnalysis: {
            perceivedPurpose: 'Unknown',
            actualPurpose: 'Unknown',
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
            summary: 'ANALYSIS TERMINATED: Image download timeout detected - interface too complex for processing matrix.',
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
      darkPatterns: [],
      intentAnalysis: {
        perceivedPurpose: 'Unknown',
        actualPurpose: 'Unknown',
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
        summary: 'SYSTEM ERROR: Analysis matrix malfunction detected - unable to process interface data.',
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