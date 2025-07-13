// types/analysis.ts
// Place this file in your project root: /types/analysis.ts

// Location information for issues
export interface Location {
    element: string;
    coordinates?: { x: number; y: number };
    percentage?: { x: string; y: string };
    region: string;
    selector?: string;
    elements?: string[];
  }
  
  // Fix information with implementation details
  export interface Fix {
    immediate: string;
    better?: string;
    implementation?: string;
    cssTokens?: string;
  }
  
  // Issue structure
  export interface Issue {
    severity: number; // 0-4
    category: string;
    issue: string;
    location?: Location;
    impact: string;
    evidence?: string;
    fix: Fix;
  }
  
  // Generational score with reasoning
  export interface GenerationalScore {
    score: number;
    reasoning: string;
  }
  
  // Grip score breakdown
  export interface GripScoreBreakdown {
    firstImpression: number;
    usability: number;
    trustworthiness: number;
    conversion: number;
    accessibility: number;
  }
  
  // Main grip score
  export interface GripScore {
    overall: number;
    breakdown: GripScoreBreakdown;
  }
  
  // Growth opportunity
  export interface Opportunity {
    category: string;
    opportunity: string;
    potentialImpact: string;
    implementation: string;
    reasoning: string;
  }
  
  // Behavioral insight
  export interface BehavioralInsight {
    pattern: string;
    observation: string;
    psychology: string;
    recommendation: string;
  }
  
  // Accessibility failure
  export interface AccessibilityFailure {
    criterion: string;
    issue: string;
    location: Partial<Location>;
    fix: string;
  }
  
  // Accessibility audit results
  export interface AccessibilityAudit {
    score: number;
    wcagLevel: 'A' | 'AA' | 'AAA';
    criticalFailures: AccessibilityFailure[];
    keyboardNav: string;
    screenReaderCompat: string;
    recommendations: string[];
  }
  
  // Competitive analysis
  export interface CompetitiveAnalysis {
    strengths: string[];
    weaknesses: string[];
    benchmarks: {
      industryAvgConversion: string;
      topPerformerConversion: string;
      yourEstimatedConversion: string;
    };
  }
  
  // Implementation phase
  export interface ImplementationPhase {
    duration: string;
    tasks: string[];
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }
  
  // Implementation roadmap
  export interface ImplementationRoadmap {
    phase1: ImplementationPhase;
    phase2: ImplementationPhase;
    phase3?: ImplementationPhase;
  }
  
  // Generational analysis
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
  
  // Technical audit
  export interface TechnicalAudit {
    performanceIssues: string[];
    codeQuality: string[];
    seoConsiderations: string[];
  }
  
  // Main analysis result from OpenAI
  export interface ZombifyAnalysis {
    context: 'COMPONENT' | 'FULL_INTERFACE' | 'WIREFRAME' | 'DATA_VIZ' | 'MARKETING' | 'MOBILE' | 'ERROR';
    industry: 'SAAS' | 'ECOMMERCE' | 'FINTECH' | 'HEALTHCARE' | 'EDUCATION' | 'SOCIAL' | 'ENTERPRISE' | 'UNKNOWN';
    industryConfidence: number;
    gripScore: GripScore;
    criticalIssues: Issue[];
    usabilityIssues: Issue[];
    opportunities: Opportunity[];
    behavioralInsights: BehavioralInsight[];
    accessibilityAudit: AccessibilityAudit | null;
    competitiveAnalysis: CompetitiveAnalysis | null;
    implementationRoadmap: ImplementationRoadmap | null;
    generationalAnalysis: GenerationalAnalysis;
    technicalAudit: TechnicalAudit | null;
    timestamp: string;
    error?: boolean;
  }
  
  // Visual annotation for overlay
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
    analysis: ZombifyAnalysis; // Changed from 'any' to our typed analysis
    chain_id: string;
    issues: string[]; // This might be deprecated with the new structure
    score: number; // This might be deprecated in favor of gripScore.overall
    user_id: string | null;
    is_guest: boolean;
  }