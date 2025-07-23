// types/analysis.ts - Enhanced for v2.1.0 with Verdict + Vision API
// Place this file in your project root: /types/analysis.ts

// === VISION API TYPES ===
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

// === EXISTING TYPES (keeping everything you had) ===

// Simplified Location interface
export interface Location {
  element: string;     // Plain language description
  region: string;      // General area description
  visualContext?: string;  // What's around it
  boundingBox?: {      // NEW: Real coordinates from Vision API
    x: number;
    y: number;
    width: number;
    height: number;
  };
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

// Issue structure - ENHANCED with more specific data
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

// NEW: Enhanced Verdict interface with Vision data
export interface Verdict {
  summary: string;
  attentionSpan: string;
  likelyAction: string;
  dropoffPoint: string;
  memorable: string;
  attentionFlow: string[];
  heatmapData?: {      // NEW: Real heatmap coordinates
    hotspots: Array<{
      x: number;
      y: number;
      intensity: number;
      element: string;
      description: string;
    }>;
    coldspots: Array<{
      x: number;
      y: number;
      element: string;
      reason: string;
    }>;
  };
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

// ENHANCED: Accessibility failure with visual coordinates
export interface AccessibilityFailure {
  criterion: string;
  issue: string;
  location: {
    element: string;
    selector: string;
    boundingBox: { x: number; y: number; width: number; height: number };
  };
  currentValue: string;
  requiredValue: string;
  fix: string;
  visualContext: "AREA_HIGHLIGHT";
}

// ENHANCED: Accessibility audit with strengths and weaknesses
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

// ENHANCED: Generational analysis with specific issues
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

// MAIN ANALYSIS INTERFACE - Enhanced for v2.1.0 with Verdict + Vision API
export interface ZombifyAnalysis {
  context: 'COMPONENT' | 'FULL_INTERFACE' | 'WIREFRAME' | 'DATA_VIZ' | 'MARKETING' | 'MOBILE' | 'ERROR';
  industry: 'SAAS' | 'ECOMMERCE' | 'FINTECH' | 'HEALTHCARE' | 'EDUCATION' | 'SOCIAL' | 'ENTERPRISE' | 'UNKNOWN';
  industryConfidence: number;
  gripScore: GripScore;
  verdict: Verdict; // Enhanced with heatmap data
  visualDesignAnalysis: VisualDesignAnalysis;
  uxCopyAnalysis: UXCopyAnalysis;
  criticalIssues: Issue[];
  usabilityIssues: Issue[];
  opportunities: Opportunity[];
  behavioralInsights: BehavioralInsight[];
  accessibilityAudit: AccessibilityAudit | null;
  generationalAnalysis: GenerationalAnalysis;
  visionData?: VisionAnalysisResult; // NEW: Raw Vision API results
  timestamp: string;
  error?: boolean;
}

// Visual annotation for overlay (for future visual highlighting)
export interface VisualAnnotation {
  id: string;
  type: 'critical' | 'warning' | 'info';
  position: { x: string; y: string };
  coordinates?: { x: number; y: number };
  label: string;
  category: string;
  severity: number;
  description: string;
  fix: Fix;
  selector?: string;
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