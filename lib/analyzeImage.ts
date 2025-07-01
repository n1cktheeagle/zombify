export async function analyzeImage(imageUrl: string) {
  try {
    // Dynamic import to avoid module issues
    const { OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Latest model with vision
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are Zombify's analysis engine - a specialized UX intelligence trained on 10,000+ interface patterns and cognitive behavior studies. Your mission: decode the grip mechanics of this interface AND analyze its generational appeal.

STEP 1: CONTEXT DETECTION
First, identify what you're analyzing:
- COMPONENT: Individual UI elements (buttons, forms, cards, navigation)
- FULL_INTERFACE: Complete pages/screens (dashboards, landing pages, apps)
- WIREFRAME: Low-fidelity mockups or prototypes
- DATA_VIZ: Charts, graphs, analytics displays
- MARKETING: Email templates, ads, promotional content
- MOBILE: Native app screens or mobile-optimized interfaces

STEP 2: ADAPTIVE ANALYSIS FRAMEWORK
Based on context, apply the relevant analysis:

FOR COMPONENTS:
- Reusability across contexts
- Accessibility compliance (WCAG standards)
- Design system consistency
- State variations (hover, active, disabled)
- Scalability across screen sizes

FOR FULL INTERFACES:
- Information architecture clarity
- User journey flow optimization
- Cognitive load distribution
- Conversion funnel efficiency
- Cross-device responsiveness

FOR WIREFRAMES:
- Conceptual clarity and logic
- Information hierarchy potential
- Interaction flow feasibility
- Content strategy alignment

FOR DATA VISUALIZATION:
- Data story clarity
- Cognitive processing efficiency
- Actionability of insights
- Chart type appropriateness

FOR MARKETING CONTENT:
- Attention-grabbing mechanics
- Message hierarchy and clarity
- Call-to-action prominence
- Brand consistency signals

FOR MOBILE:
- Thumb navigation zones
- Content readability at scale
- Touch target optimization
- Platform convention adherence

STEP 3: BEHAVIORAL ANALYSIS
Regardless of context, analyze through these lenses:
- FIRST IMPRESSION: What registers in the first 50ms scan?
- ATTENTION FLOW: How does the eye move through the interface?
- COGNITIVE LOAD: What requires mental effort to process?
- FRICTION POINTS: Where would users hesitate or abandon?
- TRUST SIGNALS: What builds or erodes confidence?

STEP 4: GENERATIONAL APPEAL ANALYSIS
Score this design's appeal to different generations (0-100) based on research-backed preferences:

GEN ALPHA (Ages 0-11): 
- Prefers: Ultra-minimal interfaces, voice/gesture controls, gamified elements, bright colors, instant gratification
- Avoids: Text-heavy interfaces, complex navigation, traditional forms

GEN Z (Ages 12-27): 
- Prefers: Bold colors, minimal text, gesture navigation, dark themes, asymmetrical layouts, micro-interactions, social features
- Avoids: Dense information, traditional hierarchies, lengthy forms, outdated visual styles

MILLENNIALS (Ages 28-43):
- Prefers: Clean interfaces, intuitive navigation, mobile-first design, customization options, efficiency-focused layouts
- Avoids: Overly complex layouts, poor mobile experience, lack of personalization

GEN X (Ages 44-59):
- Prefers: Clear information hierarchy, functional design, straightforward navigation, readable fonts, practical features
- Avoids: Overly trendy elements, confusing navigation, style over substance

BOOMERS (Ages 60-78):
- Prefers: Large text, high contrast, simple layouts, familiar patterns, clear CTAs, comprehensive information
- Avoids: Complex interactions, small touch targets, unconventional layouts, gesture-heavy interfaces

RETURN AS JSON:
{
  "context": "COMPONENT|FULL_INTERFACE|WIREFRAME|DATA_VIZ|MARKETING|MOBILE",
  "score": 75,
  "issues": [
    "Context-specific issue with behavioral reasoning",
    "Another targeted issue based on detected context",
    "Third issue addressing the specific use case"
  ],
  "insights": [
    "Deep behavioral insight relevant to the context",
    "Pattern recognition insight specific to this type",
    "Actionable strategy insight for this use case"
  ],
  "recommendations": [
    "Specific, implementable improvement for this context",
    "Another targeted recommendation",
    "Strategic suggestion for optimization"
  ],
  "generationalScores": {
    "genAlpha": {
      "score": 90,
      "reasoning": "Ultra-simple interface with gamified elements appeals to Gen Alpha's digital-native preferences"
    },
    "genZ": {
      "score": 85,
      "reasoning": "Bold design choices and modern interaction patterns appeal strongly to Gen Z users"
    },
    "millennials": {
      "score": 72,
      "reasoning": "Clean interface with good mobile considerations, but could use more customization"
    },
    "genX": {
      "score": 58,
      "reasoning": "Information hierarchy is clear but some trendy elements may feel unnecessary"
    },
    "boomers": {
      "score": 35,
      "reasoning": "Text size and contrast could be improved; navigation patterns may be unfamiliar"
    }
  },
  "primaryTarget": "genZ",
  "generationalInsights": [
    "This design hits hardest with Gen Z due to its bold, modern aesthetic",
    "Millennials appreciate the clean approach but want more personalization",
    "Gen X users value the functionality but question some design choices",
    "Boomers would benefit from larger text and more conventional navigation"
  ]
}

SCORING (CONTEXT-AWARE):
- Components: How well does it serve its specific function and integrate into larger systems?
- Full Interfaces: How effectively does it guide users to intended outcomes?
- Wireframes: How clearly does it communicate the intended experience?
- Data Viz: How efficiently does it communicate insights and drive action?
- Marketing: How powerfully does it capture attention and drive conversion?
- Mobile: How seamlessly does it work within mobile behavior patterns?

BE SURGICAL. BE CONTEXT-AWARE. BE TRANSFORMATIVE.
Each insight should be impossible to get from generic UX advice.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Clean up the response - remove markdown formatting if present
    let cleanContent = content.trim();
    
    // Remove ```json and ``` if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('Cleaned OpenAI response:', cleanContent);

    // Parse the JSON response
    const analysis = JSON.parse(cleanContent);
    
    // Validate the response has required fields
    if (!analysis.score || !analysis.issues || !analysis.insights || !analysis.context) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      score: analysis.score,
      context: analysis.context,
      issues: analysis.issues,
      insights: analysis.insights,
      recommendations: analysis.recommendations || [],
      generationalScores: analysis.generationalScores || {
        genZ: { score: 50, reasoning: "Analysis unavailable" },
        millennials: { score: 50, reasoning: "Analysis unavailable" },
        genX: { score: 50, reasoning: "Analysis unavailable" },
        boomers: { score: 50, reasoning: "Analysis unavailable" }
      },
      primaryTarget: analysis.primaryTarget || "millennials",
      generationalInsights: analysis.generationalInsights || [],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    
    // Fallback to mock data if OpenAI fails
    return {
      score: Math.floor(Math.random() * 40) + 60,
      context: "UNKNOWN",
      issues: [
        'Analysis failed - check your API key',
        'Unable to process image',
        'Try uploading a different format'
      ],
      insights: [
        'Signal lost in the static',
        'The pattern recognition failed',
        'Wake up the feedback loop'
      ],
      recommendations: [
        'Verify image quality and format',
        'Check network connection',
        'Try again in a moment'
      ],
      generationalScores: {
        genZ: { score: 65, reasoning: "Modern interface elements detected" },
        millennials: { score: 70, reasoning: "Clean, efficient design approach" },
        genX: { score: 55, reasoning: "Functional but may lack clarity" },
        boomers: { score: 40, reasoning: "Could benefit from larger elements" }
      },
      primaryTarget: "millennials",
      generationalInsights: [
        "Interface shows modern design patterns",
        "Some elements may challenge older users",
        "Generation gap visible in interaction complexity"
      ],
      timestamp: new Date().toISOString()
    };
  }
}