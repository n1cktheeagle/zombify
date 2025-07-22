'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttentionHeatmapOverlayProps {
  imageUrl: string;
  attentionFlow: string[];
  className?: string;
}

export default function AttentionHeatmapOverlay({ 
  imageUrl, 
  attentionFlow, 
  className = '' 
}: AttentionHeatmapOverlayProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play through attention steps
  useEffect(() => {
    if (isPlaying && attentionFlow.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % attentionFlow.length);
      }, 2000); // 2 seconds per step
      return () => clearInterval(interval);
    }
  }, [isPlaying, attentionFlow.length]);

  // Generate heatmap positions based on common attention patterns
  const getHeatmapPosition = (index: number, total: number) => {
    // Common attention flow patterns (F-pattern, Z-pattern, etc.)
    const patterns = {
      0: { top: '15%', left: '20%' }, // First attention - usually top-left
      1: { top: '20%', left: '50%' }, // Second - often center or right
      2: { top: '50%', left: '30%' }, // Third - middle content
      3: { top: '70%', left: '60%' }, // Fourth - lower content/CTA
    };

    // Use predefined positions or generate based on index
    if (patterns[index as keyof typeof patterns]) {
      return patterns[index as keyof typeof patterns];
    }

    // Fallback pattern for additional steps
    const angle = (index / total) * 2 * Math.PI;
    const radius = 30; // percentage
    return {
      top: `${50 + radius * Math.sin(angle)}%`,
      left: `${50 + radius * Math.cos(angle)}%`
    };
  };

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Source Image */}
      <img
        src={imageUrl}
        alt="Interface Analysis"
        className="w-full h-auto"
        onError={(e: any) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwSDE1MFYxODBIMTUwVjEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHRleHQgeD0iMjAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
        }}
      />

      {/* Heatmap Overlay */}
      <AnimatePresence>
        {showHeatmap && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Attention hotspots */}
            {attentionFlow.map((step, index) => {
              const position = getHeatmapPosition(index, attentionFlow.length);
              const isActive = isPlaying ? index === currentStep : true;
              const intensity = isPlaying 
                ? (index === currentStep ? 1 : 0.3)
                : 1 - (index / attentionFlow.length) * 0.5;

              return (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{
                    top: position.top,
                    left: position.left,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1 : 0.7,
                    opacity: isActive ? intensity : intensity * 0.5
                  }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.5,
                    repeat: isPlaying ? 0 : Infinity,
                    repeatType: "reverse",
                    repeatDelay: 1
                  }}
                >
                  {/* Heatmap blob */}
                  <div 
                    className="relative"
                    style={{
                      width: '120px',
                      height: '120px',
                    }}
                  >
                    {/* Gradient circles for heat effect */}
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-40" />
                    <div className="absolute inset-2 bg-orange-500 rounded-full blur-lg opacity-50" />
                    <div className="absolute inset-4 bg-yellow-400 rounded-full blur-md opacity-60" />
                    
                    {/* Step number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Step description tooltip */}
                  {isActive && (
                    <motion.div
                      className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center">
                        {step}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45" />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* Flow lines connecting the points */}
            <svg className="absolute inset-0 w-full h-full">
              {attentionFlow.slice(0, -1).map((_, index) => {
                const from = getHeatmapPosition(index, attentionFlow.length);
                const to = getHeatmapPosition(index + 1, attentionFlow.length);
                
                return (
                  <motion.line
                    key={`line-${index}`}
                    x1={from.left}
                    y1={from.top}
                    x2={to.left}
                    y2={to.top}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ 
                      delay: index * 0.2 + 0.5,
                      duration: 0.5
                    }}
                  />
                );
              })}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <motion.button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
            showHeatmap 
              ? 'bg-red-600 text-white' 
              : 'bg-white/90 text-black hover:bg-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showHeatmap ? '🔥 HEATMAP ON' : '👁️ SHOW HEATMAP'}
        </motion.button>

        {showHeatmap && (
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-white/90 text-black rounded-lg font-mono text-xs font-bold hover:bg-white transition-all"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
          </motion.button>
        )}
      </div>

      {/* Legend */}
      {showHeatmap && (
        <motion.div
          className="absolute top-4 left-4 bg-white/90 rounded-lg p-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="text-xs font-mono font-bold mb-2">ATTENTION FLOW</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full" />
              <span>High attention</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500/50 to-yellow-400/50 rounded-full" />
              <span>Low attention</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}