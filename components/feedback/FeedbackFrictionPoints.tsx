'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import { getModuleConfidence } from '@/utils/analysisCompatibility';
import GlitchText from '../GlitchText';

interface FeedbackFrictionPointsProps {
  analysis: ZombifyAnalysis;
  imageUrl?: string;
  className?: string;
}

export default function FeedbackFrictionPoints({ 
  analysis, 
  imageUrl,
  className = '' 
}: FeedbackFrictionPointsProps) {
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [expandedFriction, setExpandedFriction] = useState<number | null>(null);

  const frictionPoints = analysis.frictionPoints || [];
  const confidence = getModuleConfidence('frictionPoints', analysis);
  
  const getQualityBadge = () => {
    const strength = analysis.moduleStrength?.frictionPoints || 0;
    const clarityFlag = analysis.perceptionLayer?.clarityFlags?.frictionPoints;
    
    if (strength >= 4 && clarityFlag) return { icon: '🟢', label: 'High Quality', color: 'bg-green-100 text-green-700' };
    if (strength >= 3 || clarityFlag) return { icon: '🟡', label: 'Good Signal', color: 'bg-yellow-100 text-yellow-700' };
    return { icon: '🔴', label: 'Low Signal', color: 'bg-red-100 text-red-700' };
  };
  
  const qualityBadge = getQualityBadge();

  // Group friction points by user journey stage
  const frictionByStage = {
    AWARENESS: frictionPoints.filter(fp => fp.stage === 'AWARENESS'),
    CONSIDERATION: frictionPoints.filter(fp => fp.stage === 'CONSIDERATION'),
    DECISION: frictionPoints.filter(fp => fp.stage === 'DECISION'),
    ACTION: frictionPoints.filter(fp => fp.stage === 'ACTION')
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'AWARENESS': return '👁️';
      case 'CONSIDERATION': return '🤔';
      case 'DECISION': return '⚖️';
      case 'ACTION': return '🎯';
      default: return '📍';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'AWARENESS': return 'from-blue-900/30 to-blue-800/20 border-blue-500/40';
      case 'CONSIDERATION': return 'from-purple-900/30 to-purple-800/20 border-purple-500/40';
      case 'DECISION': return 'from-orange-900/30 to-orange-800/20 border-orange-500/40';
      case 'ACTION': return 'from-red-900/30 to-red-800/20 border-red-500/40';
      default: return 'from-gray-900/30 to-gray-800/20 border-gray-500/40';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'LOW': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (frictionPoints.length === 0) {
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
            FRICTION POINTS
          </div>
          <div className="text-lg opacity-70 font-mono">
            UI obstacles preventing smooth user flow
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
            🛤️
          </motion.div>
          <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
            SMOOTH INTERFACE DETECTED
          </div>
          <p className="text-lg opacity-70 font-mono mb-4">
            No significant UI friction points identified
          </p>
          <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
            This interface appears to have a relatively smooth user experience
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold font-mono tracking-wider">
            FRICTION POINTS
          </div>
          <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${qualityBadge.color}`}>
            {qualityBadge.icon} {qualityBadge.label}
          </span>
        </div>
        <div className="text-lg opacity-70 font-mono mb-2">
          UI obstacles preventing smooth user flow
        </div>
        <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
          <span>Journey Stage Analysis</span>
          <span>•</span>
          <span>{frictionPoints.length} Friction Points</span>
          <span>•</span>
          <span className="text-red-600 font-bold">
            {frictionPoints.filter(fp => fp.dropoffRisk === 'HIGH').length} High Risk
          </span>
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

      {/* User Journey Stages */}
      <div className="space-y-8">
        {Object.entries(frictionByStage).map(([stage, stageFrictions], stageIndex) => {
          if (stageFrictions.length === 0) return null;

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + stageIndex * 0.1 }}
              className={`bg-gradient-to-br ${getStageColor(stage)} border-2 rounded-lg p-6 relative overflow-hidden`}
            >
              {/* Stage Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">{getStageIcon(stage)}</div>
                <div>
                  <div className="text-xl font-bold font-mono text-black">
                    {stage} STAGE
                  </div>
                  <div className="text-sm opacity-70 font-mono">
                    {stageFrictions.length} friction point{stageFrictions.length !== 1 ? 's' : ''} identified
                  </div>
                </div>
              </div>

              {/* Friction Points */}
              <div className="space-y-4">
                {stageFrictions.map((friction, frictionIndex) => (
                  <motion.div
                    key={frictionIndex}
                    className="bg-white/90 border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative overflow-hidden"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + frictionIndex * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-bold text-black font-mono">
                            {friction.friction}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded border font-mono font-bold ${getRiskColor(friction.dropoffRisk)}`}>
                            {friction.dropoffRisk} RISK
                          </span>
                        </div>
                        <div className="text-sm text-black/80 font-mono mb-2">
                          <strong>Evidence:</strong> {friction.evidence}
                        </div>
                      </div>
                    </div>

                    {/* Quick Fix */}
                    <div className="bg-green-50 border border-green-200 p-4 rounded mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚡</span>
                        <div className="text-sm font-bold text-green-800 font-mono">
                          QUICK FIX
                        </div>
                      </div>
                      <div className="text-sm text-green-700 font-mono">
                        {friction.quickFix}
                      </div>
                    </div>

                    {/* Expected Impact */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📈</span>
                        <div className="text-sm font-bold text-blue-800 font-mono">
                          EXPECTED IMPACT
                        </div>
                      </div>
                      <div className="text-sm text-blue-700 font-mono">
                        {friction.impact}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="border-2 border-black bg-[#f5f1e6] p-6 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🎯</div>
          <GlitchText className="text-xl font-bold text-black" trigger="mount">
            CONVERSION OPTIMIZATION SUMMARY
          </GlitchText>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-white/50 rounded border border-black/10">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {frictionPoints.filter(fp => fp.dropoffRisk === 'HIGH').length}
            </div>
            <div className="text-xs font-mono opacity-70">HIGH RISK BARRIERS</div>
          </div>
          <div className="text-center p-4 bg-white/50 rounded border border-black/10">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {frictionPoints.filter(fp => fp.dropoffRisk === 'MEDIUM').length}
            </div>
            <div className="text-xs font-mono opacity-70">MEDIUM RISK BARRIERS</div>
          </div>
          <div className="text-center p-4 bg-white/50 rounded border border-black/10">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {frictionPoints.filter(fp => fp.dropoffRisk === 'LOW').length}
            </div>
            <div className="text-xs font-mono opacity-70">LOW RISK BARRIERS</div>
          </div>
        </div>

        <div className="text-sm font-mono text-black/80 bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
          <strong>Priority Recommendation:</strong> Focus on eliminating HIGH RISK friction points first, as these have the greatest impact on user dropoff rates. Quick fixes for these barriers can deliver immediate conversion improvements.
        </div>
      </motion.div>
    </motion.div>
  );
}