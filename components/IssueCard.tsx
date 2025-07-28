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
    visualContext?: string;
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
  location?: {
    element: string;
    region: string;
    visualContext?: string;
  };
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
  isPro?: boolean;
}

export default function IssueCard({ issue, index, type, isPro = false }: IssueCardProps) {
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
        zombify-card p-6 font-mono cursor-pointer select-none relative overflow-hidden
        ${severity >= 4 ? 'border-l-4 border-red-500' : severity >= 3 ? 'border-l-4 border-orange-500' : 'border-l-4 border-yellow-500'}
        group
      `}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Subtle background pattern for critical issues */}
      {severity >= 4 && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear"
          }}
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 50px,
              rgba(239, 68, 68, 0.02) 50px,
              rgba(239, 68, 68, 0.02) 52px
            )`
          }}
        />
      )}

      {/* Glitch overlay on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={isHovered ? {
          opacity: [0, 0.05, 0]
        } : {}}
        transition={{
          repeat: isHovered ? Infinity : 0,
          duration: 0.8
        }}
        style={{
          background: severity >= 4 ? 
            'linear-gradient(90deg, rgba(255,0,85,0.1) 0%, transparent 50%, rgba(0,255,255,0.1) 100%)' :
            'linear-gradient(90deg, rgba(0,255,255,0.1) 0%, transparent 50%, rgba(255,0,85,0.1) 100%)'
        }}
      />
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 flex items-start gap-4 relative z-10">
          {/* Zombify-style Warning Icon */}
          <motion.div 
            className="flex-shrink-0 mt-1"
            animate={severity >= 4 ? { 
              scale: [1, 1.05, 1]
            } : undefined}
            transition={severity >= 4 ? { 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            } : undefined}
          >
            {/* Terminal-style icon container */}
            <div className={`
              w-6 h-6 border border-current rounded flex items-center justify-center text-xs font-bold font-mono
              ${severity >= 4 ? 'text-red-600 bg-red-50' : 
                severity >= 3 ? 'text-orange-600 bg-orange-50' : 
                'text-yellow-600 bg-yellow-50'}
              relative overflow-hidden group-hover:bg-opacity-80 transition-all duration-200
            `}>
              !
              
              {/* Subtle scanline effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%']
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear"
                }}
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    currentColor 2px,
                    currentColor 3px
                  )`,
                  backgroundSize: '6px 100%',
                  opacity: 0.1
                }}
              />
            </div>
          </motion.div>
          
          <GlitchText 
            intensity={severity >= 4 ? 'high' : severity >= 3 ? 'medium' : 'low'}
            trigger={isHovered ? 'hover' : 'continuous'}
            className="text-lg font-bold"
          >
            {issue.issue}
          </GlitchText>
        </div>
        
        <div className="flex items-center gap-3 ml-4 relative z-10">
          {/* Severity Badge - Zombify Style */}
          <motion.div 
            className={`
              text-xs px-3 py-1 font-mono font-bold tracking-wider border relative overflow-hidden
              ${severity >= 4 ? 'bg-red-50 text-red-700 border-red-200' : 
                severity >= 3 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                'bg-yellow-50 text-yellow-700 border-yellow-200'}
              group-hover:bg-opacity-80 transition-all duration-200
            `}
            animate={severity >= 4 ? { 
              borderColor: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0.2)']
            } : undefined}
            transition={severity >= 4 ? { 
              repeat: Infinity, 
              duration: 2 
            } : undefined}
          >
            {type === 'critical' ? `SEV-${severity}` : config.label}
            
            {/* Subtle tech pattern */}
            {severity >= 4 && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear"
                }}
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,85,0.1) 50%, transparent 100%)',
                  width: '200%'
                }}
              />
            )}
          </motion.div>
          
          {/* Expand Arrow - Terminal Style */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-xs opacity-60 font-mono font-bold w-4 h-4 flex items-center justify-center border border-current/20 rounded hover:border-current/40 transition-colors duration-200"
          >
            ▼
          </motion.div>
        </div>
      </div>

      {/* Impact */}
      <div className="relative z-10">
        <p className="text-sm opacity-80 mb-4 leading-relaxed">
          {issue.impact}
        </p>

        {/* Location (simplified, non-clickable) */}
        {issue.location && (
          <motion.div 
            className="flex items-start gap-3 mb-4 text-xs bg-black/5 border border-black/10 rounded p-3 font-mono"
          >
            <div className="w-4 h-4 border border-current/30 rounded flex items-center justify-center text-xs opacity-60 flex-shrink-0 mt-0.5">
              📍
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">{issue.location.element}</div>
              <div className="opacity-60 text-xs">{issue.location.region}</div>
              {issue.location.visualContext && (
                <div className="opacity-50 italic mt-1 text-xs">{issue.location.visualContext}</div>
              )}
            </div>
          </motion.div>
        )}
      </div>

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
              <motion.div 
                className="bg-black/5 border border-black/10 rounded p-4 relative overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 border border-current/30 rounded flex items-center justify-center text-xs font-bold font-mono">
                    !
                  </div>
                  <div className="text-xs font-bold font-mono tracking-wider opacity-70">EVIDENCE</div>
                </div>
                <div className="text-sm italic opacity-80 font-mono">{(issue as CriticalIssue).evidence}</div>
              </motion.div>
            )}

            {/* Fixes */}
            {((isCritical && (issue as CriticalIssue).fix) || (issue as UsabilityIssue).fix) && (
              <div className="space-y-4">
                {/* Immediate Fix */}
                {(isCritical ? (issue as CriticalIssue).fix.immediate : (issue as UsabilityIssue).fix?.immediate) && (
                  <motion.div 
                    className="bg-cyan-50 border border-cyan-200 rounded p-4 relative overflow-hidden group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 border border-cyan-400 rounded flex items-center justify-center text-xs font-bold text-cyan-600">
                        ⚡
                      </div>
                      <div className="text-xs font-bold font-mono tracking-wider text-cyan-700">QUICK FIX</div>
                    </div>
                    <div className="text-sm font-mono opacity-90">
                      {isCritical ? (issue as CriticalIssue).fix.immediate : (issue as UsabilityIssue).fix!.immediate}
                    </div>
                    
                    {/* Subtle tech pattern */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-5"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          45deg,
                          transparent,
                          transparent 10px,
                          currentColor 10px,
                          currentColor 11px
                        )`
                      }}
                    />
                  </motion.div>
                )}

                {/* Better Solution (Pro only) */}
                {(isCritical ? (issue as CriticalIssue).fix.better : (issue as UsabilityIssue).fix?.better) && (
                  <motion.div 
                    className={`
                      border rounded p-4 relative overflow-hidden
                      ${isPro ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-300'}
                    `}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 border rounded flex items-center justify-center text-xs font-bold ${
                          isPro ? 'border-green-400 text-green-600' : 'border-gray-400 text-gray-600'
                        }`}>
                          🚀
                        </div>
                        <div className={`text-xs font-bold font-mono tracking-wider ${
                          isPro ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          ADVANCED SOLUTION
                        </div>
                      </div>
                      {!isPro && (
                        <span className="text-xs bg-black text-white px-2 py-1 rounded font-mono font-bold">PRO</span>
                      )}
                    </div>
                    <div className={`text-sm font-mono ${isPro ? 'opacity-90' : 'blur-sm opacity-60'}`}>
                      {isPro 
                        ? (isCritical ? (issue as CriticalIssue).fix.better : (issue as UsabilityIssue).fix!.better)
                        : 'Upgrade to Pro to access advanced optimization strategies'
                      }
                    </div>
                    
                    {/* Pro glow effect */}
                    {isPro && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-5"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            currentColor 10px,
                            currentColor 11px
                          )`
                        }}
                      />
                    )}
                  </motion.div>
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