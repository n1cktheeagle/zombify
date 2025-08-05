'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import { getModuleConfidence } from '@/utils/analysisCompatibility';
import GlitchText from '../GlitchText';

interface FeedbackInsightsProps {
  analysis: ZombifyAnalysis;
  isPro?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export default function FeedbackInsights({ 
  analysis, 
  isPro = false,
  onUpgrade,
  className = '' 
}: FeedbackInsightsProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const insights = analysis.behavioralInsights || [];
  const confidence = getModuleConfidence('behavioralInsights', analysis);
  
  const getQualityBadge = () => {
    const strength = analysis.moduleStrength?.behavioralInsights || 0;
    const clarityFlag = analysis.perceptionLayer?.clarityFlags?.behavioralInsights;
    
    if (strength >= 4 && clarityFlag) return { icon: '🟢', label: 'High Quality', color: 'bg-green-100 text-green-700' };
    if (strength >= 3 || clarityFlag) return { icon: '🟡', label: 'Good Signal', color: 'bg-yellow-100 text-yellow-700' };
    return { icon: '🔴', label: 'Low Signal', color: 'bg-red-100 text-red-700' };
  };
  
  const qualityBadge = getQualityBadge();

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
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold font-mono tracking-wider">
            BEHAVIORAL INSIGHTS
          </div>
          <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${qualityBadge.color}`}>
            {qualityBadge.icon} {qualityBadge.label}
          </span>
        </div>
        <div className="text-lg opacity-70 font-mono mb-2">
          User behavior patterns, psychological triggers, and decision-making insights
        </div>
        {isPro && (
          <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
            <span>{insights.length} Insights</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">PRO ANALYSIS</span>
          </div>
        )}
      </motion.div>

      {isPro ? (
        <div className="space-y-6">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <motion.div
                key={index}
                className="border-2 border-black bg-[#f5f1e6] relative overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {/* Low Confidence Label */}
                {confidence === 'low' && (
                  <span className="absolute top-2 right-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
                    Low Confidence
                  </span>
                )}
                <div className="p-6">
                  {/* Pattern Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-black mb-2 font-mono tracking-wider">
                        {insight.pattern}
                      </h4>
                      <p className="text-base opacity-80 leading-relaxed mb-4">{insight.observation}</p>
                    </div>
                  </div>

                  {/* Emotional Impact Section */}
                  {insight.emotionalImpact && (
                    <motion.div
                      className="mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.1 }}
                    >
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 p-4 shadow-[1px_1px_0px_0px_rgba(249,115,22,0.4)]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {insight.emotionalImpact.primaryEmotion === 'trust' && '🤝'}
                              {insight.emotionalImpact.primaryEmotion === 'anxiety' && '😰'}
                              {insight.emotionalImpact.primaryEmotion === 'excitement' && '🚀'}
                              {insight.emotionalImpact.primaryEmotion === 'confusion' && '🤔'}
                              {insight.emotionalImpact.primaryEmotion === 'frustration' && '😤'}
                              {insight.emotionalImpact.primaryEmotion === 'delight' && '😍'}
                              {insight.emotionalImpact.primaryEmotion === 'anticipation' && '⏳'}
                              {insight.emotionalImpact.primaryEmotion === 'skepticism' && '🤨'}
                            </span>
                            <div className="text-sm font-semibold text-orange-800 font-mono">
                              EMOTIONAL IMPACT: {insight.emotionalImpact.primaryEmotion.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-800 font-mono">
                              {insight.emotionalImpact.intensity}/10
                            </div>
                            <div className="text-xs text-orange-600 font-mono">INTENSITY</div>
                          </div>
                        </div>
                        
                        {/* Intensity Bar */}
                        <div className="mb-3">
                          <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                              style={{ width: `${(insight.emotionalImpact.intensity / 10) * 100}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(insight.emotionalImpact.intensity / 10) * 100}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                            />
                          </div>
                        </div>

                        <p className="text-sm text-orange-700 leading-relaxed">
                          <strong>Reasoning:</strong> {insight.emotionalImpact.reasoning}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Psychology Section */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🧠</span>
                        <div className="text-sm font-semibold text-purple-800 font-mono">
                          PSYCHOLOGICAL FACTOR
                        </div>
                      </div>
                      <p className="text-sm text-purple-700 italic leading-relaxed">
                        {insight.psychology}
                      </p>
                    </div>
                  </motion.div>

                  {/* Recommendation Section */}
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div 
                      className="bg-white border-2 border-black p-4 cursor-pointer hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all duration-200"
                      onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          <div className="text-sm font-semibold text-blue-800 font-mono">
                            OPTIMIZATION RECOMMENDATION
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedInsight === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-blue-600"
                        >
                          ▼
                        </motion.div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedInsight === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-black/20">
                              <div className="text-sm text-black leading-relaxed font-mono">
                                {insight.recommendation}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))
          ) : (
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
                🧠
              </motion.div>
              <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
                NO BEHAVIORAL PATTERNS DETECTED
              </div>
              <p className="text-lg opacity-70 font-mono mb-4">
                No significant behavioral insights identified in this analysis
              </p>
              <div className="text-sm opacity-60 font-mono bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] inline-block">
                This may indicate straightforward user flows or insufficient complexity for pattern detection
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        /* Pro Upgrade CTA */
        <motion.div
          className="text-center py-16 border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
            animate={{
              x: [-1000, 1000],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear"
            }}
          />

          <div className="relative z-10">
            <motion.div 
              className="text-8xl mb-6"
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotateY: { repeat: Infinity, duration: 4, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
            >
              🧠
            </motion.div>
            
            <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
              DECODE USER PSYCHOLOGY
            </div>
            
            <p className="text-lg mb-6 max-w-2xl mx-auto opacity-70 leading-relaxed">
              Understand the psychological triggers, cognitive biases, and behavioral patterns 
              that influence how users interact with your interface.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
              {[
                { icon: '🎯', title: 'User Motivations', desc: 'Understand what drives decisions' },
                { icon: '🔮', title: 'Behavioral Patterns', desc: 'Predict user actions' },
                { icon: '⚡', title: 'Trigger Analysis', desc: 'Optimize psychological hooks' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="text-3xl mb-2">{benefit.icon}</div>
                  <div className="font-bold text-sm mb-1 font-mono">{benefit.title}</div>
                  <div className="text-xs opacity-70">{benefit.desc}</div>
                </motion.div>
              ))}
            </div>
            
            <motion.button 
              onClick={onUpgrade}
              className="zombify-primary-button px-8 py-4 text-lg font-bold tracking-wider"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 30px rgba(147, 51, 234, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            >
              UPGRADE TO PRO
            </motion.button>
            
            <motion.div 
              className="text-xs opacity-50 font-mono mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Unlock advanced psychological analysis and behavioral insights
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 