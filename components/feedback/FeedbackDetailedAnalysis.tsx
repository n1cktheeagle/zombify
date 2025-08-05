'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import { getModuleConfidence } from '@/utils/analysisCompatibility';
import GlitchText from '../GlitchText';
import VisualDesignAnalysisCard from '../VisualDesignAnalysisCard';

interface FeedbackDetailedAnalysisProps {
  analysis: ZombifyAnalysis;
  className?: string;
}

export default function FeedbackDetailedAnalysis({ 
  analysis, 
  className = '' 
}: FeedbackDetailedAnalysisProps) {
  const hasVisualAnalysis = analysis.visualDesignAnalysis;
  const confidence = getModuleConfidence('visualDesign', analysis);

  return (
    <motion.div 
      className={`space-y-8 transition-all duration-200 ${
        confidence === 'low' ? 'opacity-50 bg-gray-50' : ''
      } ${className}`}
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
          DESIGN ANALYSIS
        </div>
        <div className="text-lg opacity-70 font-mono mb-2">
          Visual design patterns, typography, color theory, and modern design trends
        </div>
        <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
          <span>Visual Design Patterns</span>
          <span>•</span>
          <span>Typography & Color Analysis</span>
          <span>•</span>
          <span>Modern Design Trends</span>
        </div>
      </motion.div>

      {/* Analysis Grid */}
      <div className="space-y-8">
        {/* Visual Design Analysis */}
        {hasVisualAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <VisualDesignAnalysisCard visualDesign={analysis.visualDesignAnalysis} />
          </motion.div>
        )}


        {/* No Analysis Available State */}
        {!hasVisualAnalysis && (
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
              🎨
            </motion.div>
            <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
              DESIGN ANALYSIS UNAVAILABLE
            </div>
            <p className="text-lg opacity-70 font-mono mb-4">
              No visual design analysis data available for this interface
            </p>
            <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
              This may be a legacy analysis or the design analysis wasn&apos;t completed
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 