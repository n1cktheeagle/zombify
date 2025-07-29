'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';

interface FeedbackIntentAnalysisProps {
  analysis: ZombifyAnalysis;
  imageUrl?: string;
  className?: string;
}

export default function FeedbackIntentAnalysis({ 
  analysis, 
  imageUrl,
  className = '' 
}: FeedbackIntentAnalysisProps) {
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [expandedMisalignment, setExpandedMisalignment] = useState<number | null>(null);

  const intentAnalysis = analysis.intentAnalysis;

  if (!intentAnalysis) {
    return (
      <motion.div 
        className={`space-y-6 ${className}`}
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
            STRATEGIC INTENT ANALYSIS
          </div>
          <div className="text-lg opacity-70 font-mono">
            Purpose alignment and clarity assessment
          </div>
        </motion.div>

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
            🎯
          </motion.div>
          <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
            INTENT ANALYSIS UNAVAILABLE
          </div>
          <p className="text-lg opacity-70 font-mono mb-4">
            Strategic intent analysis data not available for this interface
          </p>
          <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
            Intent analysis requires comprehensive interface evaluation
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const getAlignmentColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlignmentLabel = (score: number) => {
    if (score >= 80) return 'STRONG ALIGNMENT';
    if (score >= 60) return 'MODERATE ALIGNMENT';
    return 'POOR ALIGNMENT';
  };

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
          STRATEGIC INTENT ANALYSIS
        </div>
        <div className="text-lg opacity-70 font-mono mb-2">
          Purpose clarity and user perception alignment
        </div>
        <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
          <span>Purpose Alignment Analysis</span>
          <span>•</span>
          <span className={`font-bold ${getAlignmentColor(intentAnalysis.alignmentScore)}`}>
            {intentAnalysis.alignmentScore}/100 Alignment
          </span>
          <span>•</span>
          <span>{intentAnalysis.misalignments?.length || 0} Issues Found</span>
        </div>
      </motion.div>

      {/* Image Comparison Toggle */}
      {imageUrl && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setShowImageComparison(!showImageComparison)}
            className="flex items-center gap-2 text-sm font-mono border border-black/20 px-3 py-1 hover:bg-black/5 transition-colors"
          >
            <span>{showImageComparison ? '🖼️ Hide' : '🔍 Show'} Image Reference</span>
          </button>
          
          <AnimatePresence>
            {showImageComparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 border-2 border-black overflow-hidden"
              >
                <img 
                  src={imageUrl} 
                  alt="Interface for analysis" 
                  className="w-full max-h-96 object-contain bg-white"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Alignment Score Overview */}
      <motion.div 
        className="border-2 border-black bg-[#f5f1e6] p-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-6">
          <div className="text-2xl font-bold mb-3 font-mono tracking-wider">
            PURPOSE ALIGNMENT OVERVIEW
          </div>
          <div className="font-mono text-base opacity-70 mb-6">
            How well user perception matches business intent
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-white/50 rounded border border-black/10">
            <div className={`text-5xl font-bold mb-1 ${getAlignmentColor(intentAnalysis.alignmentScore)}`}>
              {intentAnalysis.alignmentScore}
            </div>
            <div className="text-xs font-mono opacity-70">ALIGNMENT SCORE</div>
            <div className={`text-xs font-bold font-mono mt-1 ${getAlignmentColor(intentAnalysis.alignmentScore)}`}>
              {getAlignmentLabel(intentAnalysis.alignmentScore)}
            </div>
          </div>
          <div className="text-center p-4 bg-white/50 rounded border border-black/10">
            <div className="text-3xl font-bold text-black mb-1">
              {intentAnalysis.misalignments?.length || 0}
            </div>
            <div className="text-xs font-mono opacity-70">MISALIGNMENTS</div>
          </div>
          <div className="text-center p-4 bg-white/50 rounded border border-black/10">
            <div className="text-3xl font-bold text-black mb-1">
              {intentAnalysis.clarityImprovements?.length || 0}
            </div>
            <div className="text-xs font-mono opacity-70">IMPROVEMENTS</div>
          </div>
        </div>
      </motion.div>

      {/* Purpose Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perceived Purpose */}
        <motion.div 
          className="border-2 border-black bg-blue-50 p-6 relative overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">👁️</div>
            <GlitchText className="text-lg font-bold text-black" trigger="hover">
              USER PERCEPTION
            </GlitchText>
          </div>
          <div className="text-sm font-mono text-black/80 bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
            {intentAnalysis.perceivedPurpose}
          </div>
          <div className="text-xs font-mono opacity-60 mt-2">
            What users think this interface is for based on visual cues
          </div>
        </motion.div>
        
        {/* Actual Purpose */}
        <motion.div 
          className="border-2 border-black bg-green-50 p-6 relative overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🎯</div>
            <GlitchText className="text-lg font-bold text-black" trigger="hover">
              BUSINESS INTENT
            </GlitchText>
          </div>
          <div className="text-sm font-mono text-black/80 bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
            {intentAnalysis.actualPurpose}
          </div>
          <div className="text-xs font-mono opacity-60 mt-2">
            Likely business intention based on interface structure
          </div>
        </motion.div>
      </div>

      {/* Misalignments */}
      {intentAnalysis.misalignments && intentAnalysis.misalignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">⚠️</div>
            <GlitchText className="text-2xl font-bold text-red-600" trigger="mount">
              PURPOSE MISALIGNMENTS
            </GlitchText>
          </div>

          {intentAnalysis.misalignments.map((misalignment, index) => (
            <motion.div 
              key={index} 
              className="border-2 border-red-500/40 bg-red-50 p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xl">🚨</div>
                <div className="font-bold text-lg text-red-800 font-mono">
                  ALIGNMENT ISSUE #{index + 1}
                </div>
              </div>
              <div className="text-sm font-mono text-red-700 bg-white border-2 border-red-200 p-4 shadow-[1px_1px_0px_0px_rgba(239,68,68,0.4)]">
                {misalignment}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Clarity Improvements */}
      {intentAnalysis.clarityImprovements && intentAnalysis.clarityImprovements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">💡</div>
            <GlitchText className="text-2xl font-bold text-cyan-600" trigger="mount">
              CLARITY IMPROVEMENTS
            </GlitchText>
          </div>

          {intentAnalysis.clarityImprovements.map((improvement, index) => (
            <motion.div 
              key={index} 
              className="border-2 border-cyan-500/40 bg-cyan-50 p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xl">✨</div>
                <div className="font-bold text-lg text-cyan-800 font-mono">
                  IMPROVEMENT #{index + 1}
                </div>
              </div>
              <div className="text-sm font-mono text-cyan-700 bg-white border-2 border-cyan-200 p-4 shadow-[1px_1px_0px_0px_rgba(6,182,212,0.4)]">
                {improvement}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Strategic Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="border-2 border-black bg-[#f5f1e6] p-6 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🎯</div>
          <GlitchText className="text-xl font-bold text-black" trigger="mount">
            STRATEGIC RECOMMENDATION
          </GlitchText>
        </div>

        <div className="text-sm font-mono text-black/80 bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
          {intentAnalysis.alignmentScore >= 80 ? (
            <div>
              <strong>Strong Intent Alignment:</strong> Users clearly understand the interface purpose, creating minimal confusion in the user journey. Focus on maintaining this clarity while optimizing for conversion.
            </div>
          ) : intentAnalysis.alignmentScore >= 60 ? (
            <div>
              <strong>Moderate Intent Alignment:</strong> Some users may experience confusion about the interface purpose. Address the identified misalignments to improve user comprehension and reduce friction.
            </div>
          ) : (
            <div>
              <strong>Poor Intent Alignment:</strong> Critical disconnect between user perception and business intent. This confusion likely causes significant user dropoff. Prioritize clarity improvements immediately.
            </div>
          )}
        </div>

        <div className="mt-4 text-xs font-mono opacity-60">
          Intent alignment directly impacts user engagement, task completion rates, and overall conversion success.
        </div>
      </motion.div>
    </motion.div>
  );
}