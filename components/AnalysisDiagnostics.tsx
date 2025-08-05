'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';

interface AnalysisDiagnosticsProps {
  analysis: ZombifyAnalysis;
  className?: string;
}

export default function AnalysisDiagnostics({ analysis, className = '' }: AnalysisDiagnosticsProps) {
  // Check completion of each analysis module
  const diagnostics = {
    perception: {
      label: 'Perception Layer',
      status: analysis.perceptionLayer ? 'complete' : 'missing',
      icon: '🧠'
    },
    moduleStrength: {
      label: 'Module Strength',
      status: analysis.moduleStrength ? 'complete' : 'missing',
      icon: '📊'
    },
    visionAPI: {
      label: 'Vision AI Enhancement',
      status: ((analysis.visualDesign as any)?.detectedText || (analysis.visualDesign as any)?.detectedLogos) ? 'complete' : 'missing',
      icon: '🤖'
    },
    userContext: {
      label: 'User Context',
      status: analysis.context && analysis.context !== 'LEGACY' ? 'complete' : 'missing',
      icon: '📝'
    },
    darkPatterns: {
      label: 'Dark Pattern Analysis',
      status: analysis.darkPatterns ? 'complete' : 'missing',
      icon: '⚠️'
    },
    intentAnalysis: {
      label: 'Intent Analysis',
      status: analysis.intentAnalysis ? 'complete' : 'missing',
      icon: '🎯'
    },
    behavioralInsights: {
      label: 'Behavioral Insights',
      status: analysis.behavioralInsights && analysis.behavioralInsights.length > 0 ? 'complete' : 'missing',
      icon: '🧩'
    },
    generationalAnalysis: {
      label: 'Generational Analysis',
      status: analysis.generationalAnalysis && Object.keys(analysis.generationalAnalysis.scores).length > 0 ? 'complete' : 'missing',
      icon: '👥'
    }
  };

  const completedCount = Object.values(diagnostics).filter(d => d.status === 'complete').length;
  const totalCount = Object.keys(diagnostics).length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <motion.div 
      className={`border-2 border-black bg-[#f5f1e6] p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold font-mono tracking-wider mb-2">
          ANALYSIS DIAGNOSTICS
        </h3>
        <div className="text-sm opacity-70 font-mono">
          Enhanced features detection status
        </div>
      </div>

      {/* Completion Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-mono">Analysis Completion</span>
          <span className="text-sm font-bold font-mono">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              completionPercentage === 100 ? 'bg-green-500' :
              completionPercentage >= 75 ? 'bg-yellow-500' :
              completionPercentage >= 50 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>

      {/* Module Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(diagnostics).map(([key, module], index) => (
          <motion.div
            key={key}
            className={`border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] ${
              module.status === 'complete' ? 'opacity-100' : 'opacity-60'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: module.status === 'complete' ? 1 : 0.6, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{module.icon}</span>
                <span className="text-xs font-mono font-bold">{module.label}</span>
              </div>
              <div className={`w-2 h-2 rounded-full border border-black ${
                module.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analysis Version Info */}
      <div className="mt-4 pt-4 border-t border-black/20">
        <div className="text-xs font-mono opacity-60">
          <div>Analysis Version: {analysis.perceptionLayer ? 'v2.0 Enhanced' : 'v1.0 Standard'}</div>
          <div>Timestamp: {new Date(analysis.timestamp || Date.now()).toLocaleString()}</div>
        </div>
      </div>
    </motion.div>
  );
}