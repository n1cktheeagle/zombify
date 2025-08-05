import { ZombifyAnalysis, ModuleStrength, PerceptionLayer } from '@/types/analysis';

/**
 * Normalizes analysis data to ensure compatibility between old and new formats
 * This function handles the transition from old field names to new ones
 */
export function normalizeAnalysisData(data: any): ZombifyAnalysis {
  // Handle old field names
  const normalized = {
    ...data,
    // Map old names to new
    issuesAndFixes: data.issuesAndFixes || data.criticalIssues || [],
    visualDesign: data.visualDesign || data.visualDesignAnalysis,
    uxCopyInsights: data.uxCopyInsights || data.uxCopyAnalysis,
    behavioralInsights: data.behavioralInsights || 
      (data.behavioralInsight ? [data.behavioralInsight] : []),
    
    // Ensure new required fields exist
    perceptionLayer: data.perceptionLayer || {
      primaryEmotion: { 
        type: 'confusion' as const, 
        intensity: 5 
      },
      attentionFlow: data.verdict?.attentionFlow || [],
      clarityFlags: generateDefaultClarityFlags(data)
    },
    
    moduleStrength: data.moduleStrength || generateDefaultModuleStrengths(data),
    
    diagnostics: data.diagnostics || {
      totalInsights: 0,
      duplicateInsightCount: 0,
      activeModules: [],
      weakModules: [],
      visionDataUsed: false,
      userContextProvided: false,
      analysisComplete: true
    }
  };
  
  // Remove deprecated fields
  delete normalized.criticalIssues;
  delete normalized.usabilityIssues;
  delete normalized.visualDesignAnalysis;
  delete normalized.uxCopyAnalysis;
  delete normalized.behavioralInsight;
  
  return normalized;
}

/**
 * Generates default clarity flags based on existing data
 */
function generateDefaultClarityFlags(data: any): Record<string, boolean> {
  return {
    uxCopy: Boolean(data.uxCopyInsights?.issues?.length || data.uxCopyAnalysis?.issues?.length),
    visual: Boolean(data.visualDesign?.score > 60 || data.visualDesignAnalysis?.score > 60),
    darkPattern: Boolean(data.darkPatterns?.length),
    behavioral: Boolean(data.behavioralInsights?.length || data.behavioralInsight),
    accessibility: Boolean(data.accessibilityAudit?.score > 50),
    strategicIntent: Boolean(data.intentAnalysis?.alignmentScore >= 3),
    issuesAndFixes: Boolean(data.issuesAndFixes?.length || data.criticalIssues?.length),
    opportunities: Boolean(data.opportunities?.length)
  };
}

/**
 * Generates default module strength scores based on content presence and quality
 */
function generateDefaultModuleStrengths(data: any): ModuleStrength {
  // Generate reasonable defaults based on content
  return {
    issuesAndFixes: calculateContentStrength(data.issuesAndFixes || data.criticalIssues, 2),
    uxCopyInsights: calculateContentStrength(data.uxCopyInsights?.issues || data.uxCopyAnalysis?.issues, 2),
    visualDesign: data.visualDesign?.score > 70 || data.visualDesignAnalysis?.score > 70 ? 4 : 2,
    darkPatterns: data.darkPatterns?.length > 0 ? Math.min(5, data.darkPatterns.length + 2) : 0,
    accessibility: data.accessibilityAudit?.score > 60 ? 3 : 2,
    opportunities: calculateContentStrength(data.opportunities, 2),
    frictionPoints: calculateContentStrength(data.frictionPoints, 2),
    behavioralInsights: calculateContentStrength(data.behavioralInsights || (data.behavioralInsight ? [data.behavioralInsight] : []), 2),
    generationalAnalysis: 2 // Default medium strength
  };
}

/**
 * Helper function to calculate strength based on content array
 */
function calculateContentStrength(contentArray: any[], defaultStrength: number): number {
  if (!Array.isArray(contentArray) || contentArray.length === 0) {
    return 1; // Minimum strength
  }
  
  if (contentArray.length >= 3) {
    return 4; // High strength for substantial content
  } else if (contentArray.length >= 2) {
    return 3; // Medium-high strength
  } else {
    return defaultStrength; // Use provided default
  }
}

/**
 * List of bullshit keywords that indicate generic, non-UI-grounded content
 */
const BULLSHIT_KEYWORDS = [
  'email marketing',
  'referral program',
  'leverage social',
  'growth hack',
  'nurture campaign',
  'gamify',
  'viral loop',
  'influencer',
  'affiliate',
  'newsletter',
  'lead magnet',
  'funnel optimization',
  'A/B test everything',
  'content marketing',
  'SEO strategy',
  'social media presence',
  'community building',
  'user-generated content',
  'retention loops',
  'onboarding flow', // unless specifically about visible UI
  'optimize conversion funnel',
  'improve trust without',
  'add social proof',
  'value prop confusion',
  'users don\'t understand'
];

/**
 * Checks if content contains bullshit/generic suggestions without UI grounding
 */
export function isBullshitContent(content: string): boolean {
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  
  // Check for bullshit keywords
  const hasBullshitKeyword = BULLSHIT_KEYWORDS.some(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  );
  
  // Check if content has UI grounding (mentions specific elements)
  const hasUIGrounding = /button|form|header|nav|menu|text|image|icon|link|input|dropdown|modal|banner|section|footer|sidebar|card/.test(lowerContent);
  
  // If it has bullshit keywords AND no UI grounding, it's bullshit
  return hasBullshitKeyword && !hasUIGrounding;
}

/**
 * Enhanced module visibility determination with quality checks
 */
export function shouldShowModule(
  moduleName: keyof ModuleStrength, 
  analysis: ZombifyAnalysis
): boolean {
  const strength = analysis.moduleStrength?.[moduleName] || 0;
  const clarityFlag = analysis.perceptionLayer?.clarityFlags?.[moduleName];
  
  // Module-specific rules based on ChatGPT recommendations
  switch (moduleName) {
    case 'visualDesign':
      // Show if clarity flag OR has actual insights
      const visualData = analysis.visualDesign;
      const hasVisualInsights = visualData?.tileFeedback?.length > 0 || 
                               visualData?.typography?.issues?.length > 0 ||
                               visualData?.colorAndContrast?.contrastFailures?.length > 0;
      return clarityFlag === true || hasVisualInsights || strength >= 3;
      
    case 'uxCopyInsights':
      // Show if clarity flag OR has insights
      const copyIssues = analysis.uxCopyInsights?.issues || [];
      return clarityFlag === true || copyIssues.length >= 1 || strength >= 3;
      
    case 'accessibility':
      // Similar logic - show if has insights or good strength
      const hasAccessibilityIssues = analysis.accessibilityAudit && 
                                    ('criticalFailures' in analysis.accessibilityAudit ? 
                                     analysis.accessibilityAudit.criticalFailures?.length > 0 : false);
      return clarityFlag === true || hasAccessibilityIssues || strength >= 3;
      
    case 'frictionPoints':
      // Show only if friction points are UI-grounded with specific evidence
      const frictionPoints = analysis.frictionPoints || [];
      const hasRealFriction = frictionPoints.some(fp => {
        // Check for generic phrases we want to filter out
        const hasGenericFriction = /don't understand.*value prop|improve trust|optimize.*funnel|add social proof/i.test(fp.friction || '');
        const hasGenericEvidence = /uses jargon|technical terms|improve trust/i.test(fp.evidence || '');
        
        // Must have specific evidence and not be generic
        return !isBullshitContent(fp.friction) && 
               fp.evidence && 
               fp.evidence.length > 20 && // Substantial evidence
               !hasGenericFriction && 
               !hasGenericEvidence;
      });
      return hasRealFriction;
      
    case 'opportunities':
      // STRICT: Only show if opportunities are specific and UI-grounded
      const opportunities = analysis.opportunities || [];
      const hasRealOpportunities = opportunities.some(opp => 
        !isBullshitContent(opp.opportunity) && 
        opp.location?.element && 
        opp.location?.element !== 'Where to add this'
      );
      return hasRealOpportunities;
      
    case 'behavioralInsights':
      // Show only if insights reference actual UI elements
      const insights = analysis.behavioralInsights || [];
      const hasRealInsights = insights.some(insight => 
        insight.observation && 
        !isBullshitContent(insight.observation) &&
        /button|form|cta|element|text|section/.test(insight.observation.toLowerCase())
      );
      return hasRealInsights && (strength >= 3 || clarityFlag === true);
      
    case 'darkPatterns':
      // Always show if any patterns detected
      return (analysis.darkPatterns?.length || 0) > 0;
      
    case 'issuesAndFixes':
      // Always show if issues exist
      return (analysis.issuesAndFixes?.length || 0) > 0;
      
    default:
      // Default logic for other modules
      return strength >= 3 || clarityFlag === true;
  }
}

/**
 * Gets the confidence level for a module based on its strength
 */
export function getModuleConfidence(
  moduleName: keyof ModuleStrength,
  analysis: ZombifyAnalysis
): 'high' | 'medium' | 'low' {
  const strength = analysis.moduleStrength?.[moduleName] || 0;
  if (strength >= 4) return 'high';
  if (strength >= 3) return 'medium';
  return 'low';
}

/**
 * Safe field access helper with fallbacks for common patterns
 */
export function getAnalysisField<T>(
  analysis: any,
  primaryPath: string,
  fallbackPath?: string,
  defaultValue?: T
): T {
  const getValue = (path: string) => {
    return path.split('.').reduce((obj, key) => obj?.[key], analysis);
  };

  const primaryValue = getValue(primaryPath);
  if (primaryValue !== undefined && primaryValue !== null) {
    return primaryValue;
  }

  if (fallbackPath) {
    const fallbackValue = getValue(fallbackPath);
    if (fallbackValue !== undefined && fallbackValue !== null) {
      return fallbackValue;
    }
  }

  return defaultValue as T;
}

/**
 * Helper to handle both old and new attention flow formats
 */
export function getAttentionFlow(analysis: ZombifyAnalysis) {
  // Try new structure first (perceptionLayer)
  const newFlow = analysis.perceptionLayer?.attentionFlow;
  if (newFlow && Array.isArray(newFlow) && newFlow.length > 0) {
    return newFlow;
  }

  // Fall back to verdict attention flow
  const verdictFlow = analysis.verdict?.attentionFlow;
  if (verdictFlow && Array.isArray(verdictFlow)) {
    return verdictFlow;
  }

  return [];
}

/**
 * Helper to safely access UX copy issues from either new or old structure
 */
export function getUXCopyIssues(analysis: ZombifyAnalysis) {
  return analysis.uxCopyInsights?.issues || 
         (analysis as any).uxCopyAnalysis?.issues || 
         [];
}

/**
 * Helper to safely access visual design data from either new or old structure
 */
export function getVisualDesignData(analysis: ZombifyAnalysis) {
  return analysis.visualDesign || 
         (analysis as any).visualDesignAnalysis || 
         null;
}

/**
 * Helper to safely access issues from either new or old structure
 */
export function getCriticalIssues(analysis: ZombifyAnalysis) {
  return analysis.issuesAndFixes || 
         (analysis as any).criticalIssues || 
         [];
}

/**
 * Helper to safely access behavioral insights from either new or old structure
 */
export function getBehavioralInsights(analysis: ZombifyAnalysis): any[] {
  if (analysis.behavioralInsights && Array.isArray(analysis.behavioralInsights)) {
    return analysis.behavioralInsights;
  }
  
  // Handle old singular structure
  const oldInsight = (analysis as any).behavioralInsight;
  if (oldInsight) {
    return [oldInsight];
  }
  
  return [];
}