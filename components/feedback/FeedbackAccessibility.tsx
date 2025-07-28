'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';

interface FeedbackAccessibilityProps {
  analysis: ZombifyAnalysis;
  className?: string;
}

export default function FeedbackAccessibility({ 
  analysis, 
  className = '' 
}: FeedbackAccessibilityProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  const accessibilityAudit = analysis.accessibilityAudit;

  if (!accessibilityAudit) {
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
            ACCESSIBILITY ANALYSIS
          </div>
          <div className="text-lg opacity-70 font-mono">
            Visual accessibility analysis for inclusive design
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
            ♿
          </motion.div>
          <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
            ACCESSIBILITY DATA UNAVAILABLE
          </div>
          <p className="text-lg opacity-70 font-mono mb-4">
            No accessibility analysis available for this interface
          </p>
          <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
            Accessibility analysis wasn't completed for this submission
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
        <div className="text-3xl font-bold mb-3 font-mono tracking-wider">
          ACCESSIBILITY ANALYSIS
        </div>
        <div className="text-lg opacity-70 font-mono mb-2">
          Visual accessibility assessment for inclusive design
        </div>
        <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
          <span>Visual Elements Only</span>
          <span>•</span>
          <span>{accessibilityAudit.criticalFailures?.length || 0} Issues Found</span>
          <span>•</span>
          <span className="text-blue-600 font-bold">Score: {accessibilityAudit.score}/100</span>
        </div>
      </motion.div>

      {/* Accessibility Score Matrix */}
      <motion.div 
        className="border-2 border-black bg-[#f5f1e6] p-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-6">
          <div className="text-2xl font-bold mb-3 font-mono tracking-wider">
            VISUAL ACCESSIBILITY OVERVIEW
          </div>
          <div className="font-mono text-base opacity-70 mb-6">
            Analysis covers visual elements only - no alt text, keyboard navigation, or screen reader testing
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              className="text-center p-4 bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <div className="text-5xl font-bold text-black mb-2">{accessibilityAudit.score}</div>
              <div className="text-xs font-mono opacity-70 mb-1">ACCESSIBILITY SCORE</div>
              <div className={`text-sm font-bold ${
                accessibilityAudit.score >= 80 ? 'text-green-600' :
                accessibilityAudit.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {accessibilityAudit.score >= 80 ? 'EXCELLENT' :
                 accessibilityAudit.score >= 60 ? 'GOOD' : 'NEEDS WORK'}
              </div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <div className="text-5xl font-bold text-black mb-2">VISUAL</div>
              <div className="text-xs font-mono opacity-70 mb-1">ANALYSIS TYPE</div>
              <div className="text-sm font-bold text-blue-600">STATIC ASSESSMENT</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              <div className="text-5xl font-bold text-black mb-2">{accessibilityAudit.criticalFailures?.length || 0}</div>
              <div className="text-xs font-mono opacity-70 mb-1">VISUAL ISSUES</div>
              <div className={`text-sm font-bold ${
                (accessibilityAudit.criticalFailures?.length || 0) === 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(accessibilityAudit.criticalFailures?.length || 0) === 0 ? 'NONE FOUND' : 'DETECTED'}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Strengths and Weaknesses */}
      {(accessibilityAudit.strengths || accessibilityAudit.weaknesses) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strengths */}
          {accessibilityAudit.strengths && accessibilityAudit.strengths.length > 0 && (
            <motion.div 
              className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">✅</div>
                <div className="text-xl font-bold text-black font-mono tracking-wider">
                  ACCESSIBILITY STRENGTHS
                </div>
              </div>
              <div className="space-y-3">
                {accessibilityAudit.strengths.map((strength, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start gap-3 p-3 bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <div className="text-green-600 text-lg flex-shrink-0">▶</div>
                    <div className="text-sm font-mono opacity-80 leading-relaxed">{strength}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Weaknesses */}
          {accessibilityAudit.weaknesses && accessibilityAudit.weaknesses.length > 0 && (
            <motion.div 
              className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⚠️</div>
                <div className="text-xl font-bold text-black font-mono tracking-wider">
                  AREAS FOR IMPROVEMENT
                </div>
              </div>
              <div className="space-y-3">
                {accessibilityAudit.weaknesses.map((weakness, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start gap-3 p-3 bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <div className="text-red-600 text-lg flex-shrink-0">▶</div>
                    <div className="text-sm font-mono opacity-80 leading-relaxed">{weakness}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Critical Failures */}
      {accessibilityAudit.criticalFailures && accessibilityAudit.criticalFailures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">🎯</div>
            <div className="text-2xl font-bold text-red-600 font-mono tracking-wider">
              VISUAL ACCESSIBILITY ISSUES
            </div>
          </div>

          <div className="space-y-6">
            {accessibilityAudit.criticalFailures.map((failure, i) => (
              <motion.div 
                key={i} 
                className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">🚨</div>
                        <div className="font-bold text-lg text-black font-mono tracking-wider">{failure.criterion}</div>
                      </div>
                      <div className="text-black mb-2 font-mono text-sm opacity-80">{failure.issue}</div>
                      <div className="text-xs font-mono opacity-60">
                        📍 {failure.location?.selector || failure.location?.element}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white border-2 border-black p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                      <div className="text-xs text-red-600 font-bold mb-2 font-mono">CURRENT VALUE</div>
                      <div className="text-sm font-mono text-red-700 font-bold">{failure.currentValue}</div>
                    </div>
                    <div className="bg-white border-2 border-black p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                      <div className="text-xs text-green-600 font-bold mb-2 font-mono">REQUIRED VALUE</div>
                      <div className="text-sm font-mono text-green-700 font-bold">{failure.requiredValue}</div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                    <div className="text-xs text-blue-600 font-bold mb-2 font-mono">🔧 REMEDIATION STEPS</div>
                    <div className="text-sm font-mono text-blue-700 leading-relaxed">{failure.fix}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Priority Recommendations */}
      {accessibilityAudit.recommendations && accessibilityAudit.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">🎛️</div>
            <div className="text-2xl font-bold text-cyan-600 font-mono tracking-wider">
              PRIORITY RECOMMENDATIONS
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['HIGH', 'MEDIUM', 'LOW'].map((priority, priorityIndex) => {
              const priorityRecs = accessibilityAudit.recommendations!.filter(rec => rec.priority === priority);
              if (priorityRecs.length === 0) return null;

              const priorityColors = {
                HIGH: { bg: 'from-red-900/30 to-red-800/20', border: 'border-red-500/40', text: 'text-red-400', accent: 'bg-red-600' },
                MEDIUM: { bg: 'from-orange-900/30 to-orange-800/20', border: 'border-orange-500/40', text: 'text-orange-400', accent: 'bg-orange-600' },
                LOW: { bg: 'from-blue-900/30 to-blue-800/20', border: 'border-blue-500/40', text: 'text-blue-400', accent: 'bg-blue-600' }
              };

              const colors = priorityColors[priority as keyof typeof priorityColors];

              return (
                <motion.div
                  key={priority}
                  className={`border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + priorityIndex * 0.2 }}
                >
                  <div className="text-center mb-4">
                    <div className={`text-lg font-bold font-mono tracking-wider ${colors.text}`}>{priority} PRIORITY</div>
                    <div className="text-sm opacity-70">{priorityRecs.length} action{priorityRecs.length !== 1 ? 's' : ''}</div>
                  </div>

                  <div className="space-y-4">
                    {priorityRecs.map((rec, i) => (
                      <motion.div
                        key={i}
                        className="bg-white border-2 border-black p-3 cursor-pointer hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all duration-200"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        onClick={() => setExpandedRecommendation(
                          expandedRecommendation === `${priority}-${i}` ? null : `${priority}-${i}`
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-black flex-1 font-mono">{rec.action}</div>
                          <motion.div
                            animate={{ rotate: expandedRecommendation === `${priority}-${i}` ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-black/60 ml-2"
                          >
                            ▼
                          </motion.div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className={`${colors.accent} text-white px-2 py-1 font-mono`}>
                            {rec.effort} EFFORT
                          </span>
                          <span className="text-black/60 font-mono">#{i + 1}</span>
                        </div>

                        <AnimatePresence>
                          {expandedRecommendation === `${priority}-${i}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                                                          <div className="mt-3 pt-3 border-t border-black/20">
                              <div className="text-xs text-black/80 leading-relaxed font-mono">
                                Additional implementation details would be provided here for this recommendation.
                              </div>
                            </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 