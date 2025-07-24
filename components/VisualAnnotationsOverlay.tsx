'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualAnnotation } from '@/types/analysis';

interface VisualAnnotationsOverlayProps {
  imageUrl: string;
  annotations: VisualAnnotation[];
  onAnnotationClick?: (annotation: VisualAnnotation) => void;
  className?: string;
}

export default function VisualAnnotationsOverlay({
  imageUrl,
  annotations,
  onAnnotationClick,
  className = ''
}: VisualAnnotationsOverlayProps) {
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle image load to get dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  // Calculate scaled position based on container size
  const getScaledPosition = (annotation: VisualAnnotation) => {
    if (!containerRef.current || imageDimensions.width === 0) return { x: 0, y: 0 };
    
    const container = containerRef.current;
    const scaleX = container.offsetWidth / imageDimensions.width;
    const scaleY = container.offsetHeight / imageDimensions.height;
    
    return {
      x: annotation.boundingBox.x * scaleX,
      y: annotation.boundingBox.y * scaleY,
      width: annotation.boundingBox.width * scaleX,
      height: annotation.boundingBox.height * scaleY
    };
  };

  const getAnnotationColor = (type: VisualAnnotation['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-500 border-red-600';
      case 'warning': return 'bg-orange-500 border-orange-600';
      case 'opportunity': return 'bg-green-500 border-green-600';
      case 'info': return 'bg-blue-500 border-blue-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <img 
        src={imageUrl} 
        alt="Analyzed interface"
        onLoad={handleImageLoad}
        className="w-full h-auto"
      />
      
      {/* Annotations Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {annotations.map((annotation, index) => {
          const position = getScaledPosition(annotation);
          const isHovered = hoveredAnnotation === annotation.id;
          
          return (
            <React.Fragment key={annotation.id}>
              {/* Highlight Box (only on hover) */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute border-2 ${getAnnotationColor(annotation.type)} bg-opacity-10`}
                    style={{
                      left: position?.x || 0,
                      top: position?.y || 0,
                      width: position?.width || 0,
                      height: position?.height || 0,
                      borderColor: annotation.type === 'critical' ? 'rgba(239, 68, 68, 0.5)' :
                                   annotation.type === 'warning' ? 'rgba(251, 146, 60, 0.5)' :
                                   annotation.type === 'opportunity' ? 'rgba(34, 197, 94, 0.5)' :
                                   'rgba(59, 130, 246, 0.5)',
                      backgroundColor: annotation.type === 'critical' ? 'rgba(239, 68, 68, 0.1)' :
                                       annotation.type === 'warning' ? 'rgba(251, 146, 60, 0.1)' :
                                       annotation.type === 'opportunity' ? 'rgba(34, 197, 94, 0.1)' :
                                       'rgba(59, 130, 246, 0.1)'
                    }}
                  />
                )}
              </AnimatePresence>
              
              {/* Numbered Marker */}
              <motion.div
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer pointer-events-auto shadow-lg ${getAnnotationColor(annotation.type)}`}
                style={{
                  left: position.x + (position.width || 0) / 2 - 16,
                  top: position.y + (position.height || 0) / 2 - 16,
                  zIndex: 10 + index
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                onMouseLeave={() => setHoveredAnnotation(null)}
                onClick={() => onAnnotationClick?.(annotation)}
              >
                {index + 1}
              </motion.div>
              
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bg-black text-white p-3 rounded-lg shadow-xl pointer-events-none z-50 max-w-xs"
                    style={{
                      left: Math.min(position.x + (position.width || 0) / 2 - 150, containerRef.current?.offsetWidth ? containerRef.current.offsetWidth - 320 : 0),
                      top: position.y + (position.height || 0) + 10,
                      minWidth: '300px'
                    }}
                  >
                    <div className="font-bold mb-1">{annotation.title}</div>
                    <div className="text-sm opacity-90">{annotation.description}</div>
                    {annotation.elementText && (
                      <div className="text-xs mt-2 opacity-70">
                        Element: "{annotation.elementText}"
                      </div>
                    )}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-black"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}