'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoTooltipProps {
  content: string;
  title?: string;
  className?: string;
}

export default function InfoTooltip({ content, title, className = '' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const iconRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (iconRef.current && tooltipRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = iconRect.left + iconRect.width / 2;
      let y = iconRect.top - 10;

      // Adjust horizontal position if tooltip would go off-screen
      if (x + tooltipRect.width / 2 > viewportWidth - 10) {
        x = viewportWidth - tooltipRect.width / 2 - 10;
      }
      if (x - tooltipRect.width / 2 < 10) {
        x = tooltipRect.width / 2 + 10;
      }

      // Adjust vertical position if tooltip would go off-screen
      if (y - tooltipRect.height < 10) {
        y = iconRect.bottom + 10;
      }

      setPosition({ x, y });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };


  return (
    <>
      <motion.button
        ref={iconRef}
        className={`
          inline-flex items-center justify-center w-5 h-5 rounded-full 
          bg-black/10 hover:bg-black/20 border border-black/30 hover:border-black/50
          text-black/60 hover:text-black/80 transition-all duration-200
          font-mono text-xs font-bold cursor-help
          ${className}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.1 }}
      >
        i
      </motion.button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className="fixed z-50 pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 max-w-sm">
              {title && (
                <div className="font-bold text-sm mb-2 font-mono tracking-wider border-b border-black/20 pb-2">
                  {title}
                </div>
              )}
              <div className="text-xs font-mono leading-relaxed text-black/80">
                {content}
              </div>
              
              {/* Arrow pointing to the icon */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-white absolute -top-px left-1/2 transform -translate-x-1/2"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}