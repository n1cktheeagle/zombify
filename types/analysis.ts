// types/analysis.ts - Enhanced version with all new features including PerceptionLayer and ModuleStrength
// Place this file in your project root: /types/analysis.ts

// === VISION API TYPES - KEEP FOR DATA ENHANCEMENT ===
export interface VisionTextAnnotation {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fontSize?: number;
  fontWeight?: string;
}

export interface VisionColorInfo {
  color: { red: number; green: number; blue: number };
  score: number;
  pixelFraction: number;
}

export interface VisionAnalysisResult {
  textAnnotations: VisionTextAnnotation[];
  logoAnnotations: Array<{
    description: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  imageProperties: {
    dominantColors: VisionColorInfo[];
  };
  webDetection?: {
    webEntities: Array<{
      entityId: string;
      description: string;
      score: number;
    }>;
    bestGuessLabels: Array<{
      label: string;
      languageCode: string;
    }>;
  };
}

// === ACCESSIBILITY AUDIT TYPES ===

export interface AccessibilityFailure {
  criterion: string; // e.g., "Color Contrast", "Text Size"
  issue: string; // Description of the issue
  location: {
    selector?: string;
    element?: string;
  };
  currentValue: string; // e.g., "2.1:1"
  requiredValue: string; // e.g., "4.5:1"
  fix: string; // How to fix it
}

export interface AccessibilityAudit {
  score: number; // 0-100
  criticalFailures?: AccessibilityFailure[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: Array<{
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    effort: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  automated?: boolean; // Whether this was automated analysis
  colorContrast?: {
    issues: Array<{
      element: string;
      contrastRatio: string;
      fix: string;
    }>;
  };
  textSize?: {
    smallTextCount: number;
    minimumSize: string;
    recommendation: string;
  };
}

// === NEW PERCEPTION LAYER AND MODULE STRENGTH TYPES ===

// Enhanced Attention Flow Item with structured data
export interface AttentionFlowItem {
  priority: number; // 1 = highest priority (what users see first)
  element: string; // e.g. "Hero headline", "Primary CTA button"
  reasoning: string; // Why this draws attention (size, color, position)
  timeSpent: string; // e.g. "2-3 seconds"
  conversionImpact: 'HIGH' | 'MEDIUM' | 'LOW';
}

// New Perception Layer for cognitive processing
export interface PerceptionLayer {
  primaryEmotion: {
    type: 'trust' | 'anxiety' | 'excitement' | 'confusion' | 'frustration' | 'delight' | 'anticipation' | 'skepticism' | 'curiosity';
    intensity: number; // 1-10 scale
  };
  attentionFlow: AttentionFlowItem[]; // Moved here from just verdict
  clarityFlags: {
    uxCopy: boolean;
    visual: boolean;
    darkPattern: boolean;
    behavioral: boolean;
    strategicIntent: boolean;
    accessibility: boolean;
    [key: string]: boolean; // Allow future expansion
  };
}

// Module Strength scoring for signal clarity
export interface ModuleStrength {
  uxCopyInsights: number; // 1-5 scale
  visualDesign: number;
  behavioralInsights: number; // Changed from behavioralInsight to match new structure
  darkPatterns: number;
  issuesAndFixes: number;
  opportunities: number;
  frictionPoints: number;
  generationalAnalysis: number;
  accessibility: number;
  [key: string]: number; // Allow future module additions
}

// === ENHANCED ANALYSIS TYPES ===

// Dark Pattern Detection - Enhanced with risk assessment
export interface DarkPattern {
  type: 'URGENCY_MANIPULATION' | 'BAIT_AND_SWITCH' | 'HIDDEN_COSTS' | 'FORCED_CONTINUITY' | 'ROACH_MOTEL' | 'CONFIRM_SHAMING';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  element: string;
  location: string; // Where in the interface
  evidence: string;
  impact: string;
  ethicalAlternative: string;
  // NEW: Risk assessment fields
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  fallbackExplanation?: string;
}

// Strategic Intent Analysis
export interface IntentAnalysis {
  perceivedPurpose: string;
  actualPurpose: string;
  clarity?: 'clear' | 'mixed' | 'unclear'; // Made optional for backward compatibility
  alignmentScore: number; // 1-5 scale
  misalignments: string[];
  clarityImprovements: string[];
}

// Friction Points Analysis
export interface FrictionPoint {
  stage: 'AWARENESS' | 'CONSIDERATION' | 'DECISION' | 'ACTION';
  friction: string;
  evidence: string;
  dropoffRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  quickFix: string;
  impact: string;
}

// Enhanced UX Copy Analysis
export interface AudienceAlignment {
  detectedAudience: string;
  copyStyle: string;
  brandArchetype: string;
  toneMismatch: number;
}

export interface MicroCopyOpportunity {
  type: 'ERROR_MESSAGING' | 'EMPTY_STATES' | 'FORM_LABELS' | 'SUCCESS_MESSAGES';
  current: string;
  location: string;
  issue: string;
  improved: string;
  reasoning: string;
}

export interface EnhancedUXCopyIssue {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  element: string;
  location: string;
  issue: string;
  psychologicalImpact: string;
  audienceSpecific: {
    genZ?: string;
    millennial?: string;
    corporate?: string;
  };
  suggested: string[];
  impact: string;
  reasoning: string;
}

// Enhanced Behavioral Insights
export interface EmotionalImpact {
  primaryEmotion: 'trust' | 'anxiety' | 'excitement' | 'confusion' | 'frustration' | 'delight' | 'anticipation' | 'skepticism';
  intensity: number;
  reasoning: string;
}

export interface EnhancedBehavioralInsight {
  pattern: string;
  observation: string;
  psychology: string;
  emotionalImpact: EmotionalImpact;
  recommendation: string;
}

// Visual Design Feedback (new tile-based structure)
export interface VisualDesignFeedback {
  area: string; // e.g. "Header section", "CTA button"
  feedback: string; // Clean, actionable feedback
  confidence: number; // 0-1 scale
}

// === EXISTING TYPES (KEPT FOR COMPATIBILITY) ===

// Location interface - enhanced with visual context
export interface Location {
  element: string;
  region: string;
  visualContext?: string; // Enhanced by Vision API
}

// Fix information with implementation details
export interface Fix {
  immediate: string;
  better?: string;
  implementation?: string;
  cssTokens?: string;
  designTokens?: string;
  explanation?: string;
  css?: string;
  suggestion?: string;
}

// Issue structure - now includes issuesAndFixes
export interface Issue {
  severity: number; // 0-4
  category: string;
  issue: string;
  area?: string; // For issuesAndFixes
  location?: Location;
  impact: string;
  evidence?: string;
  fix: Fix;
  assumption?: string;
  context?: string;
  finding?: string;
}

// Enhanced Grip Score Breakdown with reasoning
export interface GripScoreBreakdownItem {
  score: number;
  reasoning: string;
  evidence: string[];
}

export interface GripScoreBreakdown {
  firstImpression: GripScoreBreakdownItem;
  usability: GripScoreBreakdownItem;
  trustworthiness: GripScoreBreakdownItem;
  conversion: GripScoreBreakdownItem;
}

// Updated Grip Score with detailed breakdown
export interface GripScore {
  overall: number;
  breakdown: GripScoreBreakdown;
}

// Enhanced Verdict interface with attention flow
export interface Verdict {
  summary: string; // Now includes brutal punchline first
  attentionSpan: string;
  likelyAction: string;
  dropoffPoint: string;
  memorable: string;
  attentionFlow: AttentionFlowItem[]; // Keep for backward compatibility
}

// Enhanced Generational Score with specific issues
export interface GenerationalScore {
  score: number;
  reasoning: string;
  specificIssues: string[];
  improvements: string;
}

// Growth opportunity
export interface Opportunity {
  category: string;
  opportunity: string;
  potentialImpact: string;
  implementation: string;
  reasoning: string;
  location?: Location;
}


// === EXISTING TYPES (KEPT FOR COMPATIBILITY) ===

// Location interface - simplified without visual coordinates
export interface Location {
  element: string;     // Plain language description
  region: string;      // General area description
  visualContext?: string;  // What's around it
}

// Fix information with implementation details
export interface Fix {
  immediate: string;
  better?: string;
  implementation?: string;
  cssTokens?: string;
  designTokens?: string;
  explanation?: string;
  css?: string;
  suggestion?: string;
}

// Issue structure - clean without visual annotation references
export interface Issue {
  severity: number; // 0-4
  category: string;
  issue: string;
  location?: Location;
  impact: string;
  evidence?: string;
  fix: Fix;
  assumption?: string;
  context?: string;
  finding?: string;
}

// Enhanced Grip Score Breakdown with reasoning
export interface GripScoreBreakdownItem {
  score: number;
  reasoning: string;
  evidence: string[];
}

export interface GripScoreBreakdown {
  firstImpression: GripScoreBreakdownItem;
  usability: GripScoreBreakdownItem;
  trustworthiness: GripScoreBreakdownItem;
  conversion: GripScoreBreakdownItem;
}

// Updated Grip Score with detailed breakdown
export interface GripScore {
  overall: number;
  breakdown: GripScoreBreakdown;
}

// Enhanced Verdict interface with new attention flow
export interface Verdict {
  summary: string;
  attentionSpan: string;
  likelyAction: string;
  dropoffPoint: string;
  memorable: string;
  attentionFlow: AttentionFlowItem[]; // Enhanced from string[] to structured data
}

// Enhanced Generational Score with specific issues
export interface GenerationalScore {
  score: number;
  reasoning: string;
  specificIssues: string[];
  improvements: string;
}

// Growth opportunity - clean without visual annotation references
export interface Opportunity {
  category: string;
  opportunity: string;
  potentialImpact: string;
  implementation: string;
  reasoning: string;
  location?: Location;
}

// Visual Design Analysis structures
export interface TypographyIssue {
  severity: number;
  finding: string;
  location: { selector: string; region: string };
  impact: string;
  fix: {
    immediate: string;
    designTokens: string;
    explanation: string;
  };
}

export interface TypographyAnalysis {
  score: number;
  issues: TypographyIssue[];
  hierarchy: {
    recommendation: string;
    h1ToH2Ratio?: number;
    consistencyScore?: number;
  };
  readability: {
    recommendation: string;
    fleschScore?: number;
    avgLineLength?: number;
  };
  // ENHANCED: Add Vision API small text detection
  smallTextWarnings?: {
    count: number;
    message: string;
  } | null;
}

export interface ContrastFailure {
  location: string;
  fix: {
    suggestion: string;
    css?: string;
  };
}

export interface ColorAnalysis {
  score: number;
  contrastFailures: ContrastFailure[];
  colorHarmony: {
    scheme: string;
    brandColors: string[];
    accentSuggestion: string;
  };
  // ENHANCED: Add Vision API color data
  measuredContrasts?: Array<{
    severity: string;
    colors: Array<{ red: number; green: number; blue: number }>;
    ratio: string;
    recommendation: string;
  }>;
  dominantColorPalette?: Array<{
    hex: string;
    percentage: string;
  }>;
}

export interface SpacingIssue {
  element: string;
  current: string;
  suggestion: string;
  reason: string;
}

export interface SpacingAnalysis {
  score: number;
  issues: SpacingIssue[];
  gridSystem?: string;
  consistency?: number;
}

export interface ModernPatternsAnalysis {
  score?: number;
  detected: string[];
  implementation: Record<string, any>;
  trendAlignment: {
    "2025Relevance": number;
    suggestions: string[];
  };
}

export interface VisualHierarchyAnalysis {
  score?: number;
  scanPattern: string;
  focalPoints: Array<{
    element: string;
  }>;
  improvements: Array<{
    issue: string;
    fix: string;
  }>;
}

// Updated Visual Design Analysis with tile-based feedback
export interface VisualDesignAnalysis {
  score: number;
  typography: TypographyAnalysis;
  colorAndContrast: ColorAnalysis;
  spacing: SpacingAnalysis;
  modernPatterns: ModernPatternsAnalysis;
  visualHierarchy: VisualHierarchyAnalysis;
  tileFeedback?: VisualDesignFeedback[]; // New tile-based feedback
}

// ENHANCED UX Copy Analysis with new features
export interface EnhancedUXCopyAnalysis {
  score: number;
  audienceAlignment: AudienceAlignment;
  issues: EnhancedUXCopyIssue[];
  microCopyOpportunities: MicroCopyOpportunity[];
  writingTone: {
    current: string;
    recommended: string;
    example: string;
  };
}


// Clean generational analysis
export interface GenerationalAnalysis {
  scores: {
    genAlpha?: GenerationalScore;
    genZ?: GenerationalScore;
    millennials?: GenerationalScore;
    genX?: GenerationalScore;
    boomers?: GenerationalScore;
  };
  primaryTarget: string;
  recommendations: string[];
}

// === MAIN ENHANCED ANALYSIS INTERFACE ===
export interface ZombifyAnalysis {
  // Context and classification
  context: 'COMPONENT' | 'FULL_INTERFACE' | 'WIREFRAME' | 'DATA_VIZ' | 'MARKETING' | 'MOBILE' | 'ERROR' | 'LANDING_PAGE' | 'DASHBOARD' | 'FORM' | 'ECOMMERCE';
  industry: 'SAAS' | 'ECOMMERCE' | 'FINTECH' | 'HEALTHCARE' | 'EDUCATION' | 'SOCIAL' | 'ENTERPRISE' | 'UNKNOWN';
  industryConfidence: number;
  
  // Core scoring and verdict
  gripScore: GripScore;
  verdict: Verdict;
  
  // NEW: Perception Layer
  perceptionLayer?: PerceptionLayer;
  
  // NEW: Module Strength Scores
  moduleStrength?: ModuleStrength;
  
  // Enhanced analysis sections
  darkPatterns: DarkPattern[];
  intentAnalysis: IntentAnalysis | null;
  frictionPoints: FrictionPoint[];
  
  // Core analysis sections (renamed from criticalIssues)
  issuesAndFixes: Issue[]; // Renamed from criticalIssues
  opportunities: Opportunity[];
  
  // Design and copy analysis
  visualDesign: VisualDesignAnalysis; // Renamed from visualDesignAnalysis
  uxCopyInsights: EnhancedUXCopyAnalysis; // Renamed from uxCopyAnalysis
  
  // Behavioral insights
  behavioralInsights: EnhancedBehavioralInsight[]; // Now singular to match new structure
  
  // Accessibility analysis
  accessibilityAudit?: AccessibilityAudit;
  
  // Audience analysis
  generationalAnalysis: GenerationalAnalysis;
  
  // Vision API enhancement data
  visionData?: {
    textCount: number;
    hasLogos: boolean;
    dominantColors: VisionColorInfo[];
    hasCTAs: boolean;
    detectedText: string[];
  };
  
  // NEW: User context and inference
  userContext?: string;
  interfaceType?: string; // Inferred from context (e.g., "E-COMMERCE_CHECKOUT")
  strategicIntent?: string; // Inferred from context (e.g., "REDUCE_ABANDONMENT")
  
  // DEPRECATED - Remove these old fields
  // inferredInterfaceType?: string;
  // inferredStrategicIntent?: string;
  
  // NEW: Model tracking
  gptVersion?: string;
  modelConfig?: {
    model: string;
    version: string;
    promptHash: string;
  };
  
  // NEW: Enhanced Diagnostics
  diagnostics?: {
    totalInsights: number;
    duplicateInsightCount: number; // More specific than duplicateCount
    activeModules: string[]; // List of non-empty modules
    weakModules: string[]; // Modules with strength ≤ 2
    visionDataUsed: boolean; // Was Google Vision API used?
    userContextProvided: boolean;
    analysisComplete: boolean; // Did analysis run successfully?
  };
  
  // Metadata
  timestamp: string;
  error?: boolean;
  
  // Legacy fields for backward compatibility
  criticalIssues?: Issue[]; // Deprecated - use issuesAndFixes
  usabilityIssues?: Issue[]; // Deprecated - merged into issuesAndFixes
  visualDesignAnalysis?: VisualDesignAnalysis; // Deprecated - use visualDesign
  uxCopyAnalysis?: EnhancedUXCopyAnalysis; // Deprecated - use uxCopyInsights
  behavioralInsight?: EnhancedBehavioralInsight; // Deprecated - use behavioralInsights
}

// Grip score visualization data
export interface GripScoreVisualization {
  category: string;
  score: number;
  color: string;
  description: string;
  percentage: string;
}

export interface GripScoreData {
  overall: number;
  breakdown: GripScoreVisualization[];
}

// Update your existing feedback interface to include the new analysis
export interface FeedbackData {
  id: string;
  created_at: string;
  image_url: string;
  project_name: string;
  analysis: ZombifyAnalysis;
  chain_id: string;
  issues: string[]; // Deprecated - kept for backward compatibility
  score: number; // Deprecated - kept for backward compatibility
  user_id: string | null;
  is_guest: boolean;

  // BACKWARDS COMPATIBILITY NOTES:
  // - Old criticalIssues will map to issuesAndFixes
  // - Old visualDesignAnalysis will map to visualDesign
  // - Old uxCopyAnalysis will map to uxCopyInsights
  // - Old behavioralInsight (singular) will map to behavioralInsights (plural)
  // - Old Verdict with string[] attentionFlow will still work
  // - All existing components should continue working with compatibility layer
}