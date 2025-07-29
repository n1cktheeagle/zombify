'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';

interface FeedbackDarkPatternsProps {
  analysis: ZombifyAnalysis;
  imageUrl?: string;
  className?: string;
}

export default function FeedbackDarkPatterns({ 
  analysis, 
  imageUrl,
  className = '' 
}: FeedbackDarkPatternsProps) {
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [expandedPattern, setExpandedPattern] = useState<number | null>(null);

  const darkPatterns = analysis.darkPatterns || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'LOW': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'URGENCY_MANIPULATION': return '⏰';
      case 'BAIT_AND_SWITCH': return '🎣';
      case 'HIDDEN_COSTS': return '💰';
      case 'FORCED_CONTINUITY': return '🔄';
      case 'ROACH_MOTEL': return '🪤';
      case 'CONFIRM_SHAMING': return '😔';
      default: return '⚠️';
    }
  };

  const getPatternDescription = (type: string) => {
    switch (type) {
      case 'URGENCY_MANIPULATION': return 'Creating false urgency to pressure users into quick decisions';
      case 'BAIT_AND_SWITCH': return 'Advertising one thing but delivering something different';
      case 'HIDDEN_COSTS': return 'Concealing additional fees until the final step';
      case 'FORCED_CONTINUITY': return 'Making it hard to cancel subscriptions or services';
      case 'ROACH_MOTEL': return 'Easy to get in, difficult to get out';
      case 'CONFIRM_SHAMING': return 'Making users feel bad for declining an offer';
      default: return 'Potentially manipulative design pattern detected';
    }
  };

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
              DARK PATTERN DETECTION
            </div>
            <div className="text-lg opacity-70 font-mono mb-2">
              Ethical design analysis - identifying manipulative UX patterns
            </div>
            <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
              <span>{darkPatterns.length} Patterns Detected</span>
              <span>•</span>
              <span className="text-purple-600 font-bold">UNIQUE ZOMBIFY FEATURE</span>
            </div>
          </div>
          
          {/* Side-by-side comparison toggle */}
          {imageUrl && darkPatterns.length > 0 && (
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

      {darkPatterns.length > 0 ? (
        <div className={showImageComparison ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'space-y-6'}>
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
                  Refer to this image while reviewing dark patterns
                </p>
              </div>
            </motion.div>
          )}
          
          {/* Dark Patterns List */}
          <div className="space-y-6">
            {darkPatterns.map((pattern, index) => (
              <motion.div
                key={index}
                className="border-2 border-black bg-[#f5f1e6] relative overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {/* Severity Badge */}
                <div className="absolute top-4 right-4">
                  <motion.span 
                    className={`text-xs px-3 py-1 rounded-full font-bold font-mono tracking-wider border-2 ${getSeverityColor(pattern.severity)}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {pattern.severity} RISK
                  </motion.span>
                </div>

                <div className="p-6">
                  {/* Pattern Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-purple-600 text-white text-2xl rounded-full flex items-center justify-center border-2 border-black">
                      {getPatternIcon(pattern.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-black mb-2 font-mono tracking-wider">
                        {pattern.type.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm opacity-70 mb-3 font-mono">
                        {getPatternDescription(pattern.type)}
                      </p>
                      <div className="text-base text-black leading-relaxed">
                        <strong>Detected Element:</strong> {pattern.element}
                      </div>
                    </div>
                  </div>

                  {/* Evidence Section */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔍</span>
                        <div className="text-sm font-semibold text-red-800 font-mono">
                          EVIDENCE OF MANIPULATION
                        </div>
                      </div>
                      <p className="text-sm text-red-700 leading-relaxed font-mono">
                        {pattern.evidence}
                      </p>
                    </div>
                  </motion.div>

                  {/* Impact Section */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <div className="text-sm font-semibold text-orange-800 font-mono">
                          USER TRUST IMPACT
                        </div>
                      </div>
                      <p className="text-sm text-orange-700 leading-relaxed font-mono">
                        {pattern.impact}
                      </p>
                    </div>
                  </motion.div>

                  {/* Ethical Alternative */}
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div 
                      className="bg-white border-2 border-black p-4 cursor-pointer hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all duration-200"
                      onClick={() => setExpandedPattern(expandedPattern === index ? null : index)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✨</span>
                          <div className="text-sm font-semibold text-green-800 font-mono">
                            ETHICAL ALTERNATIVE
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedPattern === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-green-600"
                        >
                          ▼
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedPattern === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-black/20">
                              <div className="text-sm text-green-700 leading-relaxed font-mono">
                                {pattern.ethicalAlternative}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* No Dark Patterns Detected */
        <motion.div
          className="text-center py-16 border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Animated background celebration */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10"
            animate={{
              x: [-1000, 1000],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear"
            }}
          />

          <div className="relative z-10">
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
              NO DARK PATTERNS DETECTED
            </div>
            
            <p className="text-lg opacity-70 font-mono mb-6 max-w-2xl mx-auto leading-relaxed">
              Excellent! Your interface follows ethical design principles and respects user autonomy. 
              This builds trust and creates sustainable user relationships.
            </p>

            {/* Ethical Design Principles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
              {[
                { icon: '🤝', title: 'USER RESPECT', desc: 'Transparent and honest design' },
                { icon: '🛡️', title: 'TRUST BUILDING', desc: 'No manipulative tactics detected' },
                { icon: '⚡', title: 'SUSTAINABLE UX', desc: 'Long-term user satisfaction focus' }
              ].map((principle, index) => (
                <motion.div
                  key={index}
                  className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="text-3xl mb-2">{principle.icon}</div>
                  <div className="font-bold text-sm mb-1 font-mono">{principle.title}</div>
                  <div className="text-xs opacity-70">{principle.desc}</div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
              💡 Your design prioritizes user trust over short-term conversion tactics
            </div>
          </div>
        </motion.div>
      )}

      {/* Educational Footer */}
      <motion.div
        className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-center">
          <div className="text-lg font-bold mb-2 font-mono tracking-wider">
            WHY DARK PATTERN DETECTION MATTERS
          </div>
          <p className="text-sm opacity-70 font-mono mb-4 max-w-3xl mx-auto leading-relaxed">
            Dark patterns may boost short-term metrics but damage long-term trust, increase churn, 
            and can lead to legal issues. Ethical design creates sustainable business growth 
            while respecting your users.
          </p>
          <div className="text-xs opacity-50 font-mono">
            This analysis is powered by Zombify&apos;s proprietary ethical design detection system
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}