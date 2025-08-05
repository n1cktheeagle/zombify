'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import { getCriticalIssues, shouldShowModule } from '@/utils/analysisCompatibility';
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

  // Use compatibility layer to get issues from new or old structure
  const issues = getCriticalIssues(analysis);
  const usabilityIssues = (analysis as any).usabilityIssues || [];
  const totalIssues = issues.length + usabilityIssues.length;
  
  // Check if module should be shown based on strength
  const showModule = shouldShowModule('issuesAndFixes', analysis);
  const isWeak = !showModule && issues.length === 0;
  
  if (isWeak) {
    return (
      <motion.div 
        className={`space-y-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-75">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <span>🔧</span>
            <h3 className="font-medium text-xl font-mono tracking-wider">ISSUES & FIXES</h3>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
              Low Confidence
            </span>
          </div>
          <p className="text-sm text-gray-400 font-mono">
            Not enough signal to identify specific issues. Interface appears to have minimal friction points.
          </p>
        </div>
      </motion.div>
    );
  }

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
          <div className="text-3xl font-bold mb-3 font-mono tracking-wider">
            ISSUES & FIXES
          </div>
          <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
            <span>{issues.length} Issues & Fixes</span>
            {usabilityIssues.length > 0 && (
              <>
                <span>•</span>
                <span>{usabilityIssues.length} Usability Issues</span>
              </>
            )}
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
            <div className="border-2 border-black bg-[#f5f1e6] p-4">
              <h3 className="text-lg font-bold mb-4 font-mono tracking-wider">
                REFERENCE IMAGE
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
          {/* Issues & Fixes Section */}
          {issues.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <motion.div
                    key={`issue-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <IssueCard
                      issue={issue}
                      index={index}
                      type={issue.severity >= 3 ? "critical" : "usability"}
                      isPro={isPro}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Legacy Usability Issues Section (for backward compatibility) */}
          {usabilityIssues.length > 0 && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="space-y-4">
                {usabilityIssues.slice(0, isLoggedIn ? undefined : 2).map((issue: any, index: number) => (
                  <motion.div
                    key={`usability-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <IssueCard
                      issue={issue}
                      index={index + issues.length}
                      type="usability"
                      isPro={isPro}
                    />
                  </motion.div>
                ))}
                
                {!isLoggedIn && usabilityIssues.length > 2 && (
                  <motion.div
                    className="text-center py-8 border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="text-4xl mb-4">🔒</div>
                    <div className="font-mono text-sm opacity-70 mb-3">
                      + {usabilityIssues.length - 2} more issues detected
                    </div>
                    <div className="text-lg font-bold mb-4 font-mono tracking-wider">
                      UNLOCK ALL ISSUES
                    </div>
                    <button className="zombify-primary-button px-6 py-3 text-sm font-bold tracking-wider">
                      SIGN UP TO VIEW ALL
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* No Issues State */}
          {issues.length === 0 && usabilityIssues.length === 0 && (
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
              ✨
            </motion.div>
            <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
              NO ISSUES DETECTED
            </div>
            <p className="text-lg opacity-70 font-mono mb-4">
              Your design follows excellent UX practices
            </p>
            <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
              This interface appears to be well-optimized for user experience
            </div>
          </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 