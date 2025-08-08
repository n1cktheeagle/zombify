'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PerceptionLayer, AttentionFlowItem } from '@/types/analysis';
import AttentionHeatmapDisplay from './AttentionHeatmapDisplay';

interface PerceptionDisplayProps {
  perceptionLayer?: PerceptionLayer;
  heatmapData?: any;
  imageUrl?: string;
  className?: string;
}

export default function PerceptionDisplay({ 
  perceptionLayer,
  heatmapData,
  imageUrl,
  className = ''
}: PerceptionDisplayProps) {
  if (!perceptionLayer) return null;
  
  const { primaryEmotion, clarityFlags, attentionFlow } = perceptionLayer;

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      trust: 'text-green-600 bg-green-50',
      excitement: 'text-blue-600 bg-blue-50',
      delight: 'text-purple-600 bg-purple-50',
      curiosity: 'text-indigo-600 bg-indigo-50',
      anticipation: 'text-cyan-600 bg-cyan-50',
      anxiety: 'text-orange-600 bg-orange-50',
      frustration: 'text-red-600 bg-red-50',
      confusion: 'text-yellow-600 bg-yellow-50',
      skepticism: 'text-gray-600 bg-gray-50'
    };
    return colors[emotion] || 'text-gray-600 bg-gray-50';
  };

  const getEmotionIcon = (emotion: string) => {
    const icons: { [key: string]: string } = {
      trust: '🤝',
      excitement: '⚡',
      delight: '✨',
      curiosity: '🤔',
      anticipation: '👀',
      anxiety: '😰',
      frustration: '😤',
      confusion: '😕',
      skepticism: '🤨'
    };
    return icons[emotion] || '🎭';
  };

  const getFocusWeightColor = (weight: string) => {
    switch (weight) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid layout for heatmap and attention flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Heatmap */}
        {heatmapData && (
          <div className="lg:col-span-1">
            <AttentionHeatmapDisplay 
              heatmapData={heatmapData}
              imageUrl={imageUrl}
            />
          </div>
        )}
        
        {/* Right Column or Full Width: Attention Flow */}
        <div className={heatmapData ? "lg:col-span-1" : "lg:col-span-2"}>
          {/* Attention Flow Card */}
          {attentionFlow && attentionFlow.length > 0 && (
            <motion.div 
              className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)] h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👁️</span>
                <h3 className="font-bold font-mono tracking-wider text-lg">
                  {heatmapData ? 'AI PREDICTED FLOW' : 'ATTENTION FLOW'}
                </h3>
              </div>
              
              <div className="space-y-3">
                {attentionFlow.slice(0, 5).map((item: AttentionFlowItem, index: number) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold font-mono">
                        {item.priority}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getFocusWeightColor(item.conversionImpact)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm font-mono mb-1">
                        {item.element}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {item.reasoning}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-blue-600">Time: {item.timeSpent}</span>
                        <span className={`font-bold ${
                          item.conversionImpact === 'HIGH' ? 'text-red-600' :
                          item.conversionImpact === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                          Impact: {item.conversionImpact}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Primary Emotion Card - Full Width Below */}
      <motion.div 
        className="bg-white border-2 border-black p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{getEmotionIcon(primaryEmotion.type)}</span>
          <div>
            <h3 className="font-bold font-mono tracking-wider text-lg">USER EMOTION</h3>
            <p className="text-sm text-gray-600 font-mono">Primary emotional response</p>
          </div>
        </div>
        
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${getEmotionColor(primaryEmotion.type)}`}>
          <span className="font-bold text-lg font-mono capitalize">
            {primaryEmotion.type}
          </span>
          <div className="text-sm font-mono">
            Intensity: {primaryEmotion.intensity}/10
          </div>
        </div>
        
        {/* Intensity Bar */}
        <div className="mt-3 mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className={`h-2 rounded-full ${primaryEmotion.intensity >= 7 ? 'bg-red-500' : 
                primaryEmotion.intensity >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${primaryEmotion.intensity * 10}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

    </div>
  );
}