'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeatmapHotspot {
  x: number;
  y: number;
  intensity: number;
  element: string;
  description: string;
}

interface AttentionHeatmapOverlayProps {
  imageUrl: string;
  attentionFlow: string[];
  className?: string;
  heatmapData?: {
    hotspots: HeatmapHotspot[];
    coldspots: Array<{
      x: number;
      y: number;
      element: string;
      reason: string;
    }>;
  };
}

export default function AttentionHeatmapOverlay({ 
  imageUrl, 
  attentionFlow, 
  className = '',
  heatmapData
}: AttentionHeatmapOverlayProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (isPlaying && attentionFlow.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % attentionFlow.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, attentionFlow.length]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setImageSize({
      width: img.offsetWidth,
      height: img.offsetHeight
    });
  };

  // INTELLIGENT COORDINATE FINDING: Use GPT description to find Vision coordinates  
  const findVisionCoordinatesForDescription = (gptDescription: string) => {
    if (!heatmapData?.hotspots || !imageSize) return null;

    console.log(`🔍 Looking for Vision coordinates for: "${gptDescription}"`);
    
    const lowerDesc = gptDescription.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Comprehensive keyword matching for each GPT description
    for (const hotspot of heatmapData.hotspots) {
      const elementText = hotspot.element.toLowerCase();
      let score = 0;

      // Victory/Score matching
      if (lowerDesc.includes('victory') || lowerDesc.includes('score')) {
        if (elementText.includes('victory')) score += 10;
        if (elementText.includes('16') || elementText.includes('9')) score += 8;
        if (elementText.includes('win') || elementText.includes('result')) score += 5;
      }

      // Player/Ranking matching  
      if (lowerDesc.includes('player') || lowerDesc.includes('ranking')) {
        if (elementText.includes('player')) score += 10;
        if (elementText.includes('placement')) score += 8;
        if (elementText.includes('1') || elementText.includes('2') || elementText.includes('3')) score += 6;
        if (elementText.includes('rank')) score += 7;
      }

      // Navigation matching
      if (lowerDesc.includes('navigation') || lowerDesc.includes('menu')) {
        if (elementText.includes('home')) score += 8;
        if (elementText.includes('general')) score += 7;
        if (elementText.includes('matches')) score += 7;
        if (elementText.includes('club')) score += 6;
        if (elementText.includes('nav')) score += 5;
      }

      // Button matching
      if (lowerDesc.includes('button') || lowerDesc.includes('pro') || lowerDesc.includes('get')) {
        if (elementText.includes('pro')) score += 10;
        if (elementText.includes('get')) score += 9;
        if (elementText.includes('button')) score += 8;
        if (elementText.includes('upgrade')) score += 7;
      }

      // Achievement matching
      if (lowerDesc.includes('achievement')) {
        if (elementText.includes('achievement')) score += 10;
        if (elementText.includes('trophy')) score += 8;
        if (elementText.includes('badge')) score += 6;
      }

      // General text content matching
      if (score === 0) {
        // Look for partial word matches
        const descWords = lowerDesc.split(' ');
        for (const word of descWords) {
          if (word.length > 3 && elementText.includes(word)) {
            score += 3;
          }
        }
      }

      console.log(`  Vision element "${hotspot.element}" scored ${score} for "${gptDescription}"`);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = hotspot;
      }
    }

    if (bestMatch && bestScore > 0) {
      console.log(`✅ Best match for "${gptDescription}": "${bestMatch.element}" (score: ${bestScore})`);
      return bestMatch;
    }

    console.log(`❌ No good match found for "${gptDescription}"`);
    return null;
  };

  // MEMOIZED COORDINATE CALCULATION: Only calculate once per description
  const calculateAllCoordinates = useMemo(() => {
    if (!heatmapData?.hotspots || !imageSize) return {};
    
    const results: Record<string, any> = {};
    
    for (const description of attentionFlow) {
      results[description] = findVisionCoordinatesForDescription(description);
    }
    
    return results;
  }, [heatmapData, imageSize, attentionFlow]);

  // ACCURATE COORDINATE CONVERSION
  const convertVisionToDisplayCoordinates = (visionX: number, visionY: number) => {
    const img = document.querySelector('img[src="' + imageUrl + '"]') as HTMLImageElement;
    
    if (!img || !img.naturalWidth || !img.naturalHeight || !imageSize) {
      console.log('⚠️ Image dimensions not available, using fallback');
      return { left: '50%', top: '50%' };
    }

    // Convert Vision coordinates (from original image) to display percentages
    const leftPercent = (visionX / img.naturalWidth) * 100;
    const topPercent = (visionY / img.naturalHeight) * 100;

    console.log(`📐 Converting (${visionX}, ${visionY}) from ${img.naturalWidth}x${img.naturalHeight} to ${leftPercent.toFixed(1)}%, ${topPercent.toFixed(1)}%`);

    return {
      left: `${Math.min(Math.max(leftPercent, 2), 98)}%`,
      top: `${Math.min(Math.max(topPercent, 2), 98)}%`
    };
  };

  // SMART FALLBACK POSITIONING
  const getFallbackPosition = (index: number) => {
    const patterns = [
      { top: '20%', left: '30%' },
      { top: '70%', left: '50%' },
      { top: '30%', left: '10%' },
      { top: '10%', left: '85%' },
      { top: '50%', left: '70%' },
      { top: '80%', left: '25%' },
    ];
    return patterns[index % patterns.length];
  };

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        src={imageUrl}
        alt="Interface Analysis"
        className="w-full h-auto"
        onLoad={handleImageLoad}
        onError={(e: any) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwSDE1MFYxODBIMTUwVjEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHRleHQgeD0iMjAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
        }}
      />

      <AnimatePresence>
        {showHeatmap && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/20" />

            {attentionFlow.map((step, index) => {
              // Get pre-calculated coordinates
              const visionMatch = calculateAllCoordinates[step];
              
              let position;
              let hasRealCoordinates = false;
              
              if (visionMatch) {
                position = convertVisionToDisplayCoordinates(visionMatch.x, visionMatch.y);
                hasRealCoordinates = true;
              } else {
                position = getFallbackPosition(index);
                hasRealCoordinates = false;
              }

              const intensity = visionMatch ? Math.min(visionMatch.intensity + 0.2, 1.0) : (1 - index * 0.15);
              const isActive = isPlaying ? index === currentStep : true;
              const activeOpacity = isPlaying ? (index === currentStep ? 1 : 0.3) : 1;

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
                    scale: isActive ? 1 : 0.8,
                    opacity: activeOpacity
                  }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.5
                  }}
                >
                  {/* Large, soft circle instead of numbered dots */}
                  <div 
                    className="relative"
                    style={{
                      width: `${100 + intensity * 80}px`, // Bigger circles: 100-180px
                      height: `${100 + intensity * 80}px`,
                    }}
                  >
                    {/* Multiple opacity layers for soft effect */}
                    <div 
                      className="absolute inset-0 rounded-full blur-2xl"
                      style={{
                        backgroundColor: hasRealCoordinates 
                          ? `rgba(34, 197, 94, ${0.3 * intensity})` // Green for real coordinates
                          : `rgba(239, 68, 68, ${0.3 * intensity})` // Red for fallback
                      }}
                    />
                    <div 
                      className="absolute inset-4 rounded-full blur-xl"
                      style={{
                        backgroundColor: hasRealCoordinates
                          ? `rgba(34, 197, 94, ${0.4 * intensity})`
                          : `rgba(249, 115, 22, ${0.4 * intensity})`
                      }}
                    />
                    <div 
                      className="absolute inset-8 rounded-full blur-lg"
                      style={{
                        backgroundColor: hasRealCoordinates
                          ? `rgba(34, 197, 94, ${0.5 * intensity})`
                          : `rgba(250, 204, 21, ${0.5 * intensity})`
                      }}
                    />
                    
                    {/* Center indicator */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full ${
                        hasRealCoordinates ? 'bg-green-500' : 'bg-white'
                      } shadow-lg`}>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced tooltip */}
                  <motion.div
                    className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className={`text-sm px-4 py-3 rounded-lg max-w-[250px] text-center shadow-xl ${
                      hasRealCoordinates 
                        ? 'bg-green-900 text-green-100 border border-green-500' 
                        : 'bg-gray-900 text-white border border-gray-600'
                    }`}>
                      <div className="font-semibold">{step}</div>
                      {hasRealCoordinates && visionMatch && (
                        <div className="text-green-300 text-xs mt-1">
                          📍 Found: "{visionMatch.element}"
                        </div>
                      )}
                      {!hasRealCoordinates && (
                        <div className="text-yellow-300 text-xs mt-1">
                          ⚠️ Using pattern position
                        </div>
                      )}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-inherit rotate-45" />
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <motion.button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-lg ${
            showHeatmap 
              ? 'bg-red-600 text-white' 
              : 'bg-white/95 text-black hover:bg-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showHeatmap ? '🔥 HIDE HEATMAP' : '🎯 SMART HEATMAP'}
        </motion.button>

        {showHeatmap && (
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-white/95 text-black rounded-lg font-mono text-xs font-bold hover:bg-white transition-all shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? '⏸️ PAUSE' : '▶️ ANIMATE'}
          </motion.button>
        )}
      </div>

      {/* Enhanced Legend */}
      {showHeatmap && (
        <motion.div
          className="absolute bottom-4 left-4 bg-white/95 rounded-lg p-3 shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs font-mono font-bold mb-2 text-gray-800">INTELLIGENT HEATMAP</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Vision-located elements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span>Pattern-based positioning</span>
            </div>
          </div>
          {heatmapData?.hotspots && (
            <div className="text-xs text-gray-600 mt-2 font-mono">
              Analyzing {heatmapData.hotspots.length} detected elements
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}