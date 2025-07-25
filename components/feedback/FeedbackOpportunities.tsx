'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '../GlitchText';

interface FeedbackOpportunitiesProps {
  analysis: ZombifyAnalysis;
  imageUrl?: string;
  isPro?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export default function FeedbackOpportunities({ 
  analysis, 
  imageUrl, 
  isPro = false,
  onUpgrade,
  className = '' 
}: FeedbackOpportunitiesProps) {
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [expandedOpportunity, setExpandedOpportunity] = useState<number | null>(null);

  const opportunities = analysis.opportunities || [];

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
                GROWTH OPPORTUNITIES
              </GlitchText>
            </h2>
            <div className="text-lg opacity-70 font-mono mb-2">
              Revenue-boosting insights and conversion optimization opportunities
            </div>
            {isPro && (
              <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
                <span>{opportunities.length} Opportunities</span>
                <span>•</span>
                <span className="text-green-600 font-bold">PRO ANALYSIS</span>
              </div>
            )}
          </div>
          
          {/* Side-by-side comparison toggle - Pro only */}
          {isPro && imageUrl && (
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

      {isPro ? (
        <div className={showImageComparison ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'space-y-6'}>
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
                  Refer to this image while reviewing opportunities
                </p>
              </div>
            </motion.div>
          )}
          
          {/* Opportunities list */}
          <div className="space-y-6">
            {opportunities.length > 0 ? (
              opportunities.map((opp, index) => (
                <motion.div
                  key={index}
                  className="zombify-card relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  {/* Impact Badge */}
                  <div className="absolute top-4 right-4">
                    <motion.span 
                      className={`text-xs px-3 py-1 rounded-full font-bold font-mono tracking-wider ${
                        opp.potentialImpact === 'HIGH' ? 'bg-green-600 text-white' :
                        opp.potentialImpact === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {opp.potentialImpact} IMPACT
                    </motion.span>
                  </div>

                  <div className="p-6">
                    {/* Opportunity Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-black mb-2">{opp.opportunity}</h4>
                        <p className="text-base opacity-80 leading-relaxed">{opp.reasoning}</p>
                      </div>
                    </div>

                    {/* Implementation Details */}
                    {opp.implementation && (
                      <motion.div
                        className="mt-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <div 
                          className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors"
                          onClick={() => setExpandedOpportunity(expandedOpportunity === index ? null : index)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-semibold text-green-800 font-mono">
                              🔧 IMPLEMENTATION PLAN
                            </div>
                            <motion.div
                              animate={{ rotate: expandedOpportunity === index ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-green-600"
                            >
                              ▼
                            </motion.div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedOpportunity === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-green-300">
                                  <div className="text-sm text-green-700 leading-relaxed">
                                    {opp.implementation}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
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
                  🎯
                </motion.div>
                <GlitchText className="text-3xl font-bold mb-4" trigger="mount">
                  NO OPPORTUNITIES DETECTED
                </GlitchText>
                <p className="text-lg opacity-70 font-mono mb-4">
                  Your interface is already well-optimized for conversions
                </p>
                <div className="text-sm opacity-60 font-mono bg-green-50 p-4 rounded-lg inline-block">
                  This indicates excellent UX practices are already in place
                </div>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        /* Pro Upgrade CTA */
        <motion.div
          className="text-center py-16 zombify-card relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-green-500/10"
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
              🚀
            </motion.div>
            
            <GlitchText className="text-3xl font-bold mb-4" trigger="continuous">
              UNLOCK GROWTH INTELLIGENCE
            </GlitchText>
            
            <p className="text-lg mb-6 max-w-2xl mx-auto opacity-70 leading-relaxed">
              Discover revenue-boosting opportunities, conversion optimizations, and strategic growth insights 
              that could transform your user experience.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
              {[
                { icon: '💰', title: 'Revenue Opportunities', desc: 'Identify conversion bottlenecks' },
                { icon: '📈', title: 'Growth Insights', desc: 'Strategic optimization paths' },
                { icon: '🎯', title: 'Action Plans', desc: 'Step-by-step implementation' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="bg-white/50 border border-purple-200 p-4 rounded-lg"
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
              Unlock advanced growth analytics and optimization insights
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 