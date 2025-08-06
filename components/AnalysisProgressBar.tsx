'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnalysisProgressBarProps {
  currentStage: number; // 0-3 (0 = not started, 1 = observing, 2 = interpreting, 3 = recommending)
  isVisible: boolean;
}

const STAGES = [
  {
    id: 1,
    name: 'Observing Interface',
    description: 'Analyzing visual hierarchy and first impressions',
    duration: '~30s'
  },
  {
    id: 2,
    name: 'Interpreting Psychology',
    description: 'Detecting dark patterns and user behavior',
    duration: '~25s'  
  },
  {
    id: 3,
    name: 'Generating Recommendations',
    description: 'Creating actionable fixes and opportunities',
    duration: '~35s'
  }
];

export default function AnalysisProgressBar({ currentStage, isVisible }: AnalysisProgressBarProps) {
  if (!isVisible) return null;

  const getStageStatus = (stageId: number) => {
    if (currentStage > stageId) return 'completed';
    if (currentStage === stageId) return 'active';
    return 'pending';
  };

  const getProgressPercentage = () => {
    if (currentStage === 0) return 0;
    if (currentStage === 1) return 33;
    if (currentStage === 2) return 66;
    if (currentStage === 3) return 100;
    return 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-md mx-auto bg-white border-2 border-black p-4 mt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono font-bold text-sm tracking-wide">
          ANALYSIS IN PROGRESS
        </div>
        <div className="font-mono text-xs opacity-60">
          STAGE {Math.max(1, currentStage)}/3
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 h-2 border border-black/20 relative overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 relative"
            initial={{ width: '0%' }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Animated scanline effect */}
            {currentStage > 0 && currentStage < 4 && (
              <motion.div
                className="absolute top-0 right-0 w-1 h-full bg-white/60"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const status = getStageStatus(stage.id);
          
          return (
            <motion.div
              key={stage.id}
              className={`flex items-start gap-3 transition-all duration-300 ${
                status === 'active' ? 'opacity-100' : 
                status === 'completed' ? 'opacity-80' : 'opacity-40'
              }`}
              initial={{ opacity: 0.4 }}
              animate={{ 
                opacity: status === 'active' ? 1 : status === 'completed' ? 0.8 : 0.4 
              }}
            >
              {/* Status Icon */}
              <div className={`flex-shrink-0 w-5 h-5 border-2 rounded-full flex items-center justify-center mt-0.5 ${
                status === 'completed' ? 'bg-green-600 border-green-600' :
                status === 'active' ? 'border-green-600 bg-white' :
                'border-gray-300 bg-white'
              }`}>
                {status === 'completed' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {status === 'active' && (
                  <motion.div
                    className="w-2 h-2 bg-green-600 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className={`font-mono text-sm font-medium ${
                    status === 'active' ? 'text-black' : 'text-gray-600'
                  }`}>
                    {stage.name}
                  </div>
                  <div className="font-mono text-xs opacity-60">
                    {stage.duration}
                  </div>
                </div>
                <div className={`font-mono text-xs mt-1 ${
                  status === 'active' ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  {stage.description}
                </div>
                
                {/* Active stage loading animation */}
                {status === 'active' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1">
                      <motion.div
                        className="w-1 h-1 bg-green-600 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1 h-1 bg-green-600 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-1 h-1 bg-green-600 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs font-mono text-center opacity-60">
          {currentStage === 0 && 'Initializing analysis...'}
          {currentStage === 1 && 'Reading visual hierarchy and attention patterns...'}
          {currentStage === 2 && 'Analyzing user psychology and dark patterns...'}
          {currentStage === 3 && 'Finalizing recommendations and insights...'}
          {currentStage > 3 && 'Analysis complete! Processing results...'}
        </div>
      </div>
    </motion.div>
  );
}