'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';

interface GripScoreCardProps {
  gripScore?: ZombifyAnalysis['gripScore'];
  score?: number; // Legacy support
  showBreakdown?: boolean;
}

export default function GripScoreCard({ gripScore, score, showBreakdown = false }: GripScoreCardProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Handle legacy format
  if (!gripScore && score !== undefined) {
    return (
      <motion.div 
        className="relative overflow-hidden bg-[#f5f1e6] border-2 border-black/20 shadow-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0),
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 20px 20px, 20px 20px'
        }}
      >
        {/* Vintage terminal header */}
        <div className="bg-gradient-to-r from-stone-200 to-stone-100 p-3 border-b-2 border-black/10 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs tracking-wider text-stone-600">◇ GRIP_ANALYZER.EXE</div>
              <motion.div 
                className="w-2 h-2 bg-green-600 rounded-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <div className="text-xs text-stone-500 font-mono">REV.1987</div>
          </div>
        </div>

        <div className="p-8 text-center relative">
          {/* Subtle CRT scanlines */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
            }}
          />
          
          <GlitchText className="text-lg font-bold mb-6 text-stone-700 font-mono tracking-wider" trigger="mount" intensity="low">
            {'>> ENGAGEMENT COEFFICIENT'}
          </GlitchText>
          
          {/* Retro geometric display */}
          <div className="relative w-56 h-56 mx-auto mb-6">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              {/* Vintage grid pattern */}
              <defs>
                <pattern id="vintageGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
                </pattern>
                <filter id="retroGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <rect width="200" height="200" fill="url(#vintageGrid)" opacity="0.3"/>

              {/* Vintage computer-style octagon */}
              <polygon
                points="100,30 150,50 170,100 150,150 100,170 50,150 30,100 50,50"
                fill="rgba(0,0,0,0.05)"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="2"
              />

              {/* Progress octagon with vintage styling */}
              <motion.polygon
                points="100,30 150,50 170,100 150,150 100,170 50,150 30,100 50,50"
                fill="none"
                stroke={score >= 80 ? '#2d5016' : score >= 60 ? '#8b4513' : '#8b1538'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="400"
                filter="url(#retroGlow)"
                initial={{ strokeDashoffset: 400 }}
                animate={{ strokeDashoffset: 400 * (1 - score / 100) }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
              />

              {/* Vintage data points */}
              {Array.from({length: 8}).map((_, i) => {
                const angle = (i * 45) - 90;
                const radian = (angle * Math.PI) / 180;
                const radius = 75;
                const x = 100 + radius * Math.cos(radian);
                const y = 100 + radius * Math.sin(radian);
                
                return (
                  <motion.g key={i}>
                    <motion.rect
                      x={x-2}
                      y={y-2}
                      width="4"
                      height="4"
                      fill="#4a5568"
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [0, 1.2, 1],
                        opacity: [0, 1, 0.8]
                      }}
                      transition={{ 
                        delay: 0.8 + i * 0.1,
                        duration: 0.5,
                        ease: "easeOut"
                      }}
                    />
                  </motion.g>
                );
              })}
            </svg>
            
            {/* Score display with vintage computer styling */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="text-center relative"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
              >
                {/* Subtle glitch overlay */}
                <motion.div
                  className="absolute inset-0 text-5xl font-mono font-black text-red-800/30"
                  animate={{
                    x: [-1, 1, 0],
                    y: [0, -1, 0],
                    opacity: [0, 0.2, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 8,
                    times: [0, 0.05, 1]
                  }}
                >
                  {score}
                </motion.div>
                
                <motion.div 
                  className={`text-5xl font-mono font-black relative z-10 ${
                    score >= 80 ? 'text-green-800' : 
                    score >= 60 ? 'text-orange-800' : 
                    'text-red-800'
                  }`}
                  style={{
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
                  }}
                >
                  {score}
                </motion.div>
                
                <motion.div 
                  className="text-xs font-mono text-stone-600 tracking-[0.2em] mt-2"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  GRIP_INDEX
                </motion.div>
                
                {/* Vintage data bars */}
                <div className="flex justify-center mt-3 gap-1">
                  {Array.from({length: 7}).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-stone-500"
                      animate={{
                        height: ['3px', '8px', '3px'],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Vintage status display */}
          <motion.div 
            className="bg-stone-100 border-2 border-stone-300 p-3 font-mono text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-stone-600">STATUS:</span>
              <motion.span 
                className={score >= 80 ? 'text-green-700' : score >= 60 ? 'text-orange-700' : 'text-red-700'}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {score >= 80 ? 'OPTIMAL_LOCK' : score >= 60 ? 'DRIFT_DETECTED' : 'SIGNAL_WEAK'}
              </motion.span>
            </div>
          </motion.div>
        </div>
        
        {/* Subtle vintage scanning effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent pointer-events-none"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          style={{ height: '40px' }}
        />
      </motion.div>
    );
  }

  if (!gripScore) return null;

  const overallScore = gripScore.overall;
  const breakdown = gripScore.breakdown;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-800';
    if (score >= 60) return 'text-orange-800';
    return 'text-red-800';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return '#2d5016';
    if (score >= 60) return '#8b4513';
    return '#8b1538';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-300/50';
    if (score >= 60) return 'bg-orange-50 border-orange-300/50';
    return 'bg-red-50 border-red-300/50';
  };

  const categories = [
    { key: 'firstImpression', label: 'FIRST_CONTACT', icon: '◉', color: 'stone' },
    { key: 'usability', label: 'INTERFACE_FLOW', icon: '◈', color: 'stone' },
    { key: 'trustworthiness', label: 'TRUST_SIGNAL', icon: '◇', color: 'stone' },
    { key: 'conversion', label: 'ACTION_RATE', icon: '◆', color: 'stone' },
    { key: 'accessibility', label: 'ACCESS_PATH', icon: '◎', color: 'stone' }
  ];

  return (
    <motion.div 
      className="relative overflow-hidden bg-[#f5f1e6] border-2 border-black/20 shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        backgroundImage: `
          radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0),
          linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px, 20px 20px, 20px 20px'
      }}
    >
      {/* Vintage terminal header */}
      <div className="bg-gradient-to-r from-stone-200 to-stone-100 p-3 border-b-2 border-black/10 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs tracking-wider text-stone-600">◇ NEURAL_GRIP_ANALYSIS.EXE</div>
            <motion.div 
              className="w-2 h-2 bg-green-600 rounded-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div className="text-xs text-stone-500 font-mono">REV.1987</div>
        </div>
      </div>

      {/* Main display */}
      <div className="p-8 relative">
        {/* Subtle CRT scanlines */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
          }}
        />

        <div className="text-center mb-8 relative z-10">
                     <GlitchText className="text-lg font-bold mb-6 text-stone-700 font-mono tracking-wider" trigger="mount" intensity="low">
             {'>> NEURAL GRIP MATRIX'}
           </GlitchText>
          
          {/* Vintage geometric display */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              {/* Vintage grid background */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <rect width="200" height="200" fill="url(#grid)" opacity="0.3"/>

              {/* Vintage containment rings */}
              {[80, 65, 50].map((radius, i) => (
                <motion.circle
                  key={i}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={`rgba(0,0,0,${0.15 - i * 0.03})`}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  animate={{ 
                    rotate: [(i % 2 === 0 ? 0 : 360), (i % 2 === 0 ? 360 : 0)],
                    strokeOpacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{ 
                    rotate: { repeat: Infinity, duration: 15 + i * 3, ease: "linear" },
                    strokeOpacity: { repeat: Infinity, duration: 4, delay: i * 0.8 }
                  }}
                />
              ))}

              {/* Main octagon container */}
              <polygon
                points="100,35 145,55 165,100 145,145 100,165 55,145 35,100 55,55"
                fill="rgba(0,0,0,0.05)"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="2"
              />

              {/* Progress octagon with vintage styling */}
              <motion.polygon
                points="100,35 145,55 165,100 145,145 100,165 55,145 35,100 55,55"
                fill="none"
                stroke={getScoreStroke(overallScore)}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="460"
                filter="url(#glow)"
                initial={{ strokeDashoffset: 460 }}
                animate={{ strokeDashoffset: 460 * (1 - overallScore / 100) }}
                transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
              />

              {/* Data nodes at octagon vertices */}
              {categories.slice(0, 8).map((category, i) => {
                const categoryData = breakdown[category.key as keyof typeof breakdown];
                if (!categoryData) return null;
                
                const angle = (i * 45) - 90;
                const radian = (angle * Math.PI) / 180;
                const x = 100 + 70 * Math.cos(radian);
                const y = 100 + 70 * Math.sin(radian);
                
                return (
                  <motion.g key={i}>
                    {/* Connection line */}
                    <motion.line
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke={getScoreStroke(categoryData.score)}
                      strokeWidth="1"
                      strokeOpacity="0.4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                    />
                    
                    {/* Data node */}
                    <motion.rect
                      x={x-3}
                      y={y-3}
                      width="6"
                      height="6"
                      fill={getScoreStroke(categoryData.score)}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [0, 1.2, 1],
                        opacity: [0, 1, 0.9]
                      }}
                      transition={{ 
                        delay: 1.2 + i * 0.1,
                        duration: 0.6,
                        ease: "easeOut"
                      }}
                    />
                  </motion.g>
                );
              })}
            </svg>
            
            {/* Central score display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="text-center relative"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
              >
                {/* Subtle glitch effects */}
                <motion.div
                  className="absolute inset-0 text-5xl font-mono font-black text-red-800/20"
                  animate={{
                    x: [-1, 1, 0],
                    y: [0, -1, 0],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 12,
                    times: [0, 0.02, 1]
                  }}
                >
                  {overallScore}
                </motion.div>
                
                <motion.div 
                  className={`text-5xl font-mono font-black relative z-10 ${getScoreColor(overallScore)}`}
                  style={{
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
                  }}
                >
                  {overallScore}
                </motion.div>
                
                <motion.div 
                  className="text-xs font-mono text-stone-600 tracking-[0.3em] mt-3"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  GRIP_INDEX
                </motion.div>
                
                {/* Data stream */}
                <div className="flex justify-center mt-3 gap-1">
                  {Array.from({length: 9}).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-stone-500"
                      animate={{
                        height: ['3px', '9px', '3px'],
                        opacity: [0.4, 0.9, 0.4]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* System status */}
          <motion.div 
            className="bg-stone-100 border-2 border-stone-300 p-4 font-mono text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-stone-600">NEURAL_STATE:</span>
                <motion.span 
                  className={getScoreColor(overallScore)}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {overallScore >= 80 ? 'LOCKED' : overallScore >= 60 ? 'DRIFT' : 'WEAK'}
                </motion.span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">SIGNAL_STATUS:</span>
                <motion.span 
                  className="text-green-700"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                >
                  ACQUIRED
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced breakdown with vintage styling */}
        {showBreakdown && breakdown && (
          <motion.div 
            className="space-y-3 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2 }}
          >
                         <div className="text-center mb-6">
               <GlitchText className="text-sm font-bold text-stone-700 font-mono tracking-wider" trigger="hover" intensity="low">
                 {'>> COMPONENT_ANALYSIS'}
               </GlitchText>
             </div>

            {categories.map((category, index) => {
              const categoryData = breakdown[category.key as keyof typeof breakdown];
              if (!categoryData) return null;

              const isExpanded = expandedCategory === category.key;

              return (
                <motion.div
                  key={category.key}
                  className={`border-2 border-stone-300 bg-stone-50/80 overflow-hidden relative ${getScoreBg(categoryData.score)}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.4 + (0.1 * index) }}
                >
                  {/* Subtle scanning line */}
                  <motion.div
                    className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-stone-400 to-transparent"
                    animate={{ width: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 6, delay: index * 1 }}
                  />
                  
                  <motion.div
                    className="p-4 cursor-pointer relative"
                    onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                    whileHover={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      scale: 1.005
                    }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <motion.span 
                          className="text-lg text-stone-600"
                          animate={{ 
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ repeat: Infinity, duration: 4, delay: index * 0.5 }}
                        >
                          {category.icon}
                        </motion.span>
                        <div>
                          <div className="font-mono font-bold text-sm text-stone-700">{category.label}</div>
                          <div className="text-xs text-stone-500 opacity-80 truncate max-w-xs font-mono">
                            {categoryData.reasoning}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Vintage progress bar */}
                        <div className="w-16 h-3 bg-stone-200 border border-stone-400 overflow-hidden relative">
                          <motion.div
                            className={`h-full ${getScoreColor(categoryData.score).replace('text-', 'bg-')}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${categoryData.score}%` }}
                            transition={{ duration: 1.5, delay: 2.6 + (index * 0.1) }}
                          />
                          {/* Subtle scanning effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 4, delay: index * 0.5 }}
                            style={{ width: '30%' }}
                          />
                        </div>
                        <div className={`text-xl font-mono font-black ${getScoreColor(categoryData.score)}`}
                             style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
                          {categoryData.score}
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-stone-500 font-mono"
                        >
                          ▼
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t-2 border-stone-300 bg-stone-100/50">
                                                     <div className="mt-4">
                             <div className="text-sm font-mono font-bold mb-2 text-stone-700">{'>> ANALYSIS:'}</div>
                             <div className="text-sm mb-4 text-stone-600 font-mono">{categoryData.reasoning}</div>
                             
                             {categoryData.evidence && categoryData.evidence.length > 0 && (
                               <div>
                                 <div className="text-sm font-mono font-bold mb-2 text-stone-700">{'>> DATA_POINTS:'}</div>
                                <ul className="text-sm space-y-2">
                                  {categoryData.evidence.map((evidence, i) => (
                                    <motion.li 
                                      key={i} 
                                      className="flex items-start gap-3 font-mono text-stone-600"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                    >
                                      <span className="text-stone-500 mt-1 font-mono">◦</span>
                                      <span>{evidence}</span>
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Vintage scanning effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/3 to-transparent pointer-events-none"
        animate={{ y: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        style={{ height: '50px' }}
      />
    </motion.div>
  );
}