'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttentionElement {
  order: number;
  description: string;
  reason: string;
  element: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AttentionHeatmapOverlayProps {
  imageUrl: string;
  attentionFlow: any[];
  className?: string;
  heatmapData?: {
    attentionElements?: AttentionElement[];
    detectedElements?: any[];
    imageBounds?: {
      width: number;
      height: number;
    };
  };
}

export default function AttentionHeatmapOverlay({ 
  imageUrl, 
  attentionFlow, 
  className = '',
  heatmapData
}: AttentionHeatmapOverlayProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    
    setImageSize({
      width: img.offsetWidth,
      height: img.offsetHeight
    });
    
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  // Get attention elements from new format or create from old format
  const getAttentionElements = (): AttentionElement[] => {
    console.log('[HEATMAP] Checking for attention elements:', {
      hasHeatmapData: !!heatmapData,
      hasAttentionElements: !!heatmapData?.attentionElements,
      attentionElementsCount: heatmapData?.attentionElements?.length || 0,
      attentionFlowCount: attentionFlow.length,
      attentionFlowSample: attentionFlow[0]
    });

    // If we have the new smart attention elements, use those
    if (heatmapData?.attentionElements && heatmapData.attentionElements.length > 0) {
      console.log('[HEATMAP] Using smart attention elements:', heatmapData.attentionElements);
      return heatmapData.attentionElements;
    }

    // Check if attentionFlow already has element data
    if (attentionFlow.length > 0 && attentionFlow[0].element) {
      console.log('[HEATMAP] Attention flow already has element data');
      return attentionFlow as AttentionElement[];
    }

    // FALLBACK: Create attention elements from detected elements
    if (heatmapData?.detectedElements && heatmapData.detectedElements.length > 0) {
      console.log('[HEATMAP] Creating attention flow from detected elements');
      
      // Find important UI elements based on text content and size
      const elements = [...heatmapData.detectedElements];
      const importantElements: AttentionElement[] = [];
      
      // 1. Find main action buttons
      const actionWords = ['equip', 'use', 'drop', 'sell', 'buy', 'craft', 'repair', 'upgrade'];
      const buttons = elements.filter(el => {
        const lower = el.text.toLowerCase();
        return actionWords.some(word => lower.includes(word));
      }).sort((a, b) => b.area - a.area);
      
      if (buttons.length > 0) {
        importantElements.push({
          order: 1,
          description: `Action button: ${buttons[0].text}`,
          reason: "Primary action for item interaction",
          element: buttons[0]
        });
      }
      
      // 2. Find inventory/bag indicators
      const inventoryElements = elements.filter(el => {
        const lower = el.text.toLowerCase();
        return lower.includes('bag') || lower.includes('inventory') || lower.includes('slots');
      });
      
      if (inventoryElements.length > 0) {
        importantElements.push({
          order: importantElements.length + 1,
          description: `Inventory: ${inventoryElements[0].text}`,
          reason: "Shows available storage space",
          element: inventoryElements[0]
        });
      }
      
      // 3. Find large text elements (likely important labels)
      const largeElements = elements
        .filter(el => el.area > 1000 && !importantElements.some(ie => ie.element.text === el.text))
        .sort((a, b) => b.area - a.area)
        .slice(0, 3);
      
      largeElements.forEach(el => {
        importantElements.push({
          order: importantElements.length + 1,
          description: `Key element: ${el.text}`,
          reason: "Prominent UI element",
          element: el
        });
      });
      
      return importantElements.slice(0, 5); // Return top 5 elements
    }

    // Otherwise, create simple elements from the text descriptions
    console.log('[HEATMAP] Creating fallback elements from text');
    return attentionFlow.map((item, index) => {
      let description = '';
      if (typeof item === 'string') {
        description = item;
      } else if (item.description) {
        description = item.description;
      }

      return {
        order: index + 1,
        description: description,
        reason: "Important UI element",
        element: {
          text: description,
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      };
    });
  };

  const elements = getAttentionElements();
  const hasRealCoordinates = elements.some(el => el.element.width > 0 && el.element.height > 0);

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Interface Analysis"
        className="w-full h-auto"
        onLoad={handleImageLoad}
        onError={(e: any) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0YzRjRGNiIvPjwvc3ZnPg==';
        }}
      />

      <AnimatePresence>
        {showHeatmap && imageSize && naturalSize && hasRealCoordinates && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-black/5" />

            {/* Attention elements with numbered markers */}
            {elements.filter(el => el.element.width > 0).map((item, index) => {
              const bounds = heatmapData?.imageBounds || naturalSize;
              const scaleX = imageSize.width / bounds.width;
              const scaleY = imageSize.height / bounds.height;
              
              const displayX = item.element.x * scaleX;
              const displayY = item.element.y * scaleY;
              const displayWidth = item.element.width * scaleX;
              const displayHeight = item.element.height * scaleY;
              
              // Calculate intensity based on order (1st = most intense)
              const intensity = 1 - (item.order - 1) * 0.15;
              const opacity = Math.max(0.3, Math.min(0.8, intensity));
              
              return (
                <motion.div
                  key={`attention-${index}`}
                  className="absolute"
                  style={{
                    left: `${displayX - displayWidth / 2}px`,
                    top: `${displayY - displayHeight / 2}px`,
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Highlight box */}
                  <div 
                    className="absolute inset-0 rounded"
                    style={{
                      background: `rgba(220, 38, 38, ${opacity * 0.3})`,
                      border: `2px solid rgba(220, 38, 38, ${opacity})`,
                      boxShadow: `0 0 20px rgba(220, 38, 38, ${opacity * 0.5})`
                    }}
                  />
                  
                  {/* Number indicator */}
                  <div 
                    className="absolute -top-3 -left-3 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                    style={{ zIndex: 10 - index }}
                  >
                    {item.order}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls and info */}
      <div className="absolute bottom-4 right-4 flex items-end gap-4">
        {/* Attention flow list - only show if we have real coordinates */}
        {showHeatmap && hasRealCoordinates && (
          <motion.div
            className="bg-white/95 rounded-lg p-4 shadow-lg max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xs font-mono font-bold mb-2">ATTENTION FLOW</div>
            <div className="space-y-2">
              {elements.slice(0, 5).map((item) => (
                <div key={item.order} className="flex gap-2 text-xs">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {item.order}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-gray-600 text-[10px]">{item.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
          {showHeatmap ? '🔥 HIDE HEATMAP' : '👁️ SHOW ATTENTION FLOW'}
        </motion.button>
      </div>

      {showHeatmap && !hasRealCoordinates && heatmapData?.detectedElements && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Show detected elements as a simple heatmap */}
          {heatmapData.detectedElements
            .filter(el => el.area > 500) // Only show reasonably sized elements
            .slice(0, 20) // Limit to 20 elements
            .map((element, index) => {
              const bounds = heatmapData?.imageBounds || naturalSize;
              const scaleX = imageSize!.width / bounds!.width;
              const scaleY = imageSize!.height / bounds!.height;
              
              const displayX = element.x * scaleX;
              const displayY = element.y * scaleY;
              const displayWidth = element.width * scaleX;
              const displayHeight = element.height * scaleY;
              
              const intensity = 0.3 + (element.area / 5000) * 0.5; // Larger = more intense
              
              return (
                <motion.div
                  key={`detected-${index}`}
                  className="absolute"
                  style={{
                    left: `${displayX - displayWidth / 2}px`,
                    top: `${displayY - displayHeight / 2}px`,
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <div 
                    className="absolute inset-0 rounded"
                    style={{
                      background: `rgba(220, 38, 38, ${Math.min(intensity * 0.3, 0.5)})`,
                      border: `1px solid rgba(220, 38, 38, ${Math.min(intensity, 0.8)})`
                    }}
                  />
                </motion.div>
              );
            })}
            
          <motion.div
            className="absolute top-4 left-4 bg-white/95 rounded-lg p-4 shadow-lg max-w-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-xs font-mono font-bold mb-2">DETECTED ELEMENTS</div>
            <div className="text-xs text-gray-600">
              Showing {Math.min(20, heatmapData.detectedElements.filter(el => el.area > 500).length)} of {heatmapData.detectedElements.length} detected elements
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Larger elements have higher intensity
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}