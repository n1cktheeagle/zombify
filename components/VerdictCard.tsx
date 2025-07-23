'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Verdict } from '@/types/analysis';
import GlitchText from './GlitchText';
import AttentionHeatmapOverlay from './AttentionHeatmapOverlay';

interface VerdictCardProps {
  verdict: Verdict;
  imageUrl?: string;
  className?: string;
}

export default function VerdictCard({ verdict, imageUrl, className = '' }: VerdictCardProps) {
  const [showHeatmapInline, setShowHeatmapInline] = React.useState(false);
  
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
          {verdict.heatmapData?.hotspots && verdict.heatmapData.hotspots.length > 0 && (
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-mono">
              ✨ VISION AI ENHANCED
            </div>
          )}
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

        {/* Attention Flow with Enhanced Heatmap */}
        {verdict.attentionFlow && verdict.attentionFlow.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-lg">👁️</div>
                <div className="text-sm font-mono opacity-70">ATTENTION FLOW</div>
                {verdict.heatmapData?.hotspots && verdict.heatmapData.hotspots.length > 0 && (
                  <div className="text-xs bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-2 py-1 rounded font-mono border border-green-200">
                    {verdict.heatmapData.hotspots.length} REAL HOTSPOTS
                  </div>
                )}
              </div>
              {imageUrl && (
                <motion.button
                  onClick={() => setShowHeatmapInline(!showHeatmapInline)}
                  className="text-xs font-mono px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showHeatmapInline ? 'HIDE HEATMAP' : 'SHOW HEATMAP'}
                </motion.button>
              )}
            </div>

            {/* Inline Heatmap View with Vision API Data */}
            {showHeatmapInline && imageUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <AttentionHeatmapOverlay
                  imageUrl={imageUrl}
                  attentionFlow={verdict.attentionFlow}
                  heatmapData={verdict.heatmapData}
                  className="rounded-lg overflow-hidden border-2 border-black/20"
                />
              </motion.div>
            )}

            {/* Text List View */}
            <div className="space-y-2">
              {verdict.attentionFlow.map((step, index) => {
                // Show real element info if available from Vision API
                const hasRealData = verdict.heatmapData?.hotspots && verdict.heatmapData.hotspots[index];
                const elementInfo = hasRealData ? verdict.heatmapData?.hotspots[index] : null;
                
                return (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 text-white text-xs font-bold rounded-full flex items-center justify-center ${
                      hasRealData 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-mono opacity-80">{step}</div>
                      {elementInfo && (
                        <div className="text-xs text-green-600 mt-1 font-mono">
                          📍 Real element: {elementInfo.element} 
                          <span className="ml-2 opacity-60">
                            (intensity: {Math.round(elementInfo.intensity * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Vision API Debug Info (you can remove this later) */}
            {verdict.heatmapData?.hotspots && verdict.heatmapData.hotspots.length > 0 && (
              <motion.div
                className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-xs font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="text-green-700 font-bold mb-2">🔍 VISION API DATA:</div>
                <div className="space-y-1 text-green-600">
                  {verdict.heatmapData.hotspots.slice(0, 3).map((hotspot, i) => (
                    <div key={i}>
                      • Element "{hotspot.element}" at coordinates ({Math.round(hotspot.x)}, {Math.round(hotspot.y)}) 
                      - Intensity: {Math.round(hotspot.intensity * 100)}%
                    </div>
                  ))}
                  {verdict.heatmapData.hotspots.length > 3 && (
                    <div>... and {verdict.heatmapData.hotspots.length - 3} more hotspots</div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}