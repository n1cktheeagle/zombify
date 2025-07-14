'use client';

import { motion } from 'framer-motion';
import { GripScore } from '@/types/analysis';
import GlitchText from './GlitchText';
import { useEffect, useState } from 'react';

type LegacyGripScoreCardProps = {
  score: number;
};

type NewGripScoreCardProps = {
  gripScore: GripScore;
  showBreakdown?: boolean;
};

type GripScoreCardProps = LegacyGripScoreCardProps | NewGripScoreCardProps;

// Type guard
function isNewFormat(props: GripScoreCardProps): props is NewGripScoreCardProps {
  return 'gripScore' in props;
}

export default function GripScoreCard(props: GripScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Handle legacy format
  if (!isNewFormat(props)) {
    useEffect(() => {
      const timer = setTimeout(() => {
        let current = 0;
        const increment = props.score / 60; // Animate over ~1 second at 60fps
        const counter = setInterval(() => {
          current += increment;
          if (current >= props.score) {
            setAnimatedScore(props.score);
            clearInterval(counter);
          } else {
            setAnimatedScore(Math.floor(current));
          }
        }, 16);
        return () => clearInterval(counter);
      }, 500);
      
      return () => clearTimeout(timer);
    }, [props.score]);

    return (
      <motion.div 
        className="zombify-card p-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background pulse effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative z-10">
          <GlitchText className="text-lg font-bold mb-2" trigger="mount">
            GRIP SCORE
          </GlitchText>
          <div className="text-4xl font-bold glitch-text">
            {animatedScore}
          </div>
        </div>
      </motion.div>
    );
  }

  // Handle new format
  const { gripScore, showBreakdown = false } = props;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = gripScore.overall / 60;
      const counter = setInterval(() => {
        current += increment;
        if (current >= gripScore.overall) {
          setAnimatedScore(gripScore.overall);
          clearInterval(counter);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, 16);
      return () => clearInterval(counter);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [gripScore.overall]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreState = (score: number) => {
    if (score >= 80) return { label: 'AWAKENING', color: 'green' };
    if (score >= 60) return { label: 'SIGNAL', color: 'yellow' };
    if (score >= 40) return { label: 'STATIC', color: 'orange' };
    return { label: 'INVISIBLE', color: 'red' };
  };

  const scoreState = getScoreState(gripScore.overall);

  return (
    <motion.div 
      className="zombify-card p-6 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Animated background grid */}
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgba(255,255,255,.1) 25%, rgba(255,255,255,.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.1) 75%, rgba(255,255,255,.1) 76%, transparent 77%)
          `,
          backgroundSize: '20px 20px'
        }}
        animate={{ 
          backgroundPosition: ['0px 0px', '20px 20px', '0px 0px']
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 10,
          ease: "linear"
        }}
      />

      {/* Signal strength indicator */}
      <motion.div
        className="absolute top-4 right-4 flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[1, 2, 3, 4, 5].map((bar) => (
          <motion.div
            key={bar}
            className={`w-1 bg-current rounded-full ${
              (gripScore.overall / 20) >= bar ? 'opacity-100' : 'opacity-20'
            }`}
            style={{ height: `${bar * 4 + 8}px` }}
            animate={
              (gripScore.overall / 20) >= bar 
                ? { 
                    opacity: [0.5, 1, 0.5],
                    scaleY: [0.8, 1.2, 0.8]
                  }
                : {}
            }
            transition={{ 
              repeat: Infinity, 
              duration: 2 + bar * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <GlitchText 
            className="text-xl font-bold" 
            trigger="mount"
            intensity="high"
          >
            GRIP SCORE
          </GlitchText>
          <motion.span 
            className={`text-xs px-3 py-1 rounded-full font-bold tracking-wider bg-${scoreState.color}-500/20 text-${scoreState.color}-400 border border-${scoreState.color}-500/50`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, type: "spring" }}
          >
            {scoreState.label}
          </motion.span>
        </div>

        {/* Main Score */}
        <div className="mb-6">
          <motion.div 
            className={`text-6xl font-bold font-mono ${getScoreColor(gripScore.overall)}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {animatedScore}
          </motion.div>
          <motion.div 
            className="text-sm opacity-60 font-mono"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            How well this cuts through the noise
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <motion.div 
            className="relative h-3 bg-black/20 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${gripScore.overall}%` }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
            />
            
            {/* Pulse effect on the progress bar */}
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              animate={{ 
                opacity: [0, 0.3, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          
          {/* Scale labels */}
          <div className="flex justify-between text-xs opacity-60 mt-2 font-mono">
            <span>INVISIBLE</span>
            <span>STATIC</span>
            <span>SIGNAL</span>
            <span>AWAKENING</span>
          </div>
        </div>

        {/* Breakdown */}
        {showBreakdown && (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            {Object.entries(gripScore.breakdown).map(([key, score], index) => (
              <motion.div
                key={key}
                className="flex justify-between items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
              >
                <span className="text-sm font-mono capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-16 h-1 bg-black/20 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className={`h-full rounded-full ${getScoreColor(score).replace('text-', 'bg-')}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: 1.5 + index * 0.1, duration: 0.8 }}
                    />
                  </motion.div>
                  <span className={`font-bold text-sm font-mono w-8 text-right ${getScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}