'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';

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
      {/* Terminal-style Header */}
      <motion.div 
        className="font-mono text-sm bg-black text-green-400 p-4 rounded border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="animate-pulse">●</span>
          <span>UX ANALYSIS COMPLETE</span>
        </div>
        <div className="text-xs opacity-60">
          {analysis.context} • {analysis.industry} • Confidence: {Math.round((analysis.industryConfidence ?? 0.85) * 100)}%
        </div>
      </motion.div>

      {/* Hero Section - Reorganized into Two Sections */}
      
      {/* TOP SECTION: Image + Executive Summary */}
      <div className="zombify-card p-8 relative overflow-hidden">
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
                <div className="text-sm font-mono opacity-60 mb-3 text-center">ANALYZED INTERFACE</div>
                <motion.div 
                  className="relative overflow-hidden rounded border-2 border-black/20 cursor-pointer group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setShowImageModal(true)}
                >
                  <img 
                    src={imageUrl} 
                    alt="Analyzed interface" 
                    className="w-full h-auto max-h-80 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <motion.div
                      className="bg-black/80 text-white px-3 py-2 rounded text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      Click to Enlarge 🔍
                    </motion.div>
                  </div>
                </motion.div>
                <div className="text-xs opacity-60 mt-2 font-mono text-center">
                  Click image to view full size
                </div>
              </>
            )}
          </motion.div>

          {/* Executive Summary - Right Side */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlitchText className="text-2xl font-bold mb-4" trigger="mount">
              EXECUTIVE SUMMARY
            </GlitchText>
            
            {verdict?.summary ? (
              <motion.div 
                className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-lg font-medium text-black leading-relaxed">
                  {verdict.summary}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-lg font-medium text-gray-600 leading-relaxed">
                  Comprehensive UX analysis completed for your {analysis.context?.toLowerCase() || 'interface'}. 
                  Review the detailed findings below to understand user engagement potential and optimization opportunities.
                </div>
              </motion.div>
            )}

            {/* Quick behavioral insights */}
            {verdict && (
              <motion.div 
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="p-3 bg-white/50 rounded border border-black/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm">⏱️</div>
                    <div className="text-xs font-mono opacity-70">ATTENTION</div>
                  </div>
                  <div className="text-xs font-medium">{verdict.attentionSpan || 'Not analyzed'}</div>
                </div>

                <div className="p-3 bg-white/50 rounded border border-black/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm">🎬</div>
                    <div className="text-xs font-mono opacity-70">ACTION</div>
                  </div>
                  <div className="text-xs font-medium">{verdict.likelyAction || 'Not analyzed'}</div>
                </div>

                <div className="p-3 bg-white/50 rounded border border-black/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm">📉</div>
                    <div className="text-xs font-mono opacity-70">DROP-OFF</div>
                  </div>
                  <div className="text-xs font-medium">{verdict.dropoffPoint || 'Not analyzed'}</div>
                </div>

                <div className="p-3 bg-white/50 rounded border border-black/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm">💭</div>
                    <div className="text-xs font-mono opacity-70">MEMORY</div>
                  </div>
                  <div className="text-xs font-medium">{verdict.memorable || 'Not analyzed'}</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM SECTION: Grip Score + Breakdown */}
      <div className="zombify-card p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Grip Score Display - Left Side */}
          <motion.div 
            className="lg:col-span-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlitchText className="text-lg font-bold mb-4 opacity-70" trigger="mount">
              GRIP SCORE ANALYSIS
            </GlitchText>
            
            {/* Main Score Display */}
            <div className="mb-4">
              <motion.div 
                className={`text-8xl font-bold mb-4 ${getScoreColor(gripScore)}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              >
                {gripScore}
                <span className="text-3xl opacity-60">/100</span>
              </motion.div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <motion.div
                  className={`h-4 rounded-full ${getScoreColor(gripScore).replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${gripScore}%` }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                />
              </div>
              
              <div className={`text-base font-semibold mb-4 ${getScoreColor(gripScore)}`}>
                {getScoreStatus(gripScore)}
              </div>
              
              <div className="text-sm opacity-60">
                Your interface's ability to capture and maintain user attention
              </div>
            </div>
          </motion.div>

          {/* Category Breakdown - Right Side */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            {analysis.gripScore?.breakdown && (
              <>
                <div className="text-lg font-bold mb-4 opacity-70">CATEGORY BREAKDOWN</div>
                
                <div className="space-y-3">
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
                        className="border border-black/10 rounded-lg bg-white/30"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        {/* Header - no longer clickable */}
                        <div className="p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{category.icon}</span>
                              <div className="text-xs font-medium">{category.label}</div>
                            </div>
                            <div className={`text-sm font-bold ${getScoreColor(categoryData.score)}`}>
                              {categoryData.score}
                            </div>
                          </div>

                          {/* Mini progress bar for each category */}
                          <div className="w-full bg-gray-200 rounded-full h-1 mb-3">
                            <motion.div
                              className={`h-1 rounded-full ${getScoreColor(categoryData.score).replace('text-', 'bg-')}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${categoryData.score}%` }}
                              transition={{ duration: 1, delay: 0.9 + index * 0.1 }}
                            />
                          </div>

                          {/* Always visible content */}
                          <div className="border-t border-black/10 bg-white/20 -mx-3 px-3 pt-2">
                            <div className="text-xs font-semibold mb-1 opacity-80">Analysis:</div>
                            <div className="text-xs mb-2 opacity-70 leading-relaxed">{categoryData.reasoning}</div>
                            
                            {categoryData.evidence && categoryData.evidence.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold mb-1 opacity-80">Evidence:</div>
                                <ul className="text-xs space-y-1">
                                  {categoryData.evidence.slice(0, 3).map((evidence, i) => (
                                    <li 
                                      key={i} 
                                      className="flex items-start gap-1 opacity-70"
                                    >
                                      <span className="text-blue-600 mt-0.5">•</span>
                                      <span className="leading-relaxed">{evidence}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Attention Flow Section - Clean Timeline */}
      {verdict?.attentionFlow && verdict.attentionFlow.length > 0 && (
        <motion.div 
          className="zombify-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="text-center mb-8">
            <GlitchText className="text-xl font-bold mb-2" trigger="hover">
              USER ATTENTION FLOW
            </GlitchText>
            <div className="text-sm opacity-60 font-mono">The sequence users' eyes follow when scanning your interface</div>
          </div>

          {/* Timeline Flow */}
          <div className="relative max-w-3xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-500 opacity-30"></div>
            
            <div className="space-y-6">
              {verdict.attentionFlow.map((step, index) => (
                <motion.div 
                  key={index}
                  className="relative flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.15 }}
                >
                  {/* Number Circle */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-lg font-bold rounded-full flex items-center justify-center shadow-lg z-10">
                    {index + 1}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 mt-2">
                    <div className="text-base text-gray-800 leading-relaxed font-medium">
                      {step}
                    </div>
                  </div>

                  {/* Connecting Arrow for flow */}
                  {index < verdict.attentionFlow.length - 1 && (
                    <motion.div 
                      className="absolute left-11 top-14 text-cyan-500 opacity-60"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ delay: 1.2 + index * 0.15 }}
                    >
                      ↓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="text-xs font-mono opacity-60 bg-cyan-50 p-3 rounded-lg inline-block">
              💡 This sequence represents the natural scanning pattern for your interface layout
            </div>
          </div>
        </motion.div>
      )}

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