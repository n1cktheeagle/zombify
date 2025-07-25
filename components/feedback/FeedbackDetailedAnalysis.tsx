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
        <h2>
          <GlitchText className="text-3xl font-bold mb-3" trigger="mount">
            DETAILED ANALYSIS
          </GlitchText>
        </h2>
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

        {/* Generational Analysis - Full Width */}
        {hasGenerationalAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="zombify-card p-8 relative overflow-hidden"
          >
            <div className="text-center mb-8">
              <GlitchText className="text-2xl font-bold mb-3" trigger="hover">
                GENERATIONAL APPEAL ANALYSIS
              </GlitchText>
              <div className="text-base opacity-70 font-mono mb-4">
                How well your interface resonates with different age demographics
              </div>
              
              {/* Primary Target Badge */}
              {analysis.generationalAnalysis.primaryTarget && (
                <motion.div
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-mono text-sm font-bold tracking-wider shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  PRIMARY TARGET: {analysis.generationalAnalysis.primaryTarget.toUpperCase()}
                </motion.div>
              )}
            </div>

            {/* Radar Chart */}
            <div className="flex justify-center mb-8">
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
            </div>

            {/* Recommendations */}
            {analysis.generationalAnalysis.recommendations && analysis.generationalAnalysis.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
              >
                <h4 className="text-lg font-bold mb-4 text-center">
                  <GlitchText trigger="hover">GENERATIONAL OPTIMIZATION TIPS</GlitchText>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.generationalAnalysis.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/50 border border-black/10 p-4 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                    >
                      <div className="text-sm font-mono opacity-80">{rec}</div>
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
            className="text-center py-16 zombify-card relative overflow-hidden"
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
            <GlitchText className="text-3xl font-bold mb-4" trigger="mount">
              DETAILED ANALYSIS UNAVAILABLE
            </GlitchText>
            <p className="text-lg opacity-70 font-mono mb-4">
              No detailed analysis data available for this interface
            </p>
            <div className="text-sm opacity-60 font-mono bg-gray-50 p-4 rounded-lg inline-block">
              This may be a legacy analysis or the detailed analysis wasn't completed
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 