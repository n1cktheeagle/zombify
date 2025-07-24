'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Verdict } from '@/types/analysis';
import GlitchText from './GlitchText';

interface VerdictCardProps {
  verdict: Verdict;
  imageUrl?: string;
  className?: string;
}

export default function VerdictCard({ verdict, className = '' }: VerdictCardProps) {
  return (
    <motion.div 
      className={`zombify-card p-6 scan-line relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear"
        }}
        style={{ width: '30%', height: '100%' }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl">🎯</div>
          <GlitchText className="text-xl font-bold text-black" trigger="hover">
            VERDICT
          </GlitchText>
        </div>

        {/* Main Summary */}
        <motion.div 
          className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm font-mono text-cyan-700 mb-1 opacity-80">SUMMARY</div>
          <div className="text-lg font-semibold text-black">{verdict.summary}</div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div 
            className="p-4 bg-white/50 rounded border border-black/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">⏱️</div>
              <div className="text-xs font-mono opacity-70">ATTENTION SPAN</div>
            </div>
            <div className="text-sm font-medium">{verdict.attentionSpan}</div>
          </motion.div>

          <motion.div 
            className="p-4 bg-white/50 rounded border border-black/10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">🎬</div>
              <div className="text-xs font-mono opacity-70">LIKELY ACTION</div>
            </div>
            <div className="text-sm font-medium">{verdict.likelyAction}</div>
          </motion.div>

          <motion.div 
            className="p-4 bg-white/50 rounded border border-black/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">📉</div>
              <div className="text-xs font-mono opacity-70">DROP-OFF POINT</div>
            </div>
            <div className="text-sm font-medium">{verdict.dropoffPoint}</div>
          </motion.div>

          <motion.div 
            className="p-4 bg-white/50 rounded border border-black/10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">💭</div>
              <div className="text-xs font-mono opacity-70">MEMORABLE</div>
            </div>
            <div className="text-sm font-medium">{verdict.memorable}</div>
          </motion.div>
        </div>

        {/* Attention Flow - Simple List */}
        {verdict.attentionFlow && verdict.attentionFlow.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="text-lg">👁️</div>
              <div className="text-sm font-mono opacity-70">ATTENTION FLOW</div>
            </div>

            <div className="space-y-2">
              {verdict.attentionFlow.slice(0, 5).map((step, index) => {
                // attentionFlow is now a simple string array
                const description = step;
                
                return (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-700">{description}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}