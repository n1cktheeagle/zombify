'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { UXCopyAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';

interface UXCopyAnalysisCardProps {
  uxCopy: UXCopyAnalysis;
}

export default function UXCopyAnalysisCard({ uxCopy }: UXCopyAnalysisCardProps) {
  const [expandedIssues, setExpandedIssues] = useState<boolean>(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-50 border-red-200';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200';
      case 'LOW': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div 
      className="zombify-card p-6 scan-line relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <GlitchText className="text-lg font-bold mb-2" trigger="mount">
          UX COPY ANALYSIS
        </GlitchText>
        <motion.div 
          className={`text-4xl font-bold mb-2 ${getScoreColor(uxCopy.score)}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {uxCopy.score}
          <span className="text-lg opacity-60">/100</span>
        </motion.div>
        <div className="text-sm opacity-60 font-mono">Copy effectiveness & tone</div>
      </div>

      {/* Writing Tone Section */}
      <motion.div 
        className={`border rounded-lg p-4 mb-4 ${getScoreBg(uxCopy.score)}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">✍️</span>
          <div className="font-semibold text-sm">Writing Tone</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="opacity-70">Current:</span>
            <span className="font-medium">{uxCopy.writingTone.current}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="opacity-70">Recommended:</span>
            <span className="font-medium text-green-600">{uxCopy.writingTone.recommended}</span>
          </div>
          <div className="text-xs opacity-70 mt-2">
            Example: "{uxCopy.writingTone.example}"
          </div>
        </div>
      </motion.div>

      {/* Issues Section */}
      {uxCopy.issues && uxCopy.issues.length > 0 && (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div className="font-semibold text-sm">Copy Issues</div>
            </div>
            <motion.button
              onClick={() => setExpandedIssues(!expandedIssues)}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {expandedIssues ? 'Show Less' : `Show All (${uxCopy.issues.length})`}
            </motion.button>
          </div>

          <div className="space-y-2">
            {uxCopy.issues.slice(0, expandedIssues ? uxCopy.issues.length : 3).map((issue, index) => (
              <motion.div
                key={index}
                className={`border rounded-lg p-3 ${getSeverityBg(issue.severity)}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getSeverityColor(issue.severity)} bg-white/50`}>
                      {issue.severity}
                    </span>
                    <span className="text-xs opacity-70">{issue.location}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="font-medium">Issue:</span> {issue.issue}
                  </div>
                  
                  <div className="text-xs">
                    <span className="font-medium">Current:</span> "{issue.current}"
                  </div>
                  
                  {issue.suggested && issue.suggested.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-green-600">Suggested:</span>
                      <div className="mt-1 space-y-1">
                        {issue.suggested.slice(0, 2).map((suggestion, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">→</span>
                            <span>"{suggestion}"</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70">
                    <span className="font-medium">Impact:</span> {issue.impact}
                  </div>
                  
                  <div className="text-xs opacity-70">
                    <span className="font-medium">Reasoning:</span> {issue.reasoning}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!expandedIssues && uxCopy.issues.length > 3 && (
            <motion.div
              className="text-center py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-xs opacity-60">
                +{uxCopy.issues.length - 3} more issues
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* No Issues State */}
      {(!uxCopy.issues || uxCopy.issues.length === 0) && (
        <motion.div 
          className="text-center py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-4xl mb-2">✅</div>
          <div className="text-sm font-medium text-green-600">No copy issues detected</div>
          <div className="text-xs opacity-60 mt-1">Your UX copy is performing well</div>
        </motion.div>
      )}

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-400/10 to-transparent pointer-events-none"
        animate={{
          y: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "linear"
        }}
        style={{ height: '20px' }}
      />
    </motion.div>
  );
} 