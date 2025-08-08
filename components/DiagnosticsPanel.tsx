'use client';

import React, { useState } from 'react';
import { ZombifyAnalysis } from '@/types/analysis';
import { shouldShowModule, isBullshitContent } from '@/utils/analysisCompatibility';

interface DiagnosticsPanelProps {
  analysis: ZombifyAnalysis;
  className?: string;
}

export default function DiagnosticsPanel({ analysis, className = '' }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  
  // Calculate which modules are hidden and why
  const moduleVisibility = {
    visualDesign: shouldShowModule('visualDesign', analysis),
    uxCopyInsights: shouldShowModule('uxCopyInsights', analysis),
    opportunities: shouldShowModule('opportunities', analysis),
    behavioralInsights: shouldShowModule('behavioralInsights', analysis),
    frictionPoints: shouldShowModule('frictionPoints', analysis),
    darkPatterns: shouldShowModule('darkPatterns', analysis),
    issuesAndFixes: shouldShowModule('issuesAndFixes', analysis),
  };
  
  const hiddenModules = Object.entries(moduleVisibility)
    .filter(([_, shown]) => !shown)
    .map(([module, _]) => module);
  
  // Check for bullshit content in opportunities
  const bullshitOpportunities = (analysis.opportunities || []).filter(opp => 
    isBullshitContent(opp.opportunity)
  );
  
  // Get detailed reasons for why modules are hidden
  const getHiddenReason = (moduleName: string): string => {
    const strength = analysis.moduleStrength?.[moduleName as keyof typeof analysis.moduleStrength] || 0;
    const clarityFlag = analysis.perceptionLayer?.clarityFlags?.[moduleName as keyof typeof analysis.perceptionLayer.clarityFlags];
    
    switch (moduleName) {
      case 'opportunities':
        return 'No UI-grounded suggestions found';
      case 'behavioralInsights':
        return 'Insights not specific to visible UI elements';
      case 'visualDesign':
        return `Low strength (${strength}/5) and no clear visual insights`;
      case 'uxCopyInsights':
        return `No copy issues detected (strength: ${strength}/5)`;
      case 'frictionPoints':
        return 'No specific UI friction identified';
      default:
        return `Low quality signal (strength: ${strength}/5, clarity: ${clarityFlag ? 'true' : 'false'})`;
    }
  };
  
  // Calculate diagnostics
  const diagnostics = {
    duplicateInsightCount: 0, // This would come from deduplication process
    visionDataUsed: !!(analysis.visualDesign as any)?.detectedText || !!(analysis.visualDesign as any)?.detectedLogos,
    activeModules: Object.entries(analysis.moduleStrength || {})
      .filter(([_, strength]) => strength >= 3)
      .map(([module, _]) => module),
    weakModules: Object.entries(analysis.moduleStrength || {})
      .filter(([_, strength]) => strength < 3)
      .map(([module, _]) => module),
    gptVersion: (analysis as any).gptVersion || (analysis as any).modelConfig?.version || process.env.NEXT_PUBLIC_OPENAI_VISION_MODEL_VERSION || 'gpt-5-vision',
    analysisComplete: !!(analysis.perceptionLayer && analysis.gripScore),
    perceptionLayerActive: !!analysis.perceptionLayer,
    moduleStrengthCalculated: !!analysis.moduleStrength,
    userContextProvided: analysis.context && analysis.context !== 'ERROR',
    hiddenModules,
    bullshitContentDetected: bullshitOpportunities.length > 0
  };
  
  return (
    <details 
      className={`mt-8 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-mono ${className}`}
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 transition-colors">
        <span className="inline-flex items-center gap-2">
          <span className="text-xs">🔍</span>
          Analysis Quality 
          {!isOpen && <span className="text-gray-400">→</span>}
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-2">
            {diagnostics.activeModules.length} strong modules
          </span>
          {diagnostics.hiddenModules.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              {diagnostics.hiddenModules.length} low-quality hidden
            </span>
          )}
        </span>
      </summary>
      
      {/* Simplified primary diagnostics */}
      <div className="mt-4 space-y-3">
        {/* Quality Summary */}
        <div className="p-3 bg-white border border-gray-200 rounded">
          <div className="text-xs font-medium text-gray-700 mb-2">Analysis Quality Summary</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold">{diagnostics.activeModules.length}</div>
              <div className="text-gray-500">Strong Modules</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{diagnostics.weakModules.length}</div>
              <div className="text-gray-500">Weak Modules</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{diagnostics.hiddenModules.length}</div>
              <div className="text-gray-500">Hidden</div>
            </div>
          </div>
        </div>
        
        {/* Key Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
            <span className="text-gray-600">User Context:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.visionDataUsed 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {diagnostics.userContextProvided ? '✅ Provided' : '⚫ None'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
            <span className="text-gray-600">Analysis Complete:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.analysisComplete 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {diagnostics.analysisComplete ? '✅ Yes' : '⚠️ Partial'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Advanced diagnostics - hidden by default */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-xs">
          <div className="text-gray-600 font-medium mb-2">Advanced Diagnostics</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
              <span className="text-gray-500">Perception Layer:</span>
              <span className={`font-mono px-2 py-1 rounded ${
                diagnostics.perceptionLayerActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {diagnostics.perceptionLayerActive ? '✅ Active' : '❌ Missing'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
              <span className="text-gray-500">Duplicate Insights:</span>
              <span className="font-mono">
                {diagnostics.duplicateInsightCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
              <span className="text-gray-500">Bullshit Content:</span>
              <span className={`font-mono px-2 py-1 rounded ${
                diagnostics.bullshitContentDetected 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {diagnostics.bullshitContentDetected ? '⚠️ Detected' : '✅ Clean'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded">
              <span className="text-gray-500">GPT Version:</span>
              <span className="font-mono text-xs">
                {diagnostics.gptVersion}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Toggle for advanced view */}
      {!showAdvanced && (
        <button
          onClick={() => setShowAdvanced(true)}
          className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-mono"
        >
          Show advanced diagnostics →
        </button>
      )}
      {showAdvanced && (
        <button
          onClick={() => setShowAdvanced(false)}
          className="mt-3 text-xs text-gray-600 hover:text-gray-700 font-mono"
        >
          Hide advanced diagnostics ↑
        </button>
      )}
      
      {/* Hidden modules section */}

      {/* Hidden Modules Details */}
      {diagnostics.hiddenModules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-gray-700 font-medium mb-2">
            Hidden Modules ({diagnostics.hiddenModules.length}):
          </div>
          <div className="space-y-1">
            {diagnostics.hiddenModules.map(module => (
              <div key={module} className="text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">×</span>
                  <div className="flex-1">
                    <span className="text-gray-600 font-medium capitalize">{module.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="text-gray-400">{getHiddenReason(module)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showAllModules && (
            <div className="mt-2 text-xs text-blue-600">
              ℹ️ Toggle enabled - hidden modules will show with quality warnings
            </div>
          )}
        </div>
      )}
      
      {/* Detailed Module Breakdown */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="text-xs text-gray-500 mb-2">Module Strength Detail:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(analysis.moduleStrength || {}).map(([module, strength]) => (
              <div 
                key={module}
                className={`flex justify-between items-center p-2 rounded border ${
                  strength >= 4 ? 'bg-green-50 border-green-200' :
                  strength >= 3 ? 'bg-blue-50 border-blue-200' :
                  strength >= 2 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <span className="capitalize text-xs">{module}</span>
                <span className="font-mono font-bold">{strength}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      
      {/* Power User Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllModules}
            onChange={(e) => setShowAllModules(e.target.checked)}
            className="w-3 h-3"
          />
          <span>Show all modules (including low-confidence)</span>
        </label>
        {showAllModules && (
          <div className="text-xs text-blue-600 mt-2">
            ℹ️ Low-confidence modules will display with quality warnings
          </div>
        )}
      </div>
    </details>
  );
}