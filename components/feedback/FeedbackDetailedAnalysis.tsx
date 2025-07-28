'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';
import VisualDesignAnalysisCard from '../VisualDesignAnalysisCard';
import UXCopyAnalysisCard from '../UXCopyAnalysisCard';
import GenerationalRadarChart from '../GenerationalRadarChart';

interface FeedbackDetailedAnalysisProps {
  analysis: ZombifyAnalysis;
  className?: string;
}

export default function FeedbackDetailedAnalysis({ 
  analysis, 
  className = '' 
}: FeedbackDetailedAnalysisProps) {
  const hasVisualAnalysis = analysis.visualDesignAnalysis;
  const hasUXCopyAnalysis = analysis.uxCopyAnalysis;
  const hasGenerationalAnalysis = analysis.generationalAnalysis;

  return (
    <motion.div 
      className={`space-y-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-3xl font-bold mb-3 font-mono tracking-wider">
          DETAILED ANALYSIS
        </div>
        <div className="text-lg opacity-70 font-mono mb-2">
          Deep dive into visual design, copy effectiveness, and audience alignment
        </div>
        <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
          {hasVisualAnalysis && <span>Visual Design</span>}
          {hasVisualAnalysis && hasUXCopyAnalysis && <span>•</span>}
          {hasUXCopyAnalysis && <span>UX Copy</span>}
          {(hasVisualAnalysis || hasUXCopyAnalysis) && hasGenerationalAnalysis && <span>•</span>}
          {hasGenerationalAnalysis && <span>Generational Appeal</span>}
        </div>
      </motion.div>

      {/* Analysis Grid */}
      <div className="space-y-8">
        {/* Visual Design & UX Copy Row */}
        {(hasVisualAnalysis || hasUXCopyAnalysis) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Design Analysis */}
            {hasVisualAnalysis && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <VisualDesignAnalysisCard visualDesign={analysis.visualDesignAnalysis} />
              </motion.div>
            )}

            {/* UX Copy Analysis */}
            {hasUXCopyAnalysis && (
              <motion.div
                initial={{ opacity: 0, x: hasVisualAnalysis ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: hasVisualAnalysis ? 0.3 : 0.2 }}
              >
                <UXCopyAnalysisCard uxCopy={analysis.uxCopyAnalysis} />
              </motion.div>
            )}
          </div>
        )}

        {/* Generational Analysis - Compact */}
        {hasGenerationalAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
          >
            <GenerationalRadarChart
              scores={{
                genAlpha: analysis.generationalAnalysis.scores.genAlpha || { score: 0, reasoning: 'No data available' },
                genZ: analysis.generationalAnalysis.scores.genZ || { score: 0, reasoning: 'No data available' },
                millennials: analysis.generationalAnalysis.scores.millennials || { score: 0, reasoning: 'No data available' },
                genX: analysis.generationalAnalysis.scores.genX || { score: 0, reasoning: 'No data available' },
                boomers: analysis.generationalAnalysis.scores.boomers || { score: 0, reasoning: 'No data available' }
              }}
              primaryTarget={analysis.generationalAnalysis.primaryTarget || 'millennials'}
            />

            {/* Compact Recommendations */}
            {analysis.generationalAnalysis.recommendations && analysis.generationalAnalysis.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-4 pt-4 border-t border-black/20"
              >
                <h4 className="text-sm font-bold mb-2 font-mono tracking-wider">
                  OPTIMIZATION TIPS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.generationalAnalysis.recommendations.slice(0, 4).map((rec, index) => (
                    <motion.div
                      key={index}
                      className="bg-white border-2 border-black p-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                    >
                      <div className="text-xs font-mono opacity-80 leading-tight">{rec}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* No Analysis Available State */}
        {!hasVisualAnalysis && !hasUXCopyAnalysis && !hasGenerationalAnalysis && (
          <motion.div
            className="text-center py-16 border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="text-8xl mb-6"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: "easeInOut"
              }}
            >
              📊
            </motion.div>
            <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
              DETAILED ANALYSIS UNAVAILABLE
            </div>
            <p className="text-lg opacity-70 font-mono mb-4">
              No detailed analysis data available for this interface
            </p>
            <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
              This may be a legacy analysis or the detailed analysis wasn't completed
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 