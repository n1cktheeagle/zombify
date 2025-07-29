// types/analysis.ts - Enhanced version with all new features
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

// === NEW ENHANCED TYPES ===

// Dark Pattern Detection
export interface DarkPattern {
  type: 'URGENCY_MANIPULATION' | 'BAIT_AND_SWITCH' | 'HIDDEN_COSTS' | 'FORCED_CONTINUITY' | 'ROACH_MOTEL' | 'CONFIRM_SHAMING';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  element: string;
  evidence: string;
  impact: string;
  ethicalAlternative: string;
}

// Strategic Intent Analysis
export interface IntentAnalysis {
  perceivedPurpose: string;
  actualPurpose: string;
  alignmentScore: number;
  misalignments: string[];
  clarityImprovements: string[];
}

// Enhanced Attention Flow
export interface AttentionFlowItem {
  priority: number;
  element: string;
  reasoning: string;
  timeSpent: string;
  conversionImpact: 'HIGH' | 'MEDIUM' | 'LOW';
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

// Unified Accessibility Audit - FIXED TYPE CONFLICTS
export interface AccessibilityColorIssue {
  element: string;
  contrastRatio: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  passes: boolean;
  fix: string;
}

export interface AccessibilityTextSize {
  smallTextCount: number;
  minimumSize: string;
  recommendation: string;
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
  accessibility: GripScoreBreakdownItem;
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
    h1ToH2Ratio: number;
    consistencyScore: number;
    recommendation: string;
  };
  readability: {
    fleschScore: number;
    avgLineLength: number;
    recommendation: string;
  };
  // ENHANCED: Add Vision API small text detection
  smallTextWarnings?: {
    count: number;
    message: string;
  } | null;
}

export interface ContrastFailure {
  foreground: string;
  background: string;
  ratio: number;
  location: string;
  fix: {
    suggestion: string;
    css: string;
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
  gridSystem: string;
  consistency: number;
  issues: SpacingIssue[];
}

export interface ModernPatternsAnalysis {
  detected: string[];
  implementation: Record<string, any>;
  trendAlignment: {
    "2025Relevance": number;
    suggestions: string[];
  };
}

export interface VisualHierarchyAnalysis {
  scanPattern: string;
  focalPoints: Array<{
    element: string;
    weight: number;
  }>;
  improvements: Array<{
    issue: string;
    fix: string;
  }>;
}

export interface VisualDesignAnalysis {
  score: number;
  typography: TypographyAnalysis;
  colorAndContrast: ColorAnalysis;
  spacing: SpacingAnalysis;
  modernPatterns: ModernPatternsAnalysis;
  visualHierarchy: VisualHierarchyAnalysis;
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

// Clean accessibility failure without visual coordinates
export interface AccessibilityFailure {
  criterion: string;
  issue: string;
  location: {
    element: string;
    selector: string;
  };
  currentValue: string;
  requiredValue: string;
  fix: string;
}

// UNIFIED ACCESSIBILITY AUDIT - FIXED TO HANDLE BOTH AUTOMATED AND MANUAL
export interface AccessibilityAudit {
  automated?: boolean; // Flag to indicate if it's automated
  score: number;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  
  // Automated analysis properties
  colorContrast?: {
    issues: AccessibilityColorIssue[];
  };
  textSize?: AccessibilityTextSize;
  overallRecommendation?: string;
  
  // Manual analysis properties  
  strengths?: string[];
  weaknesses?: string[];
  criticalFailures?: AccessibilityFailure[];
  keyboardNav?: string;
  screenReaderCompat?: string;
  mobileAccessibility?: string;
  recommendations?: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW";
    action: string;
    effort: "LOW" | "MEDIUM" | "HIGH";
  }>;
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

// MAIN ENHANCED ANALYSIS INTERFACE
export interface ZombifyAnalysis {
  context: 'COMPONENT' | 'FULL_INTERFACE' | 'WIREFRAME' | 'DATA_VIZ' | 'MARKETING' | 'MOBILE' | 'ERROR';
  industry: 'SAAS' | 'ECOMMERCE' | 'FINTECH' | 'HEALTHCARE' | 'EDUCATION' | 'SOCIAL' | 'ENTERPRISE' | 'UNKNOWN';
  industryConfidence: number;
  gripScore: GripScore;
  verdict: Verdict;
  
  // NEW ENHANCED SECTIONS
  darkPatterns: DarkPattern[];
  intentAnalysis: IntentAnalysis;
  frictionPoints: FrictionPoint[];
  
  visualDesignAnalysis: VisualDesignAnalysis;
  uxCopyAnalysis: EnhancedUXCopyAnalysis; // Enhanced version
  criticalIssues: Issue[];
  usabilityIssues: Issue[];
  opportunities: Opportunity[];
  behavioralInsights: EnhancedBehavioralInsight[]; // Enhanced version
  accessibilityAudit: AccessibilityAudit | null; // UNIFIED TYPE - FIXED
  generationalAnalysis: GenerationalAnalysis;
  
  // KEEP: Vision API data for enhanced analysis
  visionData?: {
    textCount: number;
    hasLogos: boolean;
    dominantColors: VisionColorInfo[];
    hasCTAs: boolean;
    detectedText: string[];
  };
  timestamp: string;
  error?: boolean;
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
  // - Old BehavioralInsight[] will still work, just won't have emotionalImpact
  // - Old UXCopyAnalysis will still work, just won't have audienceAlignment etc.
  // - Old Verdict with string[] attentionFlow will still work
  // - All existing components should continue working
}