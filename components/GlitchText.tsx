'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  trigger?: 'hover' | 'continuous' | 'mount';
}

export default function GlitchText({ 
  children, 
  className = '', 
  intensity = 'medium',
  trigger = 'hover'
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchVariants = {
    normal: { 
      x: 0, 
      textShadow: '0 0 0 transparent',
      filter: 'none'
    },
    glitch: {
      x: [0, -2, 2, -1, 1, 0],
      textShadow: [
        '0 0 0 transparent',
        '2px 0 #ff0000, -2px 0 #00ffff',
        '-2px 0 #ff0000, 2px 0 #00ffff',
        '1px 0 #ff0000, -1px 0 #00ffff',
        '0 0 0 transparent'
      ],
      filter: [
        'none',
        'hue-rotate(90deg)',
        'hue-rotate(180deg)',
        'hue-rotate(270deg)',
        'none'
      ],
      transition: {
        duration: intensity === 'low' ? 0.3 : intensity === 'medium' ? 0.5 : 0.8,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: "easeInOut" as const
      }
    }
  };

  useEffect(() => {
    if (trigger === 'continuous') {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), intensity === 'low' ? 300 : intensity === 'medium' ? 500 : 800);
      }, Math.random() * 5000 + 3000); // Random between 3-8 seconds

      return () => clearInterval(interval);
    }
    
    if (trigger === 'mount') {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), intensity === 'low' ? 300 : intensity === 'medium' ? 500 : 800);
    }
  }, [trigger, intensity]);

  const handleHover = () => {
    if (trigger === 'hover') {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), intensity === 'low' ? 300 : intensity === 'medium' ? 500 : 800);
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={glitchVariants}
      animate={isGlitching ? 'glitch' : 'normal'}
      onHoverStart={handleHover}
      style={{ 
        fontWeight: 'bold',
        position: 'relative'
      }}
    >
      {children}
    </motion.div>
  );
}