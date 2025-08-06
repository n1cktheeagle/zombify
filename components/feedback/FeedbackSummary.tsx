'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';
import ModuleStrengthIndicator from '../ModuleStrengthIndicator';
import AnalysisDiagnostics from '../AnalysisDiagnostics';

interface FeedbackSummaryProps {
  analysis: ZombifyAnalysis;
  imageUrl?: string;
  className?: string;
}

export default function FeedbackSummary({ analysis, imageUrl, className = '' }: FeedbackSummaryProps) {
  // Get grip score from analysis
  const gripScore = analysis.gripScore?.overall ?? 0;
  const verdict = analysis.verdict;

  const [showImageModal, setShowImageModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'High Engagement';
    if (score >= 60) return 'Moderate Engagement';
    return 'Low Engagement';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <motion.div 
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero Section - Reorganized into Two Sections */}
      
      {/* Section Heading */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlitchText className="text-3xl font-bold font-mono tracking-wider" trigger="mount">
          OVERVIEW
        </GlitchText>
      </motion.div>
      
      {/* TOP SECTION: Executive Summary */}
      <div className="border-2 border-black bg-[#f5f1e6] relative overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Image Display - Left Side */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {imageUrl && (
                <>
                  <div className="text-xs font-mono text-black/60 mb-3 tracking-wider border-b border-black/20 pb-2">
                    ANALYZED INTERFACE
                  </div>
                  <motion.div 
                    className="relative overflow-hidden border-2 border-black cursor-pointer group bg-black p-2"
                    whileHover={{ 
                      boxShadow: '4px_4px_0px_0px_rgba(0,0,0,1)',
                      transform: 'translate(-2px, -2px)'
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setShowImageModal(true)}
                  >
                    <img 
                      src={imageUrl} 
                      alt="Analyzed interface" 
                      className="w-full h-auto max-h-80 object-contain border border-black/30"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/80 transition-colors duration-300 flex items-center justify-center">
                      <motion.div
                        className="bg-white text-black px-3 py-1 font-mono text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-black"
                        whileHover={{ scale: 1.05 }}
                      >
                        ENLARGE
                      </motion.div>
                    </div>
                  </motion.div>
                  <div className="text-xs font-mono text-black/40 mt-2">
                    Analysis Complete
                  </div>
                </>
              )}
            </motion.div>

            {/* Executive Summary Content - Right Side */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              
              {verdict?.summary ? (
                <motion.div 
                  className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-xs font-mono text-black/60 mb-3 border-b border-black/20 pb-1">
                    SUMMARY
                  </div>
                  
                  <div className="font-mono text-sm text-black leading-relaxed tracking-wide">
                    {verdict.summary}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 border border-black"></div>
                </motion.div>
              ) : (
                <motion.div 
                  className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-xs font-mono text-black/60 mb-3 border-b border-black/20 pb-1">
                    OVERVIEW
                  </div>
                  
                  <div className="font-mono text-sm text-black/80 leading-relaxed tracking-wide">
                    SYSTEM ANALYSIS COMPLETED FOR TARGET: {analysis.context?.toUpperCase() || 'INTERFACE'}. 
                    ENGAGEMENT METRICS CALCULATED. OPTIMIZATION VECTORS IDENTIFIED. 
                    REVIEW DIAGNOSTIC OUTPUT FOR FULL REPORT.
                  </div>
                  
                  <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 border border-black"></div>
                </motion.div>
              )}

              {/* Behavioral Metrics */}
              <div className="mt-6 border-t-2 border-black pt-4">
                <div className="text-xs font-mono text-black/60 mb-4 tracking-wider">
                  BEHAVIORAL METRICS
                </div>
                
                {verdict && (
                  <motion.div 
                    className="grid grid-cols-2 gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div 
                      className="border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-mono font-bold tracking-wider">ATTENTION_SPAN</div>
                        <div className="w-2 h-2 bg-blue-500 border border-black"></div>
                      </div>
                      <div className="text-xs font-mono text-black/80 leading-tight">
                        {verdict.attentionSpan || 'NULL_VALUE'}
                      </div>
                    </motion.div>

                    <motion.div 
                      className="border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-mono font-bold tracking-wider">LIKELY_ACTION</div>
                        <div className="w-2 h-2 bg-green-500 border border-black"></div>
                      </div>
                      <div className="text-xs font-mono text-black/80 leading-tight">
                        {verdict.likelyAction || 'NULL_VALUE'}
                      </div>
                    </motion.div>

                    <motion.div 
                      className="border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-mono font-bold tracking-wider">DROPOFF_POINT</div>
                        <div className="w-2 h-2 bg-red-500 border border-black"></div>
                      </div>
                      <div className="text-xs font-mono text-black/80 leading-tight">
                        {verdict.dropoffPoint || 'NULL_VALUE'}
                      </div>
                    </motion.div>

                    <motion.div 
                      className="border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-mono font-bold tracking-wider">MEMORY_FACTOR</div>
                        <div className="w-2 h-2 bg-purple-500 border border-black"></div>
                      </div>
                      <div className="text-xs font-mono text-black/80 leading-tight">
                        {verdict.memorable || 'NULL_VALUE'}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Parsed Context Display */}
              {((analysis as any).interfaceType || (analysis as any).strategicIntent) && (
                <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm">
                  <h4 className="text-xs font-medium text-blue-800 mb-1 font-mono tracking-wider">PARSED CONTEXT</h4>
                  {(analysis as any).interfaceType && (
                    <p className="text-blue-700 font-mono text-xs">Interface: {(analysis as any).interfaceType}</p>
                  )}
                  {(analysis as any).strategicIntent && (
                    <p className="text-blue-700 font-mono text-xs">Intent: {(analysis as any).strategicIntent}</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Grip Score + Breakdown */}
      <div className="border-2 border-black bg-[#f5f1e6] relative overflow-hidden">
        <div className="p-4">
          {/* Compact Header with Score */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2 lg:mb-0">
              <div className="text-lg font-bold opacity-70 font-mono tracking-wider">
                GRIP SCORE ANALYSIS
              </div>
              <div className="relative group">
                <button className="text-gray-400 hover:text-gray-600 text-sm">
                  ⓘ
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="font-mono text-center">
                    Grip Score reflects how effectively your interface holds user attention. 
                    Calculated from visual flow, clarity, friction, and dark pattern risk.
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
            
            {/* Compact Score Display */}
            <div className="flex items-center gap-4">
              <motion.div 
                className={`text-4xl font-bold ${getScoreColor(gripScore)} font-mono`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              >
                {gripScore}
                <span className="text-lg opacity-60">/100</span>
              </motion.div>
              
              <div className="flex flex-col">
                <div className={`text-xs font-semibold ${getScoreColor(gripScore)} font-mono`}>
                  {getScoreStatus(gripScore)}
                </div>
                <div className="text-xs opacity-60 font-mono">
                  User engagement
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Compact Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              className={`h-2 rounded-full ${getScoreColor(gripScore).replace('text-', 'bg-')}`}
              initial={{ width: 0 }}
              animate={{ width: `${gripScore}%` }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
          </div>

          {/* Category Breakdown - Full Width */}
          {analysis.gripScore?.breakdown && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-sm font-bold mb-3 opacity-70 font-mono tracking-wider">CATEGORY BREAKDOWN</div>
              
              <div className="grid grid-cols-5 gap-3">
                {[
                  { key: 'firstImpression', label: 'First Impression', icon: '👁️' },
                  { key: 'usability', label: 'Usability', icon: '🔧' },
                  { key: 'trustworthiness', label: 'Trustworthiness', icon: '🛡️' },
                  { key: 'conversion', label: 'Conversion', icon: '🎯' },
                  { key: 'accessibility', label: 'Accessibility', icon: '♿' }
                ].map((category, index) => {
                  const categoryData = analysis.gripScore.breakdown[category.key as keyof typeof analysis.gripScore.breakdown];
                  if (!categoryData) return null;

                  return (
                    <motion.div
                      key={category.key}
                      className="border-2 border-black bg-white p-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{category.icon}</span>
                          <div className="text-xs font-mono font-bold tracking-wider">{category.label}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`text-xs font-bold ${getScoreColor(categoryData.score)} font-mono`}>
                            {categoryData.score}
                          </div>
                          <div className={`w-1.5 h-1.5 border border-black ${getScoreColor(categoryData.score).replace('text-', 'bg-')}`}></div>
                        </div>
                      </div>

                      {/* Mini progress bar for each category */}
                      <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                        <motion.div
                          className={`h-1 rounded-full ${getScoreColor(categoryData.score).replace('text-', 'bg-')}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${categoryData.score}%` }}
                          transition={{ duration: 1, delay: 0.9 + index * 0.1 }}
                        />
                      </div>

                      {/* Compact content without headings */}
                      <div className="border-t border-black/20 bg-black/5 -mx-2 px-2 pt-1">
                        <div className="text-xs mb-1 opacity-80 leading-tight font-mono">{categoryData.reasoning}</div>
                        
                        {categoryData.evidence && categoryData.evidence.length > 0 && (
                          <ul className="text-xs space-y-0.5">
                            {categoryData.evidence.slice(0, 1).map((evidence, i) => (
                              <motion.li 
                                key={i} 
                                className="flex items-start gap-1 opacity-70"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 0.7, x: 0 }}
                                transition={{ delay: 1.0 + index * 0.05 + i * 0.05 }}
                              >
                                <span className="text-orange-600 font-bold leading-none mt-0.5">•</span>
                                <span className="leading-tight">{evidence}</span>
                              </motion.li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Consolidated Analysis Diagnostics - Single unified section */}
      <motion.div 
        className="border-2 border-black bg-[#f5f1e6] p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold font-mono tracking-wider mb-2">
            ANALYSIS DIAGNOSTICS
          </h3>
          <div className="text-sm opacity-70 font-mono">
            Module quality, completion status, and system information
          </div>
        </div>

        {/* Module Quality Grid */}
        {analysis.moduleStrength && (
          <div className="mb-6">
            <div className="text-sm font-bold mb-3 opacity-70 font-mono tracking-wider">MODULE QUALITY</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'issuesAndFixes', label: 'Issues & Fixes', icon: '🔧' },
                { key: 'uxCopyInsights', label: 'UX Copy', icon: '📝' },
                { key: 'visualDesign', label: 'Visual Design', icon: '🎨' },
                { key: 'darkPatterns', label: 'Dark Patterns', icon: '⚠️' },
                { key: 'behavioralInsights', label: 'Behavioral', icon: '🧠' },
                { key: 'accessibility', label: 'Accessibility', icon: '♿' }
              ].map((module, index) => {
                const strength = analysis.moduleStrength?.[module.key as keyof typeof analysis.moduleStrength];
                if (strength === undefined) return null;

                return (
                  <motion.div
                    key={module.key}
                    className="border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{module.icon}</span>
                        <span className="text-xs font-bold font-mono">{module.label}</span>
                      </div>
                    </div>
                    
                    <ModuleStrengthIndicator 
                      strength={strength} 
                      moduleName={module.label}
                      compact={true} 
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="mb-4">
          <div className="text-sm font-bold mb-3 opacity-70 font-mono tracking-wider">SYSTEM STATUS</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'User Context',
                status: analysis.context && analysis.context !== 'ERROR' ? 'complete' : 'missing',
                icon: '📝'
              },
              {
                label: 'Vision Analysis',
                status: 'complete', // Always complete now with GPT-4V
                icon: '👁️'
              },
              {
                label: 'Module Strength',
                status: analysis.moduleStrength ? 'complete' : 'missing',
                icon: '📊'
              },
              {
                label: 'Perception Layer',
                status: analysis.perceptionLayer ? 'complete' : 'missing',
                icon: '🧠'
              }
            ].map((item, index) => (
              <motion.div
                key={item.label}
                className={`border-2 border-black bg-white p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] ${
                  item.status === 'complete' ? 'opacity-100' : 'opacity-60'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: item.status === 'complete' ? 1 : 0.6, scale: 1 }}
                transition={{ delay: 1.0 + 0.1 * index }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs font-mono font-bold">{item.label}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full border border-black ${
                    item.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Analysis Version Info */}
        <div className="pt-4 border-t border-black/20">
          <div className="text-xs font-mono opacity-60">
            <div className="flex justify-between items-center">
              <span>Analysis Engine: GPT-4V Enhanced</span>
              <span>Version: v2.1.0</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Modal using Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showImageModal && imageUrl && (
            <motion.div
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageModal(false)}
              style={{ zIndex: 99999 }}
            >
              <motion.div
                className="relative max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-black text-white p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg font-mono">INTERFACE PREVIEW</h3>
                    <div className="text-sm opacity-70">Full resolution view</div>
                  </div>
                  <motion.button
                    className="text-white hover:text-red-400 text-2xl font-bold"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowImageModal(false)}
                  >
                    ×
                  </motion.button>
                </div>
                
                {/* Modal Image */}
                <div className="p-4 bg-gray-50 flex items-center justify-center">
                  <img 
                    src={imageUrl} 
                    alt="Full size interface analysis" 
                    className="max-w-full max-h-[70vh] object-contain shadow-lg"
                  />
                </div>
                
                {/* Modal Footer */}
                <div className="bg-gray-100 p-4 text-center">
                  <div className="text-sm text-gray-600 font-mono">
                    Click outside to close • Press ESC to close
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
} 