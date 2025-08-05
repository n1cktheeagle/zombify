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
 * Determines if a module should be displayed based on strength and clarity
 */
export function shouldShowModule(
  moduleName: keyof ModuleStrength, 
  analysis: ZombifyAnalysis
): boolean {
  const strength = analysis.moduleStrength?.[moduleName] || 0;
  const clarityFlag = analysis.perceptionLayer?.clarityFlags?.[moduleName];
  
  // Show if strength is good OR has clear signal
  return strength >= 3 || clarityFlag === true;
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