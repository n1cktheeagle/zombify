'use client';

import React, { useState } from 'react';
import { ZombifyAnalysis } from '@/types/analysis';

interface DiagnosticsPanelProps {
  analysis: ZombifyAnalysis;
  className?: string;
}

export default function DiagnosticsPanel({ analysis, className = '' }: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
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
    gptVersion: 'gpt-4o-2025-08-04', // This would come from analysis metadata
    analysisComplete: !!(analysis.perceptionLayer && analysis.gripScore),
    perceptionLayerActive: !!analysis.perceptionLayer,
    moduleStrengthCalculated: !!analysis.moduleStrength,
    userContextProvided: analysis.context && analysis.context !== 'LEGACY'
  };
  
  return (
    <details 
      className={`mt-8 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-mono ${className}`}
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 transition-colors">
        <span className="inline-flex items-center gap-2">
          <span className="text-xs">🔧</span>
          System Diagnostics 
          {!isOpen && <span className="text-gray-400">→</span>}
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-2">
            {diagnostics.activeModules.length}/{Object.keys(analysis.moduleStrength || {}).length} modules
          </span>
        </span>
      </summary>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Duplicate Insights:</span>
            <span className="font-mono bg-white px-2 py-1 rounded border">
              {diagnostics.duplicateInsightCount}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Vision Data:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.visionDataUsed 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {diagnostics.visionDataUsed ? '✅ Enhanced' : '❌ Basic'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">User Context:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.userContextProvided 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {diagnostics.userContextProvided ? '✅ Provided' : '❌ None'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Perception Layer:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.perceptionLayerActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {diagnostics.perceptionLayerActive ? '✅ Active' : '❌ Missing'}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Active Modules:</span>
            <span className="font-mono bg-white px-2 py-1 rounded border">
              {diagnostics.activeModules.length}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Weak Modules:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.weakModules.length > 0 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {diagnostics.weakModules.length > 0 ? diagnostics.weakModules.length : 'None'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">GPT Version:</span>
            <span className="font-mono bg-white px-2 py-1 rounded border text-xs">
              {diagnostics.gptVersion}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Analysis Complete:</span>
            <span className={`font-mono px-2 py-1 rounded ${
              diagnostics.analysisComplete 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {diagnostics.analysisComplete ? '✅ Complete' : '⚠️ Partial'}
            </span>
          </div>
        </div>
      </div>
      
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
      
      {/* Weak modules list */}
      {diagnostics.weakModules.length > 0 && isOpen && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-xs text-yellow-800 font-medium mb-1">
            Weak Modules ({diagnostics.weakModules.length}):
          </div>
          <div className="text-xs text-yellow-700">
            {diagnostics.weakModules.join(', ')} - Limited analysis confidence
          </div>
        </div>
      )}
    </details>
  );
}