'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import GlitchText from './GlitchText';
import CodeBlock from './CodeBlock';

// Define the issue types based on your analysis structure
interface CriticalIssue {
  severity: number;
  category: string;
  issue: string;
  location?: {
    element: string;
    region: string;
    coordinates?: { x: number; y: number };
    selector?: string;
  };
  impact: string;
  evidence?: string;
  fix: {
    immediate: string;
    better?: string;
    implementation?: string;
  };
}

interface UsabilityIssue {
  severity?: number;
  category?: string;
  issue: string;
  impact: string;
  fix?: {
    immediate?: string;
    better?: string;
    implementation?: string;
  };
}

interface IssueCardProps {
  issue: CriticalIssue | UsabilityIssue;
  index: number;
  type: 'critical' | 'usability';
  onLocationClick?: (location: any) => void;
  isPro?: boolean;
}

export default function IssueCard({ issue, index, type, onLocationClick, isPro = false }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCritical = 'severity' in issue && issue.severity !== undefined;
  const severity = isCritical ? (issue.severity ?? 2) : 2;

  const getSeverityConfig = (sev: number) => {
    switch (sev) {
      case 4:
        return {
          color: 'border-red-500 bg-red-900/10',
          glowColor: 'shadow-red-500/20',
          badge: 'bg-red-500 text-white',
          pulse: true,
          label: 'CRITICAL'
        };
      case 3:
        return {
          color: 'border-orange-500 bg-orange-900/10',
          glowColor: 'shadow-orange-500/20',
          badge: 'bg-orange-500 text-white',
          pulse: false,
          label: 'HIGH'
        };
      case 2:
        return {
          color: 'border-yellow-500 bg-yellow-900/10',
          glowColor: 'shadow-yellow-500/20',
          badge: 'bg-yellow-500 text-black',
          pulse: false,
          label: 'MEDIUM'
        };
      default:
        return {
          color: 'border-gray-500 bg-gray-900/10',
          glowColor: 'shadow-gray-500/20',
          badge: 'bg-gray-500 text-white',
          pulse: false,
          label: 'LOW'
        };
    }
  };

  const config = getSeverityConfig(severity);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
      filter: 'blur(4px)'
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut" as const
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  };

  const expandVariants = {
    collapsed: { height: 'auto', opacity: 1 },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <motion.div
      className={`
        border-2 rounded-lg p-4 backdrop-blur-sm font-mono
        ${config.color} ${config.glowColor} ${config.pulse ? 'animate-pulse' : ''}
        cursor-pointer select-none
        shadow-lg
      `}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <GlitchText 
            intensity={severity >= 4 ? 'high' : severity >= 3 ? 'medium' : 'low'}
            trigger={isHovered ? 'hover' : 'continuous'}
            className="text-lg font-bold"
          >
            {issue.issue}
          </GlitchText>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {/* Severity Badge */}
          <motion.span 
            className={`text-xs px-2 py-1 rounded font-bold ${config.badge}`}
            animate={severity >= 4 ? { scale: [1, 1.1, 1] } : undefined}
            transition={severity >= 4 ? { repeat: Infinity, duration: 2 } : undefined}
          >
            {type === 'critical' ? `SEV ${severity}` : config.label}
          </motion.span>
          
          {/* Expand Arrow */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-sm opacity-60"
          >
            ▼
          </motion.div>
        </div>
      </div>

      {/* Impact */}
      <p className="text-sm opacity-80 mb-3 leading-relaxed">
        {issue.impact}
      </p>

      {/* Location (if available and clickable) */}
      {isCritical && (issue as CriticalIssue).location && (
        <motion.div 
          className="flex items-center gap-2 mb-3 text-xs bg-black/20 rounded p-2 hover:bg-black/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onLocationClick?.((issue as CriticalIssue).location);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="opacity-60">📍</span>
          <span className="font-semibold">{(issue as CriticalIssue).location!.element}</span>
          <span className="opacity-40">•</span>
          <span className="opacity-60">{(issue as CriticalIssue).location!.region}</span>
          {(issue as CriticalIssue).location!.coordinates && (
            <>
              <span className="opacity-40">•</span>
              <span className="opacity-50 font-mono">
                {(issue as CriticalIssue).location!.coordinates!.x}, {(issue as CriticalIssue).location!.coordinates!.y}
              </span>
            </>
          )}
        </motion.div>
      )}

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="space-y-4 pt-3 border-t border-current/20"
          >
            {/* Evidence (if available) */}
            {isCritical && (issue as CriticalIssue).evidence && (
              <div className="bg-black/10 rounded p-3">
                <div className="text-xs font-bold mb-1 opacity-70">EVIDENCE</div>
                <div className="text-sm italic">{(issue as CriticalIssue).evidence}</div>
              </div>
            )}

            {/* Fixes */}
            {((isCritical && (issue as CriticalIssue).fix) || (issue as UsabilityIssue).fix) && (
              <div className="space-y-3">
                {/* Immediate Fix */}
                {(isCritical ? (issue as CriticalIssue).fix.immediate : (issue as UsabilityIssue).fix?.immediate) && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                    <div className="text-xs font-bold mb-2 text-blue-400">⚡ QUICK FIX</div>
                    <div className="text-sm">
                      {isCritical ? (issue as CriticalIssue).fix.immediate : (issue as UsabilityIssue).fix!.immediate}
                    </div>
                  </div>
                )}

                {/* Better Solution (Pro only) */}
                {(isCritical ? (issue as CriticalIssue).fix.better : (issue as UsabilityIssue).fix?.better) && (
                  <div className={`${isPro ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-500/10 border-gray-500/30'} border rounded p-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xs font-bold ${isPro ? 'text-green-400' : 'text-gray-400'}`}>
                        🚀 BETTER SOLUTION
                      </div>
                      {!isPro && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">PRO</span>
                      )}
                    </div>
                    <div className={`text-sm ${isPro ? '' : 'blur-sm'}`}>
                      {isPro 
                        ? (isCritical ? (issue as CriticalIssue).fix.better : (issue as UsabilityIssue).fix!.better)
                        : 'Upgrade to Pro to see advanced solutions'
                      }
                    </div>
                  </div>
                )}

                {/* Implementation Code */}
                {isCritical && (issue as CriticalIssue).fix.implementation && isPro && (
                  <CodeBlock 
                    code={(issue as CriticalIssue).fix.implementation!}
                    language="javascript"
                    title="Implementation"
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}