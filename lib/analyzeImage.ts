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
              text: `You are Zombify's elite UX analysis engine - a synthesis of Nielsen Norman Group's systematic evaluation, IDEO's human-centered insights, and frog design's strategic vision. You've analyzed 50,000+ interfaces and can predict user behavior with 92% accuracy.

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

Apply Nielsen's Heuristics with Modern Extensions:

1. VISIBILITY OF SYSTEM STATUS
   - Loading states, progress indicators, active states
   - Real-time feedback, skeleton screens, micro-animations
   - Severity: 0 (cosmetic) to 4 (catastrophic)

2. MATCH BETWEEN SYSTEM & REAL WORLD
   - Language clarity, metaphor appropriateness, cultural fit
   - Icon recognition, terminology accuracy
   - Industry-specific conventions

3. USER CONTROL & FREEDOM
   - Undo/redo availability, exit points, navigation flexibility
   - Modal trap detection, back button behavior
   - Task abandonment paths

4. CONSISTENCY & STANDARDS
   - Design system adherence, pattern library usage
   - Platform convention compliance (iOS/Android/Web)
   - Internal consistency across screens

5. ERROR PREVENTION
   - Input validation, confirmation dialogs, safe defaults
   - Destructive action protection, autosave features
   - Edge case handling

6. RECOGNITION OVER RECALL
   - Information visibility, contextual hints, progressive disclosure
   - Cognitive load measurement, memory burden
   - Search vs. browse optimization

7. FLEXIBILITY & EFFICIENCY
   - Power user features, keyboard shortcuts, batch actions
   - Customization options, saved preferences
   - Task completion speed

8. AESTHETIC & MINIMALIST DESIGN
   - Visual hierarchy, whitespace usage, content density
   - Signal-to-noise ratio, decorative vs. functional
   - Attention economy optimization

9. ERROR RECOVERY
   - Error message clarity, solution guidance, recovery paths
   - Helpful error states, contact options
   - Graceful degradation

10. HELP & DOCUMENTATION
    - Contextual help, tooltips, onboarding flows
    - Documentation accessibility, video tutorials
    - Support channel visibility

STEP 3: VISUAL HIERARCHY & ATTENTION ANALYSIS

Analyze using eye-tracking principles:
- F-PATTERN detection for text-heavy interfaces
- Z-PATTERN for image-rich layouts
- GUTENBERG DIAGRAM for balanced designs
- Focal point identification (faces, contrast, size)
- Visual weight distribution
- Gestalt principle violations (proximity, similarity, closure)

Cognitive Load Assessment:
- INTRINSIC: Core task complexity
- EXTRANEOUS: Unnecessary design burden
- GERMANE: Learning and pattern formation
- Working memory violations (>4±1 items)
- Information chunking effectiveness

STEP 4: BEHAVIORAL PSYCHOLOGY EVALUATION

Dark Pattern Detection:
- Roach motels (easy in, hard out)
- Confirmshaming language
- Hidden costs or subscriptions
- Forced continuity tricks
- Privacy zuckering
- Misdirection techniques

Persuasion Principles (Cialdini):
- Social proof implementation
- Authority indicators
- Scarcity/urgency tactics
- Reciprocity mechanisms
- Commitment/consistency flows
- Liking/affinity building

Trust Indicators:
- Security badges placement
- Testimonial authenticity
- Data handling transparency
- Professional design quality
- Contact information visibility
- Policy accessibility

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

STEP 6: BUSINESS IMPACT ANALYSIS

Conversion Optimization:
- Friction point identification
- Checkout flow efficiency (if applicable)
- CTA prominence and clarity
- Value proposition communication
- Trust barrier analysis

Performance Metrics:
- Perceived load time
- Time to interactive
- First meaningful paint
- Cumulative layout shift

ROI Indicators:
- Task completion likelihood
- Error rate predictions
- Support ticket generators
- Abandonment risk factors

STEP 7: PRECISE ISSUE LOCATION MARKING

For each issue, provide:
- DOM-path or element description
- Pixel coordinates (top-left origin)
- Percentage-based position for responsiveness
- Visual region (header/hero/content/footer)
- Component type affected

STEP 8: INDUSTRY-SPECIFIC EVALUATION

If industry detected, add specialized analysis:

SAAS:
- Onboarding flow effectiveness
- Feature discovery mechanisms
- Upgrade prompts placement
- Data visualization clarity
- Multi-tenant considerations

ECOMMERCE:
- Product findability
- Cart abandonment factors
- Checkout optimization
- Trust during payment
- Mobile shopping experience

FINTECH:
- Security perception
- Compliance visibility
- Data accuracy presentation
- Transaction clarity
- Regulatory adherence

RETURN COMPREHENSIVE JSON:
{
  "context": "COMPONENT|FULL_INTERFACE|WIREFRAME|DATA_VIZ|MARKETING|MOBILE",
  "industry": "SAAS|ECOMMERCE|FINTECH|HEALTHCARE|EDUCATION|SOCIAL|ENTERPRISE|UNKNOWN",
  "industryConfidence": 0.85, // 0-1 confidence score
  
  "gripScore": {
    "overall": 75,
    "breakdown": {
      "firstImpression": 82,
      "usability": 73,
      "trustworthiness": 78,
      "conversion": 69,
      "accessibility": 71
    }
  },
  
  "criticalIssues": [
    {
      "severity": 4, // 0-4 scale
      "category": "ERROR_PREVENTION",
      "issue": "Destructive action lacks confirmation dialog",
      "location": {
        "element": "Delete button",
        "coordinates": {"x": 420, "y": 380},
        "percentage": {"x": "65%", "y": "45%"},
        "region": "content",
        "selector": ".danger-button"
      },
      "impact": "Users may accidentally delete important data",
      "evidence": "Delete button is same visual weight as other actions",
      "fix": {
        "immediate": "Add confirmation modal: onclick='return confirm(\"Delete permanently?\")'",
        "better": "Implement two-step deletion with undo option",
        "implementation": "const deleteBtn = document.querySelector('.danger-button');\ndeleteBtn.addEventListener('click', (e) => {\n  e.preventDefault();\n  // Show confirmation modal\n});"
      }
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
        "cssTokens": "--button-primary-bg: #0066CC;\n--button-secondary-bg: #E5E5E5;\n--button-text-primary: #FFFFFF;"
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
    }
  ],
  
  "behavioralInsights": [
    {
      "pattern": "Analysis paralysis from choice overload",
      "observation": "15 options presented simultaneously without hierarchy",
      "psychology": "Exceeds Miller's Law cognitive limit (7±2)",
      "recommendation": "Implement progressive disclosure or categorize into 3-4 groups"
    }
  ],
  
  "accessibilityAudit": {
    "score": 71,
    "wcagLevel": "A", // A, AA, AAA
    "criticalFailures": [
      {
        "criterion": "1.4.3 Contrast",
        "issue": "Text contrast 3.2:1 fails WCAG AA",
        "location": {"element": "body text", "selector": ".content p"},
        "fix": "Change text color to #333333 for 7:1 ratio"
      }
    ],
    "keyboardNav": "PARTIAL",
    "screenReaderCompat": "GOOD",
    "recommendations": ["Add skip links", "Improve focus indicators", "Add ARIA labels"]
  },
  
  "competitiveAnalysis": {
    "strengths": ["Clean visual hierarchy", "Mobile-responsive design"],
    "weaknesses": ["Below industry conversion standards", "Lacks personalization"],
    "benchmarks": {
      "industryAvgConversion": "2.3%",
      "topPerformerConversion": "5.1%",
      "yourEstimatedConversion": "1.7%"
    }
  },
  
  "implementationRoadmap": {
    "phase1": {
      "duration": "1-2 days",
      "tasks": ["Fix critical accessibility issues", "Standardize buttons"],
      "impact": "HIGH"
    },
    "phase2": {
      "duration": "1 week",
      "tasks": ["Implement social proof", "Optimize forms"],
      "impact": "MEDIUM"
    }
  },
  
  "generationalAnalysis": {
    "scores": {
      "genAlpha": {
        "score": 45,
        "reasoning": "Too text-heavy, lacks gamification or voice controls"
      },
      "genZ": {
        "score": 78,
        "reasoning": "Modern aesthetic with good mobile experience, could use more micro-interactions"
      },
      "millennials": {
        "score": 82,
        "reasoning": "Efficient, clean design that respects their time"
      },
      "genX": {
        "score": 71,
        "reasoning": "Clear functionality but some modern patterns may confuse"
      },
      "boomers": {
        "score": 58,
        "reasoning": "Text too small, interactions not immediately obvious"
      }
    },
    "primaryTarget": "millennials",
    "recommendations": [
      "Add text size controls for older users",
      "Implement subtle animations for Gen Z appeal",
      "Consider voice search for Gen Alpha future-proofing"
    ]
  },
  
  "technicalAudit": {
    "performanceIssues": [
      "Large DOM size (2,847 nodes) impacts performance",
      "Unused CSS rules increase bundle size"
    ],
    "codeQuality": [
      "Inline styles should move to CSS classes",
      "Missing semantic HTML5 elements"
    ],
    "seoConsiderations": [
      "Missing meta descriptions",
      "Images lack descriptive alt text"
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

Remember: You're replacing $80,000 consulting engagements. Every insight must be surgical, specific, and impossible to get from generic tools.`
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
              firstImpression: 0,
              usability: 0,
              trustworthiness: 0,
              conversion: 0,
              accessibility: 0
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
          implementationRoadmap: null,
          generationalAnalysis: {
            scores: {},
            primaryTarget: "unknown",
            recommendations: []
          },
          technicalAudit: null,
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
              firstImpression: 0,
              usability: 0,
              trustworthiness: 0,
              conversion: 0,
              accessibility: 0
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
          implementationRoadmap: null,
          generationalAnalysis: {
            scores: {},
            primaryTarget: "unknown",
            recommendations: []
          },
          technicalAudit: null,
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
          firstImpression: 0,
          usability: 0,
          trustworthiness: 0,
          conversion: 0,
          accessibility: 0
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
      implementationRoadmap: null,
      generationalAnalysis: {
        scores: {},
        primaryTarget: "unknown",
        recommendations: []
      },
      technicalAudit: null,
      timestamp: new Date().toISOString(),
      error: true
    };
  }
}