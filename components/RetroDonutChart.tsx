'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RetroDonutChartProps {
  score: number;
  label: string;
  icon: string;
  className?: string;
  delay?: number;
}

export default function RetroDonutChart({ 
  score, 
  label, 
  icon, 
  className = '',
  delay = 0 
}: RetroDonutChartProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [score, delay]);

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

  // Calculate circular progress
  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <motion.div 
      className={`border-2 border-black bg-white p-4 relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 text-black">
        <div className="flex items-center gap-1">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-bold tracking-wider">{label.toUpperCase()}</span>
        </div>
        <div className="text-xs opacity-60">●</div>
      </div>
      
      {/* Circular Progress Chart */}
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <svg width="80" height="80" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#e5e5e5"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              stroke={score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, delay: delay + 0.3, ease: "easeOut" }}
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div 
              className={`text-xl font-bold ${getScoreColor(score)}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.6, type: "spring", stiffness: 200 }}
            >
              {Math.round(animatedScore)}
            </motion.div>
            <div className="text-xs text-gray-500">SCORE</div>
          </div>
        </div>
        
        {/* Status */}
        <div className="text-center">
          <div className={`text-sm font-bold ${getScoreColor(score)}`}>
            {score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : 'NEEDS WORK'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}