'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  heatmapUrl?: string;
  clarityScore: number;
  attentionPercentages: Array<{
    region: string;
    percentage: number;
  }>;
  focusTime?: {
    aboveFold: number;
    belowFold: number;
    leftSide: number;
    rightSide: number;
    center: number;
  };
}

interface AttentionHeatmapDisplayProps {
  heatmapData?: HeatmapData;
  imageUrl?: string;
}

export default function AttentionHeatmapDisplay({ heatmapData, imageUrl }: AttentionHeatmapDisplayProps) {
  if (!heatmapData) return null;

  const getClarityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getClarityLabel = (score: number) => {
    if (score >= 80) return 'Excellent Focus';
    if (score >= 60) return 'Good Focus';
    return 'Scattered Attention';
  };

  return (
    <motion.div
      className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h3 className="font-bold font-mono text-sm tracking-wider">ATTENTION HEATMAP</h3>
        </div>
        <div className={`text-sm font-mono font-bold ${getClarityColor(heatmapData.clarityScore)}`}>
          {heatmapData.clarityScore}/100
        </div>
      </div>

      {/* Heatmap Image if available */}
      {heatmapData.heatmapUrl && (
        <div className="mb-4 relative">
          <img 
            src={heatmapData.heatmapUrl} 
            alt="Attention heatmap"
            className="w-full rounded border border-black/20"
          />
          <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
            HEATMAP VIEW
          </div>
        </div>
      )}

      {/* Clarity Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-mono opacity-60">Visual Clarity</span>
          <span className={`text-xs font-mono font-bold ${getClarityColor(heatmapData.clarityScore)}`}>
            {getClarityLabel(heatmapData.clarityScore)}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${
              heatmapData.clarityScore >= 80 ? 'bg-green-500' :
              heatmapData.clarityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${heatmapData.clarityScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Attention Distribution */}
      <div className="space-y-2 mb-4">
        <div className="text-xs font-mono font-semibold mb-2">ATTENTION DISTRIBUTION</div>
        {heatmapData.attentionPercentages.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-4 text-xs font-mono opacity-60">{index + 1}.</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono">{item.region}</span>
                <span className="text-xs font-mono font-bold">{item.percentage}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Focus Time Distribution */}
      {heatmapData.focusTime && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs font-mono font-semibold mb-2">FOCUS TIME DISTRIBUTION</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="opacity-60">Above Fold:</span>
              <span className="font-bold">{heatmapData.focusTime.aboveFold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Below Fold:</span>
              <span className="font-bold">{heatmapData.focusTime.belowFold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Center:</span>
              <span className="font-bold">{heatmapData.focusTime.center}%</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Edges:</span>
              <span className="font-bold">
                {100 - heatmapData.focusTime.center}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
        <div className="text-xs font-mono">
          {heatmapData.clarityScore < 60 ? (
            <span className="text-red-600">
              ⚠️ Users struggle to focus. Simplify visual hierarchy.
            </span>
          ) : heatmapData.clarityScore < 80 ? (
            <span className="text-yellow-600">
              ℹ️ Good focus pattern. Minor improvements possible.
            </span>
          ) : (
            <span className="text-green-600">
              ✓ Excellent attention flow. Users know where to look.
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}