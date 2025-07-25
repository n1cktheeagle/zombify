'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';
import IssueCard from '../IssueCard';

interface FeedbackCriticalIssuesProps {
  analysis: ZombifyAnalysis;
  imageUrl?: string;
  isLoggedIn?: boolean;
  isPro?: boolean;
  className?: string;
}

export default function FeedbackCriticalIssues({ 
  analysis, 
  imageUrl, 
  isLoggedIn = false, 
  isPro = false,
  className = '' 
}: FeedbackCriticalIssuesProps) {
  const [showImageComparison, setShowImageComparison] = useState(false);

  const totalIssues = analysis.criticalIssues.length + analysis.usabilityIssues.length;

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
        <div className="flex justify-between items-start">
          <div>
            <h2>
              <GlitchText className="text-3xl font-bold mb-3" trigger="mount">
                ISSUES & FIXES
              </GlitchText>
            </h2>
            <div className="text-lg opacity-70 font-mono mb-2">
              Issues requiring immediate attention and areas for improvement
            </div>
            <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
              <span>{analysis.criticalIssues.length} Critical Issues</span>
              <span>•</span>
              <span>{analysis.usabilityIssues.length} Usability Issues</span>
              <span>•</span>
              <span className="text-red-600 font-bold">{totalIssues} Total</span>
            </div>
          </div>
          
          {/* Side-by-side comparison toggle */}
          {imageUrl && (
            <motion.button
              className="bg-black text-white px-4 py-2 rounded font-mono text-sm hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImageComparison(!showImageComparison)}
            >
              {showImageComparison ? 'Hide' : 'Show'} Image Reference
            </motion.button>
          )}
        </div>
      </motion.div>
      
      {/* Side-by-side layout when enabled */}
      <div className={showImageComparison ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}>
        {/* Image reference panel */}
        {showImageComparison && imageUrl && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-4 h-fit"
          >
            <div className="zombify-card p-6">
              <h3 className="text-lg font-bold mb-4">
                <GlitchText trigger="hover">REFERENCE IMAGE</GlitchText>
              </h3>
              <img 
                src={imageUrl} 
                alt="Reference" 
                className="w-full rounded-lg border-2 border-black/20 shadow-lg"
              />
              <p className="text-xs opacity-60 mt-3 font-mono text-center">
                Refer to this image while reviewing issues
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Issues list */}
        <div className="space-y-8">
          {/* Critical Issues Section */}
          {analysis.criticalIssues.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="border-l-4 border-red-500 pl-6 mb-6">
                <h3 className="text-2xl font-bold text-red-700 mb-2">
                  <GlitchText trigger="hover">CRITICAL ISSUES</GlitchText>
                </h3>
                <p className="text-sm text-red-600 mb-2 font-mono">
                  These issues need immediate attention and may prevent users from completing tasks
                </p>
                <div className="text-xs opacity-70 font-mono">
                  {analysis.criticalIssues.length} issue{analysis.criticalIssues.length !== 1 ? 's' : ''} detected
                </div>
              </div>
              
              <div className="space-y-4">
                {analysis.criticalIssues.map((issue, index) => (
                  <motion.div
                    key={`critical-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <IssueCard
                      issue={issue}
                      index={index}
                      type="critical"
                      isPro={isPro}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Usability Issues Section */}
          {analysis.usabilityIssues.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="border-l-4 border-orange-500 pl-6 mb-6">
                <h3 className="text-2xl font-bold text-orange-700 mb-2">
                  <GlitchText trigger="hover">USABILITY ISSUES</GlitchText>
                </h3>
                <p className="text-sm text-orange-600 mb-2 font-mono">
                  Areas for improvement to enhance user experience and satisfaction
                </p>
                <div className="text-xs opacity-70 font-mono">
                  {analysis.usabilityIssues.length} improvement{analysis.usabilityIssues.length !== 1 ? 's' : ''} identified
                </div>
              </div>
              
              <div className="space-y-4">
                {analysis.usabilityIssues.slice(0, isLoggedIn ? undefined : 2).map((issue, index) => (
                  <motion.div
                    key={`usability-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <IssueCard
                      issue={issue}
                      index={index + analysis.criticalIssues.length}
                      type="usability"
                      isPro={isPro}
                    />
                  </motion.div>
                ))}
                
                {!isLoggedIn && analysis.usabilityIssues.length > 2 && (
                  <motion.div
                    className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="text-4xl mb-4">🔒</div>
                    <div className="font-mono text-sm opacity-70 mb-3">
                      + {analysis.usabilityIssues.length - 2} more issues detected
                    </div>
                    <GlitchText className="text-lg font-bold mb-4" trigger="hover">
                      UNLOCK ALL ISSUES
                    </GlitchText>
                    <button className="zombify-primary-button px-6 py-3 text-sm font-bold tracking-wider">
                      SIGN UP TO VIEW ALL
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* No Issues State */}
          {analysis.criticalIssues.length === 0 && analysis.usabilityIssues.length === 0 && (
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
                ✨
              </motion.div>
              <GlitchText className="text-3xl font-bold mb-4" trigger="mount">
                NO CRITICAL ISSUES DETECTED
              </GlitchText>
              <p className="text-lg opacity-70 font-mono mb-4">
                Your design follows excellent UX practices
              </p>
              <div className="text-sm opacity-60 font-mono bg-green-50 p-4 rounded-lg inline-block">
                This interface appears to be well-optimized for user experience
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 