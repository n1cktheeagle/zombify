'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModuleStrengthIndicatorProps {
  strength: number;
  moduleName?: string;
  compact?: boolean;
  className?: string;
}

export default function ModuleStrengthIndicator({ 
  strength, 
  moduleName,
  compact = false,
  className = ''
}: ModuleStrengthIndicatorProps) {
  const getStrengthColor = (s: number) => {
    if (s >= 4) return 'bg-green-500 border-green-600';
    if (s >= 3) return 'bg-yellow-500 border-yellow-600';
    if (s >= 2) return 'bg-orange-500 border-orange-600';
    return 'bg-red-500 border-red-600';
  };

  const getStrengthTextColor = (s: number) => {
    if (s >= 4) return 'text-green-600';
    if (s >= 3) return 'text-yellow-600';
    if (s >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (s: number) => {
    if (s >= 4) return 'HIGH';
    if (s >= 3) return 'MEDIUM';
    if (s >= 2) return 'LOW';
    return 'WEAK';
  };

  const formatModuleName = (name?: string) => {
    if (!name || typeof name !== 'string') return 'Module';
    // Convert camelCase to spaced title case
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Use compact version if requested
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {moduleName && (
          <span className="text-xs text-gray-600 font-mono">{formatModuleName(moduleName)}</span>
        )}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              className={`w-1.5 h-1.5 rounded-full border ${
                level <= strength 
                  ? getStrengthColor(strength)
                  : 'bg-gray-200 border-gray-300'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: level * 0.05, type: "spring", stiffness: 300 }}
            />
          ))}
        </div>
        <span className={`text-xs font-bold font-mono ${getStrengthTextColor(strength)}`}>
          {getStrengthLabel(strength)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        {moduleName && (
          <span className="text-sm font-medium text-gray-700 font-mono">
            {formatModuleName(moduleName)}
          </span>
        )}
        
        {/* Strength dots */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              className={`w-2 h-2 rounded-full border ${
                level <= strength 
                  ? getStrengthColor(strength)
                  : 'bg-gray-200 border-gray-300'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: level * 0.05, type: "spring", stiffness: 300 }}
            />
          ))}
        </div>
      </div>

      {/* Strength label */}
      <div className={`text-xs font-bold font-mono ${getStrengthTextColor(strength)}`}>
        {getStrengthLabel(strength)}
      </div>
    </div>
  );
}

// Compact version for use in smaller spaces
export function CompactModuleStrengthIndicator({ 
  strength, 
  moduleName,
  className = ''
}: ModuleStrengthIndicatorProps) {
  const getStrengthColor = (s: number) => {
    if (s >= 4) return 'text-green-500';
    if (s >= 3) return 'text-yellow-500';
    if (s >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-600 font-mono">{moduleName}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-1.5 h-1.5 rounded-full ${
              level <= strength 
                ? getStrengthColor(strength)
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}