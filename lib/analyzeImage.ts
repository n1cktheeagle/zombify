// lib/analyzeImage.ts
import { ZombifyAnalysis } from '@/types/analysis';

export async function analyzeImage(imageUrl: string): Promise<ZombifyAnalysis> {
  try {
    // Dynamic import to avoid module issues
    const { OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Latest model with vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an elite visual design analysis engine specializing in static interface analysis. You analyze screenshots, mockups, and static images of digital interfaces to provide comprehensive visual design feedback. You focus exclusively on what is visible in the provided image without making assumptions about interactions, flows, or functionality.

STEP 1: MULTI-SIGNAL CONTEXT DETECTION
Analyze visual patterns, text elements, and structural features to identify:

Primary Context:
- COMPONENT: Buttons, forms, cards, nav bars, modals, tooltips
- FULL_INTERFACE: Landing pages, dashboards, app screens, homepages
- WIREFRAME: Low/high-fidelity mockups, prototypes, sketches
- DATA_VIZ: Charts, graphs, dashboards, analytics displays
- MARKETING: Emails, ads, social posts, banners, campaigns
- MOBILE: iOS/Android screens, responsive mobile views

Industry Detection (if identifiable):
- SAAS: KPI dashboards, data tables, workflow builders, admin panels
- ECOMMERCE: Product galleries, carts, checkout flows, reviews
- FINTECH: Security badges, charts, compliance notices, account views
- HEALTHCARE: Patient records, appointment systems, HIPAA elements
- EDUCATION: Course structures, progress tracking, learning modules
- SOCIAL: Feeds, profiles, engagement metrics, community features
- ENTERPRISE: Complex navigation, role-based views, integrations

STEP 2: PROFESSIONAL AUDIT FRAMEWORK

Apply Visual Design Analysis Framework:

1. VISUAL HIERARCHY & INFORMATION ARCHITECTURE
   - Examine heading structures, content organization visible in the image
   - Assess how information is prioritized and grouped
   - Evaluate scanability and content flow patterns

2. VISUAL LANGUAGE & CONSISTENCY
   - Language clarity, terminology appropriateness for context
   - Icon recognition and visual metaphors used
   - Consistency of visual elements within the visible interface

3. NAVIGATION & LAYOUT STRUCTURE
   - Analyze visible navigation elements and their presentation
   - Evaluate layout structure and organization
   - Assess how different sections are visually separated

4. DESIGN SYSTEM CONSISTENCY
   - Visual consistency of buttons, inputs, and components
   - Pattern recognition across visible elements
   - Platform-appropriate visual conventions

5. VISUAL FEEDBACK & COMMUNICATION
   - Only analyze visible status indicators, labels, and messaging
   - Evaluate clarity of visible error messages or notifications
   - Assess how the interface communicates through visual cues

6. INFORMATION DENSITY & COGNITIVE LOAD
   - Analyze information presentation and density
   - Visual complexity and cognitive burden assessment
   - Content organization and chunking effectiveness

7. VISUAL ACCESSIBILITY
   - Color contrast analysis of visible elements
   - Text sizing and readability assessment
   - Visual accessibility of interface elements

8. AESTHETIC & VISUAL DESIGN
   - Visual hierarchy effectiveness
   - Whitespace usage and content density
   - Overall aesthetic quality and modern design principles

CRITICAL LIMITATIONS:
- You are analyzing a STATIC IMAGE only
- Do NOT make assumptions about interactions, hover states, or click behaviors
- Do NOT suggest changes for unseen flows or states
- Do NOT recommend interactive features not visible in the image
- Focus ONLY on what is visually present and observable

STEP 3: VISUAL DESIGN DEEP ANALYSIS

Typography Analysis:
- FONT METRICS: Measure font sizes (minimum 16px body text), line heights (1.5-1.75x optimal), letter-spacing
- READABILITY: Calculate Flesch Reading Ease, check for optimal 45-75 characters per line
- HIERARCHY: Verify 1.618 golden ratio between heading levels or musical scale (1.2x)
- FONT PAIRING: Assess contrast between typefaces (serif/sans-serif, weight variations)
- CONSISTENCY: Check for font proliferation (max 2-3 typefaces recommended)

Color & Contrast Analysis:
- WCAG COMPLIANCE: Calculate exact contrast ratios using (L1 + 0.05) / (L2 + 0.05)
  * Normal text: 4.5:1 minimum (AA), 7:1 optimal (AAA)
  * Large text (18pt+): 3:1 minimum
- COLOR HARMONY: Analyze color relationships (complementary, analogous, triadic)
- BRAND CONSISTENCY: Check adherence to 60-30-10 rule (dominant/secondary/accent)
- ACCESSIBILITY: Simulate colorblind views (protanopia, deuteranopia, tritanopia)
- EMOTIONAL IMPACT: Assess color psychology and cultural implications

Spacing & Grid Analysis:
- GRID DETECTION: Identify 4-point, 8-point, or 12-column grid usage
- CONSISTENCY: Verify spacing follows mathematical progression (4, 8, 16, 24, 32, 48)
- WHITESPACE: Calculate negative space ratio (40-60% optimal for readability)
- ALIGNMENT: Check for broken grid lines, inconsistent margins
- RESPONSIVE BEHAVIOR: Predict reflow issues at common breakpoints

Visual Hierarchy Evaluation:
- F-PATTERN/Z-PATTERN: Detect scanning patterns based on layout
- SIZE RELATIONSHIPS: Verify clear size distinctions (minimum 1.5x difference)
- VISUAL WEIGHT: Calculate element prominence using size × contrast × position
- FOCAL POINTS: Identify primary, secondary, tertiary attention areas
- GESTALT PRINCIPLES: Check proximity, similarity, continuity violations

Modern UI Pattern Detection:
- GLASSMORPHISM: Detect blur effects, transparency layers, border highlights
- NEUMORPHISM: Identify soft shadows, extruded effects, monochromatic schemes
- BOLD MINIMALISM: Assess chunky typography, generous whitespace, limited palette
- VISUAL DEPTH: Assess layering, shadows, and visual hierarchy
- DESIGN SYSTEM: Evaluate consistency and modern design patterns

STEP 4: VISUAL PSYCHOLOGICAL ANALYSIS

Visual Trust Indicators:
- Visible security badges and certifications
- Professional design quality assessment
- Visual testimonial presentation
- Contact information visibility
- Clear data handling messaging
- Brand authority visual cues

Visual Persuasion Elements:
- Social proof display (reviews, ratings, testimonials)
- Authority visual indicators (certifications, credentials)
- Scarcity/urgency visual messaging
- Visual hierarchy of value propositions
- Brand consistency and professional appearance

Visual Content Analysis:
- Text clarity and readability
- Visual messaging effectiveness
- Content organization and grouping
- Visual emphasis and attention direction
- Professional imagery and graphics quality

STEP 5: ACCESSIBILITY & INCLUSIVE DESIGN

WCAG 3.0 Evaluation:
- Color contrast ratios (AA: 4.5:1, AAA: 7:1)
- Touch target sizes (44x44px iOS, 48x48dp Android)
- Focus indicators visibility
- Screen reader compatibility
- Keyboard navigation support
- Alt text quality

Neurodiversity Considerations:
- Sensory load levels
- Consistency for autism spectrum
- ADHD-friendly focus management
- Dyslexia-optimized typography
- Customization options

STEP 6: VISUAL BUSINESS IMPACT ANALYSIS

Visual Conversion Elements:
- CTA visual prominence and clarity
- Value proposition visual presentation
- Trust signals visibility and placement
- Visual hierarchy of key business elements
- Professional appearance and credibility

UX Copy Analysis:
- CTA copy effectiveness and clarity
- Headline impact and readability
- Visible messaging consistency
- Reading level of visible text
- Jargon usage in displayed content
- Tone consistency across visible elements

Visual Performance Indicators:
- Information density and cognitive load
- Visual complexity assessment
- Content scanability
- Key information findability
- Visual clarity and comprehension

Static Design ROI Factors:
- First impression impact
- Visual credibility assessment
- Information accessibility
- Visual communication effectiveness
- Brand consistency and professionalism

STEP 7: PRECISE ISSUE LOCATION MARKING

For each issue, provide:
- DOM-path or element description
- Pixel coordinates (top-left origin)
- Percentage-based position for responsiveness
- Visual region (header/hero/content/footer)
- Component type affected

STEP 8: INDUSTRY-SPECIFIC VISUAL EVALUATION

If industry detected, add specialized visual analysis:

SAAS:
- Dashboard layout clarity
- Feature visibility and organization
- Upgrade messaging placement
- Data visualization quality
- Interface complexity management

ECOMMERCE:
- Product presentation quality
- Visual hierarchy of products
- Trust badge placement
- Payment security indicators
- Mobile visual experience

FINTECH:
- Security visual indicators
- Compliance badge visibility
- Data presentation clarity
- Professional appearance
- Regulatory information display

RETURN COMPREHENSIVE JSON:
{
  "context": "COMPONENT|FULL_INTERFACE|WIREFRAME|DATA_VIZ|MARKETING|MOBILE",
  "industry": "SAAS|ECOMMERCE|FINTECH|HEALTHCARE|EDUCATION|SOCIAL|ENTERPRISE|UNKNOWN",
  "industryConfidence": 0.85, // 0-1 confidence score
  
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": {
        "score": 82,
        "reasoning": "Strong visual hierarchy with clear CTA, but hero text could be more impactful",
        "evidence": [
          "Primary CTA visible within 3 seconds",
          "Clean layout reduces cognitive load by 40%",
          "Missing emotional hook in headline"
        ]
      },
      "usability": {
        "score": 73,
        "reasoning": "Navigation is intuitive but form completion requires unnecessary steps",
        "evidence": [
          "3-click rule violated for key actions",
          "Search functionality hidden in hamburger menu",
          "Good use of familiar UI patterns"
        ]
      },
      "trustworthiness": {
        "score": 78,
        "reasoning": "Professional design with security badges, but lacks social proof placement",
        "evidence": [
          "SSL badge visible but below fold",
          "No customer logos or testimonials near CTAs",
          "Clean, modern aesthetic builds credibility"
        ]
      },
      "conversion": {
        "score": 69,
        "reasoning": "Clear value prop but friction in checkout process will cost conversions",
        "evidence": [
          "4-step checkout when 2 would suffice",
          "No urgency indicators or limited-time offers",
          "Form fields lack inline validation"
        ]
      },
      "accessibility": {
        "score": 71,
        "reasoning": "Meets basic WCAG AA but missing key features for inclusive design",
        "evidence": [
          "Color contrast passes at 4.5:1",
          "Missing alt text on 30% of images",
          "No keyboard navigation indicators"
        ]
      }
    }
  },
  
  "visualDesignAnalysis": {
    "score": 78,
    "typography": {
      "score": 72,
      "issues": [
        {
          "severity": 2,
          "finding": "Body text at 14px below recommended 16px minimum",
          "location": {"selector": ".content p", "region": "content"},
          "impact": "Reduced readability, especially for users over 40",
          "fix": {
            "immediate": "font-size: 16px; line-height: 24px;",
            "designTokens": "--font-body: 1rem; --line-height-body: 1.5;",
            "explanation": "16px ensures comfortable reading across devices"
          }
        }
      ],
      "hierarchy": {
        "h1ToH2Ratio": 1.5, // Should be 1.618 or 1.2
        "consistencyScore": 0.7,
        "recommendation": "Increase H1 to 36px for golden ratio hierarchy"
      },
      "readability": {
        "fleschScore": 65,
        "avgLineLength": 82, // Characters, should be 45-75
        "recommendation": "Reduce content width to max-width: 65ch;"
      }
    },
    "colorAndContrast": {
      "score": 68,
      "contrastFailures": [
        {
          "foreground": "#666666",
          "background": "#FFFFFF",
          "ratio": 5.74,
          "location": ".subtitle",
          "fix": {
            "suggestion": "#4A4A4A for 8.59:1 ratio",
            "css": "color: #4A4A4A;"
          }
        }
      ],
      "colorHarmony": {
        "scheme": "ANALOGOUS",
        "brandColors": ["#0066CC", "#0052A3", "#003D7A"],
        "accentSuggestion": "#FF6B35 for complementary contrast"
      }
    },
    "spacing": {
      "score": 81,
      "gridSystem": "8-POINT",
      "consistency": 0.85,
      "issues": [
        {
          "element": ".card",
          "current": "padding: 18px",
          "suggestion": "padding: 16px or 24px",
          "reason": "Align to 8-point grid for consistency"
        }
      ]
    },
    "modernPatterns": {
      "detected": ["GLASSMORPHISM", "BOLD_MINIMALISM"],
      "implementation": {
        "glassmorphism": {
          "quality": "GOOD",
          "backdrop-filter": "blur(10px)",
          "suggestion": "Add subtle border: 1px solid rgba(255,255,255,0.18)"
        },
        "boldMinimalism": {
          "quality": "EXCELLENT",
          "observation": "Strong use of chunky typography and whitespace"
        }
      },
      "trendAlignment": {
        "2025Relevance": 0.88,
        "suggestions": [
          "Consider variable fonts for performance",
          "Add subtle micro-animations on hover"
        ]
      }
    },
    "visualHierarchy": {
      "scanPattern": "F-PATTERN",
      "focalPoints": [
        {"element": "Hero CTA", "weight": 0.89},
        {"element": "Main heading", "weight": 0.76},
        {"element": "Navigation", "weight": 0.54}
      ],
      "improvements": [
        {
          "issue": "Secondary CTA competes with primary",
          "fix": "Reduce secondary button visual weight with outline style"
        }
      ]
    }
  },
  
  "criticalIssues": [
    {
      "severity": 4, // 0-4 scale
      "category": "ERROR_PREVENTION",
      "issue": "Important action without visible safeguards",
      "location": {
        "element": "Apply Now button",
        "coordinates": {"x": 200, "y": 150},
        "percentage": {"x": "25%", "y": "18%"},
        "region": "hero",
        "selector": ".apply-button"
      },
      "impact": "Button appears prominent but lacks visual validation or confirmation messaging",
      "evidence": "Direct submission button without visible validation indicators or safety messaging",
      "fix": {
        "immediate": "Add visual indicators of what happens after clicking this button",
        "better": "Consider adding safety messaging or confirmation text near the button",
        "implementation": "Include 'Review before submitting' or similar messaging to set expectations"
      },
      "assumption": "VISUAL_OBSERVATION",
      "context": "Based on this single screen, consider adding visual cues about what happens next"
    }
  ],
  
  "usabilityIssues": [
    {
      "severity": 2,
      "category": "CONSISTENCY",
      "issue": "Button styles inconsistent across interface",
      "location": {
        "elements": ["Primary CTA", "Secondary actions"],
        "region": "multiple"
      },
      "impact": "Reduces learnability and creates confusion",
      "evidence": "3 different button styles for similar actions",
      "fix": {
        "immediate": "Standardize to primary/secondary/tertiary system",
        "cssTokens": "--button-primary-bg: #0066CC; --button-secondary-bg: #E5E5E5; --button-text-primary: #FFFFFF;"
      }
    }
  ],
  
  "opportunities": [
    {
      "category": "CONVERSION",
      "opportunity": "Add social proof near CTA",
      "potentialImpact": "+12-15% conversion rate",
      "implementation": "Add testimonial carousel or trust badges within 200px of main CTA",
      "reasoning": "Users show 23% higher trust when social proof is visible near decision points"
    },
    {
      "category": "VISUAL_DESIGN",
      "opportunity": "Implement variable fonts for better performance",
      "potentialImpact": "30% faster font loading, smoother animations",
      "implementation": "Replace static fonts with variable font: font-variation-settings: 'wght' 400;",
      "reasoning": "Single file serves all weights, enables smooth transitions"
    }
  ],
  
  "behavioralInsights": [
    {
      "pattern": "Visual overload from excessive choice presentation",
      "observation": "15 options presented simultaneously without visual hierarchy",
      "psychology": "Exceeds cognitive comfort zone for information processing",
      "recommendation": "Implement visual grouping or categorize into 3-4 clear sections"
    }
  ],
  
  "accessibilityAudit": {
    "score": 75,
    "wcagLevel": "AA", // A, AA, AAA
    "strengths": [
      "Good semantic HTML structure with proper heading hierarchy",
      "Interactive elements have sufficient size (48x48px minimum)",
      "Form inputs include visible labels and placeholders",
      "Navigation is keyboard accessible with visible focus states"
    ],
    "weaknesses": [
      "Text contrast at 3.5:1 falls below WCAG AA requirement of 4.5:1",
      "Missing alt text on decorative images increases screen reader noise",
      "No skip navigation link for keyboard users",
      "Form error messages not announced to screen readers (missing aria-live)"
    ],
    "criticalFailures": [
      {
        "criterion": "1.4.3 Contrast",
        "issue": "Text contrast 3.5:1 fails WCAG AA",
        "location": {
          "element": "header h1", 
          "selector": ".header h1",
          "boundingBox": {"x": 50, "y": 100, "width": 300, "height": 40}
        },
        "currentValue": "#666666 on #FFFFFF = 3.5:1",
        "requiredValue": "4.5:1 for normal text",
        "fix": "Change text color to #595959 for 4.54:1 ratio",
        "visualContext": "AREA_HIGHLIGHT"
      }
    ],
    "keyboardNav": "GOOD",
    "screenReaderCompat": "PARTIAL", 
    "mobileAccessibility": "GOOD",
    "recommendations": [
      {
        "priority": "HIGH",
        "action": "Fix all contrast issues - affects 15% of users with low vision",
        "effort": "LOW"
      },
      {
        "priority": "MEDIUM", 
        "action": "Add skip navigation link",
        "effort": "LOW"
      }
    ]
  },
  
  "competitiveAnalysis": {
    "strengths": [
      {
        "finding": "Clean visual hierarchy outperforms 73% of industry",
        "evidence": "F-pattern layout with 3-second time to comprehension",
        "competitiveAdvantage": "Users find information 40% faster than average"
      },
      {
        "finding": "Mobile-first responsive design",
        "evidence": "Breakpoints at 768px and 1024px with fluid typography",
        "competitiveAdvantage": "Captures 67% of users who are mobile-first"
      }
    ],
    "weaknesses": [
      {
        "finding": "No social proof near conversion points",
        "evidence": "CTAs lack testimonials within 200px proximity",
        "impact": "Competitors with social proof see 34% higher conversion",
        "fix": "Add customer logos or review stars near main CTA"
      },
      {
        "finding": "Generic value proposition",
        "evidence": "'Apply Now' without clear benefit statement",
        "impact": "Specific value props increase clicks by 42%",
        "fix": "Change to 'Get Approved in 24 Hours' or similar"
      }
    ],
    "benchmarks": {
      "industryAvgConversion": "2.5%",
      "topPerformerConversion": "4.5%",
      "yourEstimatedConversion": "2.0%"
    },
    "conversionBenchmarks": {
      "explanation": "Based on analysis of similar interfaces in your industry",
      "yourEstimated": {
        "rate": "2.0%",
        "reasoning": "Clean design but missing trust signals and urgency"
      },
      "industryAverage": {
        "rate": "2.5%",
        "source": "Financial services landing pages Q1 2025"
      },
      "topPerformers": {
        "rate": "5.0%",
        "characteristics": [
          "Social proof within 100px of CTA",
          "Specific value propositions",
          "2-step simplified forms",
          "Trust badges above fold"
        ]
      },
      "improvementPotential": "+1.5% by adding trust signals and clarifying value"
    }
  },
  
  "uxCopyAnalysis": {
    "score": 68,
    "issues": [
      {
        "severity": "HIGH",
        "current": "Apply Now",
        "location": "Primary CTA button",
        "issue": "Generic CTA doesn't communicate value or urgency",
        "suggested": [
          "Get Instant Pre-Approval",
          "Check Your Rate in 2 Minutes",
          "Start Your Application → 3 min"
        ],
        "impact": "Specific CTAs increase click-through by 35-40%",
        "reasoning": "Users need to know what happens next and how long it takes"
      },
      {
        "severity": "MEDIUM",
        "current": "Welcome to our application process",
        "location": "Hero headline",
        "issue": "Passive voice and no clear benefit",
        "suggested": [
          "Get Approved for Up to $50,000 Today",
          "Your Loan Decision in Minutes, Not Days",
          "Fast Funding When You Need It Most"
        ],
        "impact": "Benefit-driven headlines increase engagement by 28%",
        "reasoning": "Lead with what users get, not what you do"
      },
      {
        "severity": "LOW",
        "current": "Submit",
        "location": "Form submission",
        "issue": "Doesn't set expectations for next steps",
        "suggested": [
          "Get My Results",
          "See My Options",
          "Complete Application"
        ],
        "impact": "Clear outcome labels reduce form abandonment by 15%",
        "reasoning": "Users want to know what happens after clicking"
      }
    ],
    "writingTone": {
      "current": "Formal, institutional",
      "recommended": "Conversational, benefit-focused",
      "example": "Change 'Applicants must provide' to 'You'll need'"
    }
  },
  
  "generationalAnalysis": {
    "scores": {
      "genAlpha": {
        "score": 45,
        "reasoning": "Static design lacks interactive elements this generation expects",
        "specificIssues": [
          "No gamification or progress indicators",
          "Missing voice/gesture controls they're accustomed to",
          "Text-heavy without video content or animations",
          "Static design lacks dynamic visual elements they expect"
        ],
        "improvements": "Add micro-interactions, progress bars, and consider voice UI"
      },
      "genZ": {
        "score": 78,
        "reasoning": "Aesthetic appeals but missing social features they value",
        "specificIssues": [
          "No social sharing capabilities visible",
          "Lacks user-generated content sections",
          "Missing dark mode toggle (expected by 85% of Gen Z)",
          "Could use more dynamic visual content"
        ],
        "improvements": "Add Instagram-worthy moments, user reviews, and social proof"
      },
      "millennials": {
        "score": 82,
        "reasoning": "Efficient design that respects their time with minor friction points",
        "specificIssues": [
          "Process appears visually complex",
          "Missing comparison features they research with",
          "Good mobile responsiveness they require",
          "Clear pricing transparency they demand"
        ],
        "improvements": "Streamline checkout, add comparison tools, highlight reviews"
      },
      "genX": {
        "score": 71,
        "reasoning": "Functional but some modern patterns create confusion",
        "specificIssues": [
          "Hamburger menu hides important navigation",
          "Gestures not obvious without labels",
          "Good information density they prefer",
          "Trustworthy appearance with security visible"
        ],
        "improvements": "Make navigation more explicit, add text labels to icons"
      },
      "boomers": {
        "score": 58,
        "reasoning": "Design assumptions don't match their interaction patterns",
        "specificIssues": [
          "16px font size difficult for 68% of this demographic",
          "Touch targets below 44px minimum",
          "Contrast could be stronger for aging eyes",
          "Multi-step processes not clearly indicated"
        ],
        "improvements": "Increase font to 18px+, enhance contrast, simplify flows"
      }
    },
    "primaryTarget": "millennials",
    "recommendations": [
      "Add text size controls for older users",
      "Implement subtle animations for Gen Z appeal",
      "Consider voice search for Gen Alpha future-proofing"
    ]
  }
}

CRITICAL RULES:
1. Every issue MUST include specific location data
2. Severity ratings must be justified by user impact
3. Implementation guidance must be framework-agnostic unless React/Vue detected
4. Never make assumptions about industry - mark as UNKNOWN if unclear
5. Provide actual code snippets, not just descriptions
6. Reference specific WCAG criteria numbers
7. All percentages and metrics must be research-backed
8. Distinguish between quick fixes and strategic improvements
9. Visual design feedback must include specific CSS values and design tokens
10. Always calculate actual contrast ratios and spacing measurements
11. EVERY SCORE MUST INCLUDE:
    - Clear reasoning explaining WHY that score was given
    - Specific evidence from the interface (what you observed)
    - Data-backed justification when possible (e.g., "42% of users abandon at this point")
    - Actionable context that helps users understand the impact
12. GENERATIONAL SCORES MUST INCLUDE:
    - Specific UI elements that work/don't work for that generation
    - Behavioral patterns unique to that demographic
    - Concrete examples from the interface being analyzed
    - Never use generic statements like "needs to be clearer"
13. FOCUS ON STATIC VISUAL ANALYSIS ONLY:
    - You are analyzing a STATIC IMAGE - one screen/component only
    - Do NOT assume flows, interactions, or what happens when elements are clicked
    - Frame suggestions as visual improvements: "Consider adding visual indicators", "Improve visual messaging"
    - Mark flow-related suggestions as "VISUAL_OBSERVATION" not "CRITICAL_ISSUE"
    - Example: "This button would benefit from clearer visual messaging about its purpose"
14. STATIC ANALYSIS LANGUAGE GUIDELINES:
    - Use "appears", "seems", "visually suggests" instead of definitive statements
    - Focus on what is visible, not what might happen when interacted with
    - Recommend visual improvements, not interaction changes

Remember: You're analyzing a STATIC IMAGE of a single screen. Focus on visual design, not interactions or flows. Analyze what you can see, not what might happen when users interact with it. Every insight must be based on visual evidence only.`
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
      max_tokens: 4000, // Increased for comprehensive analysis
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
    let analysis: ZombifyAnalysis;
    try {
      analysis = JSON.parse(cleanContent) as ZombifyAnalysis;
    } catch (parseError) {
      console.log('Failed to parse as JSON, OpenAI returned:', cleanContent);
      
      // If OpenAI refuses to analyze, return a more helpful error
      if (cleanContent.includes("unable to assist") || cleanContent.includes("can't analyze")) {
        throw new Error('OpenAI cannot analyze this image. This may happen with certain content types or image formats.');
      }
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    // Validate the response has required fields
    if (!analysis.gripScore || !analysis.criticalIssues || !analysis.context) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Return the full analysis with timestamp
    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('Timeout while downloading')) {
        return {
          context: "ERROR" as const,
          industry: "UNKNOWN" as const,
          industryConfidence: 0,
          gripScore: {
            overall: 0,
            breakdown: {
              firstImpression: { score: 0, reasoning: "Analysis failed", evidence: [] },
              usability: { score: 0, reasoning: "Analysis failed", evidence: [] },
              trustworthiness: { score: 0, reasoning: "Analysis failed", evidence: [] },
              conversion: { score: 0, reasoning: "Analysis failed", evidence: [] },
              accessibility: { score: 0, reasoning: "Analysis failed", evidence: [] }
            }
          },
          visualDesignAnalysis: {
            score: 0,
            typography: {
              score: 0,
              issues: [],
              hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: "Analysis failed" },
              readability: { fleschScore: 0, avgLineLength: 0, recommendation: "Analysis failed" }
            },
            colorAndContrast: {
              score: 0,
              contrastFailures: [],
              colorHarmony: { scheme: "UNKNOWN", brandColors: [], accentSuggestion: "Analysis failed" }
            },
            spacing: {
              score: 0,
              gridSystem: "UNKNOWN",
              consistency: 0,
              issues: []
            },
            modernPatterns: {
              detected: [],
              implementation: {},
              trendAlignment: { "2025Relevance": 0, suggestions: [] }
            },
            visualHierarchy: {
              scanPattern: "UNKNOWN",
              focalPoints: [],
              improvements: []
            }
          },
          uxCopyAnalysis: {
            score: 0,
            issues: [],
            writingTone: {
              current: "Unknown",
              recommended: "Unknown",
              example: "Analysis failed"
            }
          },
          criticalIssues: [
            {
              severity: 4,
              category: "SYSTEM_ERROR",
              issue: "Image download timeout",
              location: {
                element: "system",
                region: "none",
              },
              impact: "OpenAI couldn't download your image in time. This usually happens with large files.",
              evidence: "The image URL timed out during download",
              fix: {
                immediate: "Try uploading a smaller image (under 5MB)",
                better: "Optimize your image before uploading (reduce resolution or compress)",
                implementation: "Use an image optimization tool to reduce file size"
              }
            }
          ],
          usabilityIssues: [],
          opportunities: [],
          behavioralInsights: [],
          accessibilityAudit: null,
          competitiveAnalysis: null,
          generationalAnalysis: {
            scores: {},
            primaryTarget: "unknown",
            recommendations: []
          },
          timestamp: new Date().toISOString(),
          error: true
        };
      }
      
      if (error.message.includes('unable to assist') || error.message.includes("can't analyze")) {
        return {
          context: "ERROR" as const,
          industry: "UNKNOWN" as const,
          industryConfidence: 0,
          gripScore: {
            overall: 0,
            breakdown: {
              firstImpression: { score: 0, reasoning: "Analysis failed", evidence: [] },
              usability: { score: 0, reasoning: "Analysis failed", evidence: [] },
              trustworthiness: { score: 0, reasoning: "Analysis failed", evidence: [] },
              conversion: { score: 0, reasoning: "Analysis failed", evidence: [] },
              accessibility: { score: 0, reasoning: "Analysis failed", evidence: [] }
            }
          },
          visualDesignAnalysis: {
            score: 0,
            typography: {
              score: 0,
              issues: [],
              hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: "Analysis failed" },
              readability: { fleschScore: 0, avgLineLength: 0, recommendation: "Analysis failed" }
            },
            colorAndContrast: {
              score: 0,
              contrastFailures: [],
              colorHarmony: { scheme: "UNKNOWN", brandColors: [], accentSuggestion: "Analysis failed" }
            },
            spacing: {
              score: 0,
              gridSystem: "UNKNOWN",
              consistency: 0,
              issues: []
            },
            modernPatterns: {
              detected: [],
              implementation: {},
              trendAlignment: { "2025Relevance": 0, suggestions: [] }
            },
            visualHierarchy: {
              scanPattern: "UNKNOWN",
              focalPoints: [],
              improvements: []
            }
          },
          uxCopyAnalysis: {
            score: 0,
            issues: [],
            writingTone: {
              current: "Unknown",
              recommended: "Unknown",
              example: "Analysis failed"
            }
          },
          criticalIssues: [
            {
              severity: 4,
              category: "SYSTEM_ERROR",
              issue: "Content not supported",
              location: {
                element: "system",
                region: "none",
              },
              impact: "This image contains content that cannot be analyzed",
              evidence: "OpenAI's content policy prevented analysis",
              fix: {
                immediate: "Upload a different interface screenshot",
                better: "Use screenshots of websites, apps, or dashboards without sensitive content",
                implementation: "Try a SaaS dashboard, e-commerce site, or app interface"
              }
            }
          ],
          usabilityIssues: [],
          opportunities: [],
          behavioralInsights: [],
          accessibilityAudit: null,
          competitiveAnalysis: null,
          generationalAnalysis: {
            scores: {},
            primaryTarget: "unknown",
            recommendations: []
          },
          timestamp: new Date().toISOString(),
          error: true
        };
      }
    }
    
    // Generic error fallback
    return {
      context: "ERROR" as const,
      industry: "UNKNOWN" as const,
      industryConfidence: 0,
      gripScore: {
        overall: 0,
        breakdown: {
          firstImpression: { score: 0, reasoning: "Analysis failed", evidence: [] },
          usability: { score: 0, reasoning: "Analysis failed", evidence: [] },
          trustworthiness: { score: 0, reasoning: "Analysis failed", evidence: [] },
          conversion: { score: 0, reasoning: "Analysis failed", evidence: [] },
          accessibility: { score: 0, reasoning: "Analysis failed", evidence: [] }
        }
      },
      visualDesignAnalysis: {
        score: 0,
        typography: {
          score: 0,
          issues: [],
          hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: "Analysis failed" },
          readability: { fleschScore: 0, avgLineLength: 0, recommendation: "Analysis failed" }
        },
        colorAndContrast: {
          score: 0,
          contrastFailures: [],
          colorHarmony: { scheme: "UNKNOWN", brandColors: [], accentSuggestion: "Analysis failed" }
        },
        spacing: {
          score: 0,
          gridSystem: "UNKNOWN",
          consistency: 0,
          issues: []
        },
        modernPatterns: {
          detected: [],
          implementation: {},
          trendAlignment: { "2025Relevance": 0, suggestions: [] }
        },
        visualHierarchy: {
          scanPattern: "UNKNOWN",
          focalPoints: [],
          improvements: []
        }
      },
      uxCopyAnalysis: {
        score: 0,
        issues: [],
        writingTone: {
          current: "Unknown",
          recommended: "Unknown",
          example: "Analysis failed"
        }
      },
      criticalIssues: [
        {
          severity: 4,
          category: "SYSTEM_ERROR",
          issue: "Analysis service temporarily unavailable",
          location: {
            element: "system",
            region: "none",
          },
          impact: "Unable to analyze the uploaded image",
          evidence: error instanceof Error ? error.message : "Unknown error occurred",
          fix: {
            immediate: "Please check your API key and try again",
            better: "Ensure the image is in a supported format (PNG, JPG, GIF)",
            implementation: "Contact support if the issue persists"
          }
        }
      ],
      usabilityIssues: [],
      opportunities: [],
      behavioralInsights: [],
      accessibilityAudit: null,
      competitiveAnalysis: null,
      generationalAnalysis: {
        scores: {},
        primaryTarget: "unknown",
        recommendations: []
      },
      timestamp: new Date().toISOString(),
      error: true
    };
  }
}