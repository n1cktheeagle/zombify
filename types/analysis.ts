// types/analysis.ts - Clean version with Vision API support, NO visual annotations
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

// === ANALYSIS TYPES ===

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

// Clean Verdict interface
export interface Verdict {
  summary: string;
  attentionSpan: string;
  likelyAction: string;
  dropoffPoint: string;
  memorable: string;
  attentionFlow: string[]; // Simple string array of what matters and why
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

// Behavioral insight
export interface BehavioralInsight {
  pattern: string;
  observation: string;
  psychology: string;
  recommendation: string;
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

// UX Copy Analysis
export interface UXCopyIssue {
  severity: "HIGH" | "MEDIUM" | "LOW";
  current: string;
  location: string;
  issue: string;
  suggested: string[];
  impact: string;
  reasoning: string;
}

export interface UXCopyAnalysis {
  score: number;
  issues: UXCopyIssue[];
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

// Clean accessibility audit
export interface AccessibilityAudit {
  score: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  strengths: string[];
  weaknesses: string[];
  criticalFailures: AccessibilityFailure[];
  keyboardNav: string;
  screenReaderCompat: string;
  mobileAccessibility: string;
  recommendations: Array<{
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

// MAIN ANALYSIS INTERFACE - Clean with Vision API enhancement data only
export interface ZombifyAnalysis {
  context: 'COMPONENT' | 'FULL_INTERFACE' | 'WIREFRAME' | 'DATA_VIZ' | 'MARKETING' | 'MOBILE' | 'ERROR';
  industry: 'SAAS' | 'ECOMMERCE' | 'FINTECH' | 'HEALTHCARE' | 'EDUCATION' | 'SOCIAL' | 'ENTERPRISE' | 'UNKNOWN';
  industryConfidence: number;
  gripScore: GripScore;
  verdict: Verdict;
  visualDesignAnalysis: VisualDesignAnalysis;
  uxCopyAnalysis: UXCopyAnalysis;
  criticalIssues: Issue[];
  usabilityIssues: Issue[];
  opportunities: Opportunity[];
  behavioralInsights: BehavioralInsight[];
  accessibilityAudit: AccessibilityAudit | null;
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
}