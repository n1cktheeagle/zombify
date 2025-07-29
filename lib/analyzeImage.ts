// analyzeImage.ts - Enhanced version with all new features
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

// Google Vision API analysis function - ENHANCED for better data extraction
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

// Enhanced analysis with Vision data for better insights
function enhanceAnalysisWithVision(analysis: any, visionData: VisionAnalysisResult | null): any {
  if (!visionData) {
    console.log('[ENHANCE] No vision data available, returning original analysis');
    return analysis;
  }

  console.log('[ENHANCE] Enhancing analysis with Vision data...');

  // Calculate real contrast ratios for detected text
  const contrastIssues: any[] = [];
  const dominantColors = visionData.imageProperties.dominantColors;
  
  if (dominantColors.length >= 2) {
    // Simple contrast check between dominant colors
    const color1 = dominantColors[0].color;
    const color2 = dominantColors[1].color;
    const contrast = calculateContrast(color1, color2);
    
    if (contrast < 4.5) {
      contrastIssues.push({
        severity: contrast < 3 ? 'HIGH' : 'MEDIUM',
        colors: [color1, color2],
        ratio: contrast.toFixed(2),
        recommendation: 'Increase contrast between these dominant colors'
      });
    }
  }

  // Detect small text that might be hard to read
  const smallTextElements = visionData.textAnnotations.filter(text => {
    return text.boundingBox.height < 12; // Approximately 16px or smaller
  });

  // Find CTAs and important buttons
  const ctaElements = visionData.textAnnotations.filter(text => {
    const lower = text.text.toLowerCase();
    return ['buy', 'start', 'sign', 'get', 'download', 'submit', 'continue', 'next', 'add to cart'].some(cta => 
      lower.includes(cta)
    );
  });

  // Enhance the analysis with Vision insights
  const enhancedAnalysis = {
    ...analysis,
    // Add Vision-specific enhancements to existing analysis
    visualDesignAnalysis: {
      ...analysis.visualDesignAnalysis,
      colorAndContrast: {
        ...analysis.visualDesignAnalysis.colorAndContrast,
        // Add real contrast measurements
        measuredContrasts: contrastIssues,
        dominantColorPalette: dominantColors.slice(0, 5).map(c => ({
          hex: rgbToHex(c.color),
          percentage: (c.pixelFraction * 100).toFixed(1) + '%'
        }))
      },
      typography: {
        ...analysis.visualDesignAnalysis.typography,
        // Add small text warnings
        smallTextWarnings: smallTextElements.length > 0 ? {
          count: smallTextElements.length,
          message: `${smallTextElements.length} text elements may be too small for comfortable reading`
        } : null
      }
    },
    // Add opportunities based on Vision findings
    opportunities: [
      ...analysis.opportunities,
      // If we found CTAs, suggest making them more prominent
      ...(ctaElements.length > 0 && ctaElements.some(cta => cta.boundingBox.height < 40) ? [{
        category: 'CONVERSION',
        opportunity: 'Make call-to-action buttons larger',
        potentialImpact: 'Increased click-through rates',
        implementation: 'Increase button height to at least 44px for better mobile usability',
        reasoning: 'Vision detected CTA buttons that may be too small for optimal interaction',
        location: {
          element: 'CTA buttons',
          region: 'Various'
        }
      }] : [])
    ],
    // Include Vision data for reference
    visionData: {
      textCount: visionData.textAnnotations.length,
      hasLogos: visionData.logoAnnotations.length > 0,
      dominantColors: dominantColors.slice(0, 5),
      hasCTAs: ctaElements.length > 0,
      detectedText: visionData.textAnnotations.slice(0, 20).map(t => t.text) // First 20 text elements
    }
  };

  return enhancedAnalysis;
}

// Helper function to calculate contrast ratio
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

export async function analyzeImage(imageUrl: string): Promise<ZombifyAnalysis> {
  console.log('[ANALYZE_IMAGE] Starting enhanced hybrid analysis for:', imageUrl);
  
  try {
    // Step 1: Run Vision API FIRST to get element data
    console.log('[ANALYZE_IMAGE] Starting Vision API analysis...');
    const visionData = await analyzeImageWithVision(imageUrl);
    
    // Step 2: Prepare Vision context for GPT
    let visionContext = '';
    if (visionData) {
      visionContext = `
VISION API DATA AVAILABLE:
- Detected ${visionData.textAnnotations.length} text elements
- Found ${visionData.logoAnnotations.length} logos/brand elements
- Dominant colors: ${visionData.imageProperties.dominantColors.slice(0, 3).map(c => 
  `rgb(${c.color.red},${c.color.green},${c.color.blue})`
).join(', ')}
- Text elements: ${visionData.textAnnotations.slice(0, 15).map(t => t.text).join(', ')}${visionData.textAnnotations.length > 15 ? '...' : ''}

Use this data to make your analysis more specific and accurate.
`;
    }
    
    // Step 3: Run GPT-4V analysis with enhanced prompt
    const { OpenAI } = await import('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[ANALYZE_IMAGE] Missing OpenAI API key');
      throw new Error('OpenAI API key not configured');
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[ANALYZE_IMAGE] Starting enhanced GPT-4V analysis...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 6000, // Increased for enhanced analysis
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a strategic UX expert providing comprehensive design intelligence. Your analysis should be deep, actionable, and psychologically informed.

${visionContext}

=== ENHANCED ANALYSIS FRAMEWORK ===

STAGE 1 - OBSERVE: First, carefully examine the interface
- What type of interface is this? (landing page, dashboard, form, etc.)
- What industry/context does this serve?
- What text elements, buttons, and visual hierarchy do you see?
- What are the dominant colors, typography choices, and spacing patterns?

STAGE 2 - INTERPRET: Analyze strategic implications
- What is this interface trying to achieve vs what users will perceive?
- What psychological triggers and emotional responses does it create?
- What behavioral patterns will this layout encourage or discourage?
- How does the copy align with the target audience and brand voice?

STAGE 3 - RECOMMEND: Provide prioritized improvements
- What are the critical issues that will hurt user experience or conversions?
- What dark patterns or manipulative design elements are present?
- How can accessibility be improved using automated checks?
- What opportunities exist to enhance engagement and trust?

=== ANALYSIS REQUIREMENTS ===

DARK PATTERN DETECTION (COMPREHENSIVE ETHICAL ANALYSIS REQUIRED):
Systematically identify ALL manipulative design practices across these 6 categories:

1. URGENCY_MANIPULATION: False scarcity, fake countdown timers, "limited time" without real limits, artificial pressure
2. BAIT_AND_SWITCH: Misleading headlines, hidden requirements, features that don't work as advertised
3. HIDDEN_COSTS: Undisclosed fees, surprise charges, unclear pricing, subscription traps
4. FORCED_CONTINUITY: Hard to cancel, automatic renewals, requiring phone calls to quit
5. ROACH_MOTEL: Easy sign-up but difficult account deletion, data export barriers
6. CONFIRM_SHAMING: Guilt-inducing decline options, manipulative "No thanks" copy

For EACH pattern found, provide:
- ETHICAL ALTERNATIVE: Specific honest approach that serves users better
- TRUST IMPACT: How this damages long-term customer relationships (1-10 damage score)
- BUSINESS RISK: Legal/reputation consequences of this manipulation
- PSYCHOLOGY EXPLOITATION: What cognitive bias is being manipulated unfairly

UX COPY INTELLIGENCE:
Analyze all text with strategic depth:
- Audience alignment: Does copy match the visual tone and target demographic?
- Brand voice consistency: Are there tone shifts across elements?
- Microcopy optimization: Error messages, empty states, form labels, button text
- Persuasion analysis: What psychological triggers are used effectively/poorly?
- Accessibility: Is language clear and inclusive?

ENHANCED BEHAVIORAL INSIGHTS (CRITICAL - MUST INCLUDE EMOTIONAL SCORING):
For each behavioral pattern, you MUST provide comprehensive psychological analysis:
- PRIMARY EMOTION: Select ONE primary emotion: trust, anxiety, excitement, confusion, frustration, delight, anticipation, skepticism
- INTENSITY SCORING: Rate emotional response strength 1-10 (1=barely noticeable, 5=moderate, 10=overwhelming)
- PSYCHOLOGICAL REASONING: Explain the cognitive/behavioral science principle at work (e.g., "Loss aversion makes users fear missing the discount")
- DESIGN TRIGGERS: Identify specific visual elements causing this emotional response (colors, placement, copy, imagery)
- CONVERSION IMPLICATIONS: Quantify how this helps/hurts business goals with specific behavioral predictions
- USER MOTIVATION: What drives users to act/not act based on this emotional state?

ACCESSIBILITY AUTOMATION:
Using available visual data, check:
- Text size issues (flag elements that appear under 14px)
- Color contrast problems between text and backgrounds
- Visual hierarchy clarity and logical tab order
- Button/link visibility and touch target sizes

STRATEGIC INTENT ANALYSIS:
- What do users think this interface is for based on visual cues?
- Does this match the likely business intention?
- Where might users get confused about purpose or next steps?
- How can intent be clarified through design changes?

GENERATIONAL DESIGN ANALYSIS (EVIDENCE-BASED SCORING REQUIRED):
Analyze how this interface appeals to different generations using specific design psychology principles:

GENERATION SCORING CRITERIA (Rate each 0-100 based on design evidence):

Gen Alpha (0-11): Born digital natives
- VISUAL COMPLEXITY: Prefers dynamic, interactive, media-rich interfaces (vibrant colors, animations, multimedia)
- ATTENTION PATTERNS: Short-form content, visual storytelling, gamification elements
- TECHNOLOGY EXPECTATIONS: Touch-first, gesture-based, voice integration, AR/VR readiness
- EVIDENCE TO ANALYZE: Interactive elements, animation presence, visual richness, gamification cues

Gen Z (12-27): Mobile-first, authenticity-focused
- AUTHENTICITY MARKERS: Real photos vs stock images, honest messaging, transparent processes
- MOBILE OPTIMIZATION: Touch targets, thumb-friendly navigation, vertical scrolling design
- SPEED EXPECTATIONS: Fast loading indicators, minimal friction, instant gratification elements
- SOCIAL INTEGRATION: Sharing features, social proof, community elements
- EVIDENCE TO ANALYZE: Mobile responsiveness, authentic visual style, social elements, transparency signals

Millennials (28-43): Experience-driven, brand-conscious
- EXPERIENCE FOCUS: Smooth user journeys, progressive disclosure, helpful onboarding
- BRAND TRUST: Professional aesthetics, security indicators, testimonials, established brand signals
- EFFICIENCY BALANCE: Feature-rich but not overwhelming, customization options
- EVIDENCE TO ANALYZE: User experience flow, brand credibility signals, feature organization, personalization

Gen X (44-59): Pragmatic, efficiency-focused
- INFORMATION DENSITY: Comprehensive details available, clear hierarchy, scannable content
- EFFICIENCY TOOLS: Search functionality, filters, shortcuts, power-user features
- TRUST SIGNALS: Contact information, credentials, established business indicators
- EVIDENCE TO ANALYZE: Information architecture, efficiency features, credibility markers

Boomers (60-78): Clarity and accessibility-focused
- READABILITY: Large text, high contrast, clear typography, minimal visual noise
- SIMPLICITY: Straightforward navigation, familiar patterns, reduced cognitive load
- SUPPORT ACCESS: Help options, contact methods, clear instructions
- ACCESSIBILITY: Text size, color contrast, clickable area size, linear navigation
- EVIDENCE TO ANALYZE: Text legibility, navigation simplicity, help systems, accessibility compliance

FOR EACH GENERATION, PROVIDE:
- SCORE (0-100): Based on how well the design matches their documented preferences
- SPECIFIC EVIDENCE: Cite exact visual elements that support or hurt appeal (colors, layout, text size, features)
- PSYCHOLOGICAL REASONING: Explain WHY these elements appeal/don't appeal based on generational research
- IMPROVEMENT OPPORTUNITIES: Specific design changes that would boost this generation's experience
- BEHAVIORAL PREDICTION: How this generation would likely interact with this interface

PRIMARY TARGET IDENTIFICATION:
- Analyze design choices to determine most likely intended audience
- Consider: Industry context, visual sophistication, feature complexity, interaction patterns
- Justify with specific design evidence

ATTENTION FLOW ENHANCEMENT (DETAILED PRIORITY ANALYSIS REQUIRED):
Map user attention sequence with scientific precision:

PRIORITY RANKING: Number elements 1-7 in order of visual dominance (1 = first viewed)
- Use eye-tracking principles: Size, contrast, placement, color psychology
- Consider F-pattern, Z-pattern, or layer-cake scanning behaviors
- Account for cultural reading patterns (left-to-right vs other)

TIME ESTIMATES: Provide realistic engagement duration per element:
- Header/logo: "0.5-1 second recognition scan"
- Primary CTA: "2-3 seconds evaluation time"
- Body text: "5-8 seconds if user reads"
- Navigation: "1-2 seconds orientation"

CONVERSION IMPACT: Rate each element's influence on user action (HIGH/MEDIUM/LOW):
- HIGH: Elements that directly drive or prevent key actions
- MEDIUM: Supporting elements that influence decision-making
- LOW: Decorative or informational elements with minimal action impact

PSYCHOLOGICAL REASONING: Explain WHY attention flows this way:
- Visual weight principles (size, color, contrast)
- Gestalt psychology (proximity, similarity, closure)
- Cognitive load factors (complexity, familiarity)
- Emotional triggers (urgency, trust signals, social proof)

=== JSON STRUCTURE ===

Return this exact JSON structure:

{
  "context": "LANDING_PAGE|DASHBOARD|FORM|ECOMMERCE|GAME_UI|MOBILE_APP|etc",
  "industry": "SAAS|ECOMMERCE|FINTECH|HEALTHCARE|EDUCATION|SOCIAL|ENTERPRISE|UNKNOWN",
  "industryConfidence": 0.85,
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": {"score": 80, "reasoning": "Clear purpose communication assessment", "evidence": ["Specific visual elements supporting this score"]},
      "usability": {"score": 70, "reasoning": "Task completion ease assessment", "evidence": ["Navigation clarity, form simplicity, etc."]},
      "trustworthiness": {"score": 75, "reasoning": "Professional credibility assessment", "evidence": ["Visual polish, security indicators, etc."]},
      "conversion": {"score": 65, "reasoning": "Action-driving effectiveness", "evidence": ["CTA prominence, friction points, etc."]},
      "accessibility": {"score": 60, "reasoning": "Inclusive design assessment", "evidence": ["Contrast, text size, clarity issues"]}
    }
  },
  "verdict": {
    "summary": "One powerful sentence combining main strength and critical weakness",
    "attentionSpan": "Realistic estimate (e.g., '2-3 minutes for focused users, 30 seconds for browsers')",
    "likelyAction": "Most probable user behavior on this interface",
    "dropoffPoint": "Where users are most likely to abandon the flow",
    "memorable": "What users will remember after leaving",
    "attentionFlow": [
      {
        "priority": 1,
        "element": "Specific element name or description",
        "reasoning": "Why this draws attention first",
        "timeSpent": "Estimated engagement time",
        "conversionImpact": "HIGH|MEDIUM|LOW"
      }
    ]
  },
  "darkPatterns": [
    {
      "type": "URGENCY_MANIPULATION|BAIT_AND_SWITCH|HIDDEN_COSTS|FORCED_CONTINUITY|ROACH_MOTEL|CONFIRM_SHAMING",
      "severity": "HIGH|MEDIUM|LOW",
      "element": "Specific text or button you can see",
      "evidence": "What makes this manipulative",
      "impact": "How this damages user trust or experience",
      "ethicalAlternative": "Better approach that serves users"
    }
  ],
  "intentAnalysis": {
    "perceivedPurpose": "What users think this is for based on visual cues",
    "actualPurpose": "Likely business intention",
    "alignmentScore": 75,
    "misalignments": ["Specific areas where purpose is unclear"],
    "clarityImprovements": ["How to make intent clearer"]
  },
  "visualDesignAnalysis": {
    "score": 80,
    "typography": {
      "score": 85,
      "issues": [],
      "hierarchy": {"h1ToH2Ratio": 1.5, "consistencyScore": 90, "recommendation": "How to improve visual hierarchy"},
      "readability": {"fleschScore": 65, "avgLineLength": 12, "recommendation": "General readability assessment"}
    },
    "colorAndContrast": {
      "score": 85,
      "contrastFailures": [
        {
          "foreground": "Text color description",
          "background": "Background color description", 
          "ratio": 2.8,
          "location": "Specific element location",
          "fix": {
            "suggestion": "Make text darker or background lighter",
            "css": "color: #333; or background: #f9f9f9;"
          }
        }
      ],
      "colorHarmony": {"scheme": "Monochromatic|Complementary|Triadic|etc", "brandColors": ["#hex values"], "accentSuggestion": "How to improve color usage"}
    },
    "spacing": {"score": 80, "gridSystem": "CSS Grid|Flexbox|Custom|None detected", "consistency": 85, "issues": []},
    "modernPatterns": {"detected": ["Card layouts", "Button styles", "etc"], "implementation": {}, "trendAlignment": {"2025Relevance": 70, "suggestions": ["How to modernize"]}},
    "visualHierarchy": {"scanPattern": "F-pattern|Z-pattern|Layer cake|etc", "focalPoints": [{"element": "Main CTA", "weight": 9}], "improvements": [{"issue": "Problem", "fix": "Solution"}]}
  },
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
        "element": "Exact text you can see",
        "location": "Where this appears",
        "issue": "Why this copy doesn't work",
        "psychologicalImpact": "How this affects user emotions/behavior",
        "audienceSpecific": {
          "genZ": "Alternative for Gen Z",
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
        "type": "ERROR_MESSAGING|EMPTY_STATES|FORM_LABELS|SUCCESS_MESSAGES",
        "current": "Current text",
        "location": "Where it appears",
        "issue": "Why current copy is suboptimal",
        "improved": "Better version",
        "reasoning": "Psychological or usability principle"
      }
    ],
    "writingTone": {"current": "Observed tone", "recommended": "Better tone for audience", "example": "Specific rewrite example"}
  },
  "criticalIssues": [
    {
      "severity": 3,
      "category": "HIERARCHY|ACCESSIBILITY|CONVERSION|TRUST|USABILITY",
      "issue": "Clear, specific issue title",
      "location": {
        "element": "Specific element you can see",
        "region": "General area description"
      },
      "impact": "How this affects user experience or business goals",
      "evidence": "What you specifically observe that supports this",
      "fix": {
        "immediate": "Quick improvement that can be made now",
        "better": "Optimal solution with more effort",
        "implementation": "How to achieve the better solution"
      }
    }
  ],
  "usabilityIssues": [],
  "opportunities": [
    {
      "category": "ENGAGEMENT|CONVERSION|TRUST|ACCESSIBILITY|PERSONALIZATION",
      "opportunity": "Specific enhancement opportunity",
      "potentialImpact": "Expected business/user benefit",
      "implementation": "How to implement this",
      "reasoning": "Why this matters strategically",
      "location": {
        "element": "Specific element to enhance",
        "region": "Where it's located"
      }
    }
  ],
  "behavioralInsights": [
    {
      "pattern": "Specific user behavior pattern",
      "observation": "What in the design triggers this",
      "psychology": "Psychological principle explaining why",
      "emotionalImpact": {
        "primaryEmotion": "trust|anxiety|excitement|confusion|frustration|delight",
        "intensity": 7,
        "reasoning": "Design elements causing this emotional response"
      },
      "recommendation": "How to design for better outcomes"
    }
  ],
  "frictionPoints": [
    {
      "stage": "AWARENESS|CONSIDERATION|DECISION|ACTION",
      "friction": "Specific friction point",
      "evidence": "What creates this friction",
      "dropoffRisk": "HIGH|MEDIUM|LOW", 
      "quickFix": "Immediate improvement",
      "impact": "Expected improvement from fixing this"
    }
  ],
  "accessibilityAudit": {
    "automated": true,
    "score": 65,
    "colorContrast": {
      "issues": [
        {
          "element": "Specific element with contrast issue",
          "contrastRatio": 2.8,
          "wcagLevel": "AA",
          "passes": false,
          "fix": "Specific improvement needed"
        }
      ]
    },
    "textSize": {
      "smallTextCount": 3,
      "minimumSize": "11px estimated",
      "recommendation": "Increase small text for better readability"
    },
    "overallRecommendation": "Priority accessibility improvements"
  },
  "generationalAnalysis": {
    "scores": {
      "genAlpha": {"score": 45, "reasoning": "Limited gamification and interactive elements. Static layout lacks dynamic engagement expected by digital natives. No multimedia content or animations visible.", "evidence": ["Static layout design", "No visible animations", "Traditional form-based interface"], "improvements": ["Add micro-animations", "Include interactive preview elements", "Implement gamification rewards"], "behavioralPrediction": "Likely to lose interest quickly due to static presentation"},
      "genZ": {"score": 72, "reasoning": "Clean, modern aesthetic appeals to minimalist preferences. Mobile-responsive design visible. However, lacks social proof and authentic imagery that builds trust.", "evidence": ["Modern typography", "Clean visual hierarchy", "Mobile-first layout"], "improvements": ["Add user testimonials", "Include real customer photos", "Add sharing functionality"], "behavioralPrediction": "Will engage if social validation is added"},
      "millennials": {"score": 85, "reasoning": "Professional brand presentation builds trust. Feature-rich but organized interface appeals to experience-focused mindset. Clear value proposition and user journey.", "evidence": ["Professional color scheme", "Organized feature layout", "Clear call-to-action"], "improvements": ["Add personalization options", "Include progress indicators", "Enhance onboarding flow"], "behavioralPrediction": "Most likely to convert - design matches expectations"},
      "genX": {"score": 78, "reasoning": "Information-dense layout provides comprehensive details. Logical hierarchy supports efficiency. Clear contact and credibility signals build trust.", "evidence": ["Detailed feature descriptions", "Contact information prominent", "Logical navigation structure"], "improvements": ["Add search functionality", "Include comparison tables", "Provide downloadable resources"], "behavioralPrediction": "Will thoroughly research before deciding - needs more detailed information"},
      "boomers": {"score": 65, "reasoning": "Text appears readable but could be larger. Navigation is straightforward but some elements may be too small for easy clicking. Good contrast but needs accessibility improvements.", "evidence": ["Clear typography", "Simple navigation", "Good color contrast"], "improvements": ["Increase text size", "Larger click targets", "Add help documentation", "Simplify form fields"], "behavioralPrediction": "May struggle with smaller interface elements - needs accessibility enhancements"}
    },
    "primaryTarget": "millennials",
    "primaryTargetEvidence": ["Professional aesthetic suggests established business users", "Feature complexity indicates users comfortable with technology", "Brand-focused design appeals to experience-driven mindset"],
    "recommendations": ["Enhance mobile social features for Gen Z appeal", "Add accessibility improvements for broader age range adoption", "Include more detailed information architecture for Gen X efficiency needs"]
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

    console.log('[ANALYZE_IMAGE] Enhanced GPT-4V analysis completed');
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[ANALYZE_IMAGE] No content in OpenAI response:', response);
      throw new Error('No response from OpenAI');
    }

    // Parse GPT analysis
    const gptAnalysis = extractAndParseJSON(content);
    console.log('[ANALYZE_IMAGE] Enhanced GPT analysis parsed successfully');
    
    // Step 4: Enhance analysis with Vision data
    const enhancedAnalysis = enhanceAnalysisWithVision(gptAnalysis, visionData);

    // Validate required fields
    if (!enhancedAnalysis.gripScore || !enhancedAnalysis.criticalIssues || !enhancedAnalysis.context) {
      throw new Error('Invalid response format from enhanced analysis');
    }

    const finalAnalysis = {
      ...enhancedAnalysis,
      timestamp: new Date().toISOString()
    };

    console.log('[✅ ENHANCED ANALYSIS COMPLETE]', {
      gptSuccess: !!gptAnalysis,
      visionSuccess: !!visionData,
      enhancedWithVision: !!enhancedAnalysis.visionData,
      newFeatures: {
        darkPatterns: !!enhancedAnalysis.darkPatterns,
        intentAnalysis: !!enhancedAnalysis.intentAnalysis,
        enhancedCopy: !!enhancedAnalysis.uxCopyAnalysis?.audienceAlignment,
        frictionPoints: !!enhancedAnalysis.frictionPoints,
        automatedAccessibility: !!enhancedAnalysis.accessibilityAudit?.automated
      }
    });

    return finalAnalysis;

  } catch (error) {
    console.error('[ANALYZE_IMAGE] Enhanced analysis failed:', error);
    
    // Keep your existing error handling exactly as is
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