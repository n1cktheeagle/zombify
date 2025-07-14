'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface AnnotationPoint {
  id: string;
  x: number; // percentage
  y: number; // percentage
  severity: number;
  issue: string;
  category: string;
}

interface AnnotationOverlayProps {
  imageUrl: string;
  annotations: AnnotationPoint[];
  onAnnotationClick?: (annotation: AnnotationPoint) => void;
  className?: string;
}

export default function AnnotationOverlay({ 
  imageUrl, 
  annotations, 
  onAnnotationClick,
  className = ""
}: AnnotationOverlayProps) {
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const getSeverityConfig = (severity: number) => {
    switch (severity) {
      case 4:
        return {
          color: 'bg-red-500 border-red-600',
          ring: 'ring-red-500',
          glow: 'shadow-red-500/50',
          pulse: true
        };
      case 3:
        return {
          color: 'bg-orange-500 border-orange-600',
          ring: 'ring-orange-500',
          glow: 'shadow-orange-500/50',
          pulse: false
        };
      case 2:
        return {
          color: 'bg-yellow-500 border-yellow-600',
          ring: 'ring-yellow-500',
          glow: 'shadow-yellow-500/50',
          pulse: false
        };
      default:
        return {
          color: 'bg-gray-500 border-gray-600',
          ring: 'ring-gray-500',
          glow: 'shadow-gray-500/50',
          pulse: false
        };
    }
  };

  const handleAnnotationClick = (annotation: AnnotationPoint) => {
    setSelectedAnnotation(annotation.id === selectedAnnotation ? null : annotation.id);
    onAnnotationClick?.(annotation);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Base Image */}
      <img
        src={imageUrl}
        alt="Annotated Interface"
        className="w-full h-auto rounded border-2 border-black/20"
        draggable={false}
      />

      {/* Annotation Points */}
      <div className="absolute inset-0">
        {annotations.map((annotation, index) => {
          const config = getSeverityConfig(annotation.severity);
          const isHovered = hoveredAnnotation === annotation.id;
          const isSelected = selectedAnnotation === annotation.id;

          return (
            <div key={annotation.id}>
              {/* Annotation Point */}
              <motion.div
                className={`
                  absolute w-6 h-6 rounded-full border-2 cursor-pointer z-10
                  ${config.color} ${config.ring}
                  flex items-center justify-center
                  transform -translate-x-1/2 -translate-y-1/2
                `}
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isSelected ? 1.3 : isHovered ? 1.2 : 1,
                  opacity: 1,
                  boxShadow: config.pulse 
                    ? `0 0 ${isHovered || isSelected ? '20px' : '10px'} ${config.glow.split('/')[0]}`
                    : `0 0 ${isHovered || isSelected ? '15px' : '8px'} ${config.glow.split('/')[0]}`
                }}
                transition={{ 
                  delay: index * 0.1,
                  scale: { duration: 0.2 },
                  boxShadow: { duration: 0.3 }
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onHoverStart={() => setHoveredAnnotation(annotation.id)}
                onHoverEnd={() => setHoveredAnnotation(null)}
                onClick={() => handleAnnotationClick(annotation)}
              >
                {/* Severity Number */}
                <motion.span 
                  className="text-white text-xs font-bold"
                  animate={config.pulse ? { 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1]
                  } : {}}
                  transition={config.pulse ? { 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  } : {}}
                >
                  {annotation.severity}
                </motion.span>
              </motion.div>

              {/* Pulsing Ring for Critical Issues */}
              {config.pulse && (
                <motion.div
                  className={`
                    absolute w-6 h-6 rounded-full border-2 ${config.color.split(' ')[0]} ${config.ring}
                    transform -translate-x-1/2 -translate-y-1/2 pointer-events-none
                  `}
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                  }}
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.8, 0, 0.8]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeOut"
                  }}
                />
              )}

              {/* Tooltip on Hover */}
              <AnimatePresence>
                {(isHovered || isSelected) && (
                  <motion.div
                    className={`
                      absolute z-20 p-3 rounded-lg shadow-xl
                      bg-black text-white text-xs font-mono
                      max-w-xs pointer-events-none
                      border-l-4 ${config.color.split(' ')[1]}
                    `}
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                      transform: `translate(${annotation.x > 50 ? '-100%' : '20px'}, ${annotation.y > 50 ? '-100%' : '20px'})`
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="font-bold mb-1">{annotation.category}</div>
                    <div className="text-xs opacity-80">{annotation.issue}</div>
                    
                    {/* Arrow pointing to annotation */}
                    <div
                      className={`
                        absolute w-0 h-0 border-4 border-transparent border-t-black
                        ${annotation.x > 50 ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'}
                        ${annotation.y > 50 ? 'bottom-0 translate-y-full border-t-transparent border-b-black' : 'top-0 -translate-y-full'}
                      `}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connecting Line for Selected */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className={`absolute pointer-events-none z-5`}
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <svg
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                    >
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="30"
                        fill="none"
                        stroke={config.color.includes('red') ? '#ef4444' : 
                               config.color.includes('orange') ? '#f97316' :
                               config.color.includes('yellow') ? '#eab308' : '#6b7280'}
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        opacity="0.6"
                        initial={{ pathLength: 0, rotate: 0 }}
                        animate={{ pathLength: 1, rotate: 360 }}
                        transition={{ 
                          pathLength: { duration: 0.5 },
                          rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                        }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <motion.div 
        className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg font-mono text-xs"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="font-bold mb-2">THREAT LEVEL</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>CRITICAL (4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>HIGH (3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>MEDIUM (2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>LOW (1)</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}