'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';
import IssueCard from './IssueCard';
import GripScoreCard from './GripScoreCard';
import GenerationalRadarChart from './GenerationalRadarChart';
import VisualDesignAnalysisCard from './VisualDesignAnalysisCard';
import UXCopyAnalysisCard from './UXCopyAnalysisCard';

// Keep backward compatibility with old props
type LegacyFeedbackDisplayProps = {
  image_url: string;
  grip_score: number;
  feedback_chunks: { text: string; category: string }[];
};

// New props for comprehensive analysis
type NewFeedbackDisplayProps = {
  analysis: ZombifyAnalysis;
  isLoggedIn?: boolean;
  isPro?: boolean;
  activeTab: FeedbackTabId;
  setActiveTab: (tab: FeedbackTabId) => void;
};

type FeedbackDisplayProps = LegacyFeedbackDisplayProps | NewFeedbackDisplayProps;

// Type guard to check which props we have
function isNewFormat(props: FeedbackDisplayProps): props is NewFeedbackDisplayProps {
  return 'analysis' in props;
}

// Export tab types and tab array for use in parent - CLEANED UP
export type FeedbackTabId = 'overview' | 'critical' | 'opportunities' | 'insights' | 'accessibility' | 'competitive';

export const feedbackTabs = [
  { id: 'overview', label: 'OVERVIEW', getCount: () => 0 },
  { id: 'critical', label: 'CRITICAL SIGNALS', getCount: (a: ZombifyAnalysis) => a.criticalIssues.length + a.usabilityIssues.length },
  { id: 'opportunities', label: 'GROWTH VECTORS', getCount: (a: ZombifyAnalysis) => a.opportunities?.length || 0, pro: true },
  { id: 'insights', label: 'MIND PATTERNS', getCount: (a: ZombifyAnalysis) => a.behavioralInsights?.length || 0, pro: true },
  { id: 'accessibility', label: 'UNIVERSAL ACCESS', getCount: (a: ZombifyAnalysis) => a.accessibilityAudit?.criticalFailures?.length || 0 },
  { id: 'competitive', label: 'INTEL REPORT', getCount: (a: ZombifyAnalysis) => 1, pro: true }
];

export default function FeedbackDisplay(props: FeedbackDisplayProps) {
  // For new format, use props.activeTab and props.setActiveTab
  if (!isNewFormat(props)) {
    return (
      <motion.div 
        className="p-8 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img src={props.image_url} alt="Uploaded UI" className="w-full max-w-xl rounded" />
        <div className="text-xl font-bold">Grip Score: {props.grip_score}</div>
        <div className="space-y-4">
          {props.feedback_chunks.map((chunk, index) => (
            <div key={index} className="border p-4 rounded">
              <div className="text-sm text-gray-500">{chunk.category}</div>
              <div>{chunk.text}</div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }
  const { analysis, isLoggedIn = false, isPro = false, activeTab, setActiveTab } = props;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Terminal-style Header */}
      <motion.div 
        className="font-mono text-sm bg-black text-green-400 p-4 rounded border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="animate-pulse">●</span>
          <span>ZOMBIFY ANALYSIS ENGINE v2.1.0</span>
        </div>
        <div className="text-xs opacity-60">
          {analysis.context} • {analysis.industry} • Confidence: {Math.round(analysis.industryConfidence * 100)}%
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <GlitchText className="text-3xl font-bold mb-4" trigger="mount">
                  ANALYSIS OVERVIEW
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Complete UX assessment • {analysis.context} • {analysis.industry}
                </div>
              </motion.div>

              {/* Source Material Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="zombify-card p-6 scan-line relative overflow-hidden"
              >
                <div className="text-center mb-4">
                  <GlitchText className="text-xl font-bold mb-2" trigger="hover">
                    SOURCE MATERIAL
                  </GlitchText>
                  <div className="text-sm opacity-60 font-mono">Original interface scan</div>
                </div>
                
                {/* This would contain the uploaded image - placeholder for now */}
                <div className="bg-black/5 border border-black/10 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">🖼️</div>
                  <div className="text-sm font-mono opacity-70">Uploaded interface image</div>
                </div>
                
                {/* Scanning line effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none"
                  animate={{
                    y: ['-100%', '100%']
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "linear"
                  }}
                  style={{ height: '20px' }}
                />
              </motion.div>

              {/* Main Analysis Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grip Score Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <GripScoreCard 
                    gripScore={analysis.gripScore} 
                    showBreakdown={true}
                  />
                </motion.div>

                {/* Generational Radar Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="zombify-card p-6 scan-line relative overflow-hidden">
                    {analysis.generationalAnalysis ? (
                      <GenerationalRadarChart
                        scores={{
                          genAlpha: analysis.generationalAnalysis.scores.genAlpha || { score: 0, reasoning: 'No data' },
                          genZ: analysis.generationalAnalysis.scores.genZ || { score: 0, reasoning: 'No data' },
                          millennials: analysis.generationalAnalysis.scores.millennials || { score: 0, reasoning: 'No data' },
                          genX: analysis.generationalAnalysis.scores.genX || { score: 0, reasoning: 'No data' },
                          boomers: analysis.generationalAnalysis.scores.boomers || { score: 0, reasoning: 'No data' }
                        }}
                        primaryTarget={analysis.generationalAnalysis.primaryTarget || 'millennials'}
                      />
                    ) : (
                      <div className="text-center p-8">
                        <div className="text-4xl mb-4">📊</div>
                        <div className="text-sm font-mono opacity-70">Generational data unavailable</div>
                      </div>
                    )}

                    {/* Scanning line effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/10 to-transparent pointer-events-none"
                      animate={{
                        y: ['-100%', '100%']
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "linear"
                      }}
                      style={{ height: '20px' }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Analysis Cards Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Visual Design Analysis */}
                {analysis.visualDesignAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <VisualDesignAnalysisCard visualDesign={analysis.visualDesignAnalysis} />
                  </motion.div>
                )}

                {/* UX Copy Analysis */}
                {analysis.uxCopyAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <UXCopyAnalysisCard uxCopy={analysis.uxCopyAnalysis} />
                  </motion.div>
                )}
              </div>

              {/* Badges Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <GlitchText className="text-xl font-bold mb-4" trigger="hover">
                  ANALYSIS BADGES
                </GlitchText>
                <div className="flex justify-center gap-4">
                  {/* Placeholder badges - these would be dynamic based on analysis */}
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    SOCIAL (85% CERTAINTY)
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    CONVERSION READY
                  </div>
                </div>
              </motion.div>

              {/* Quick Action Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="zombify-card p-6 scan-line relative overflow-hidden"
              >
                <div className="text-center mb-6">
                  <GlitchText className="text-xl font-bold mb-2" trigger="hover">
                    IMMEDIATE ACTION ITEMS
                  </GlitchText>
                  <div className="text-sm opacity-70 font-mono">Priority fixes and opportunities</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Critical Issues Preview */}
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2 text-red-800">Critical Issues</h5>
                    <div className="text-2xl font-bold text-red-600 mb-2">{analysis.criticalIssues.length}</div>
                    <div className="text-xs opacity-60 mb-3">Issues requiring immediate attention</div>
                    {analysis.criticalIssues.slice(0, 2).map((issue, i) => (
                      <div key={i} className="text-sm mb-2 last:mb-0">
                        • {issue.issue}
                      </div>
                    ))}
                  </div>

                  {/* Opportunities Preview */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2 text-green-800">Quick Wins</h5>
                    <div className="text-2xl font-bold text-green-600 mb-2">{analysis.opportunities?.length || 0}</div>
                    <div className="text-xs opacity-60 mb-3">Low-effort, high-impact improvements</div>
                    {analysis.opportunities?.slice(0, 2).map((opp, i) => (
                      <div key={i} className="text-sm mb-2 last:mb-0">
                        • {opp.opportunity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scanning line effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/10 to-transparent pointer-events-none"
                  animate={{
                    y: ['-100%', '100%']
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "linear"
                  }}
                  style={{ height: '20px' }}
                />
              </motion.div>
            </div>
          )}

          {/* Critical Issues & Usability Tab */}
          {activeTab === 'critical' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  CRITICAL ANOMALIES
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  System-breaking patterns and usability issues
                </div>
              </motion.div>
              
              {analysis.criticalIssues.length > 0 && (
                <div className="space-y-4">
                  {analysis.criticalIssues.map((issue, index) => (
                    <IssueCard
                      key={`critical-${index}`}
                      issue={issue}
                      index={index}
                      type="critical"
                      isPro={isPro}
                    />
                  ))}
                </div>
              )}

              {analysis.usabilityIssues.length > 0 && (
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                      USABILITY FRICTION
                    </GlitchText>
                    <div className="text-sm opacity-70 font-mono">
                      User experience barriers
                    </div>
                  </motion.div>
                  
                  <div className="space-y-4">
                    {analysis.usabilityIssues.slice(0, isLoggedIn ? undefined : 2).map((issue, index) => (
                      <IssueCard
                        key={`usability-${index}`}
                        issue={issue}
                        index={index + analysis.criticalIssues.length}
                        type="usability"
                        isPro={isPro}
                      />
                    ))}
                    
                    {!isLoggedIn && analysis.usabilityIssues.length > 2 && (
                      <motion.div
                        className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="font-mono text-sm opacity-70 mb-2">
                          + {analysis.usabilityIssues.length - 2} more signals detected
                        </div>
                        <button className="zombify-primary-button px-6 py-2 text-sm">
                          SIGN UP TO DECODE ALL
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Growth Opportunities */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  GROWTH VECTORS
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Revenue amplification opportunities
                </div>
              </motion.div>

              {isPro ? (
                <div className="space-y-4">
                  {analysis.opportunities?.map((opp, index) => (
                    <motion.div
                      key={index}
                      className="border-2 border-green-500 bg-green-500/5 p-6 rounded-lg backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-lg">{opp.opportunity}</h4>
                        <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                          {opp.potentialImpact}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 mb-4">{opp.reasoning}</p>
                      {opp.implementation && (
                        <div className="bg-green-100 p-3 rounded text-sm">
                          <strong>Implementation:</strong> {opp.implementation}
                        </div>
                      )}
                    </motion.div>
                  )) || (
                    <div className="text-center py-12 opacity-60">
                      <div className="text-4xl mb-4">🎯</div>
                      <div className="font-mono">No growth opportunities detected in this analysis</div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  className="text-center py-12 border-2 border-purple-300 rounded-lg bg-purple-50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-bold mb-2">Unlock Growth Intelligence</h3>
                  <p className="text-sm mb-4 max-w-md mx-auto opacity-70">
                    Discover revenue-boosting opportunities and conversion optimizations
                  </p>
                  <button className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700">
                    UPGRADE TO PRO
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Behavioral Insights */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  MIND PATTERNS
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Psychological behavior analysis
                </div>
              </motion.div>

              {isPro ? (
                <div className="space-y-4">
                  {analysis.behavioralInsights?.map((insight, index) => (
                    <motion.div
                      key={index}
                      className="border-2 border-purple-500 bg-purple-500/5 p-6 rounded-lg backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <h4 className="font-bold text-lg mb-2">{insight.pattern}</h4>
                      <p className="text-sm opacity-80 mb-3">{insight.observation}</p>
                      <div className="bg-purple-100 p-3 rounded mb-3">
                        <p className="text-xs font-semibold mb-1">Psychology:</p>
                        <p className="text-sm italic">{insight.psychology}</p>
                      </div>
                      <div className="bg-purple-200 p-3 rounded">
                        <p className="text-xs font-semibold mb-1">Recommendation:</p>
                        <p className="text-sm">{insight.recommendation}</p>
                      </div>
                    </motion.div>
                  )) || (
                    <div className="text-center py-12 opacity-60">
                      <div className="text-4xl mb-4">🧠</div>
                      <div className="font-mono">No behavioral patterns detected</div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  className="text-center py-12 border-2 border-purple-300 rounded-lg bg-purple-50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-lg font-bold mb-2">Decode User Psychology</h3>
                  <p className="text-sm mb-4 max-w-md mx-auto opacity-70">
                    Understand the psychological triggers affecting user behavior
                  </p>
                  <button className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700">
                    UPGRADE TO PRO
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Enhanced Accessibility Audit - NO HIGHLIGHT BUTTONS */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  UNIVERSAL ACCESS
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  WCAG compliance & inclusivity analysis
                </div>
              </motion.div>

              {analysis.accessibilityAudit ? (
                <>
                  {/* Enhanced Accessibility Score Matrix */}
                  <motion.div 
                    className="zombify-card p-6 scan-line relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {/* Scanning line effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "linear"
                      }}
                      style={{ width: '30%', height: '100%' }}
                    />
                    
                    <div className="relative z-10">
                      <div className="text-center mb-6">
                        <GlitchText className="text-xl font-bold mb-2" trigger="hover">
                          ACCESSIBILITY MATRIX
                        </GlitchText>
                        <div className="font-mono text-sm opacity-70">Real-time compliance monitoring</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-3xl font-bold text-black mb-1">{analysis.accessibilityAudit.score}</div>
                          <div className="text-xs font-mono opacity-70">ACCESSIBILITY SCORE</div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-3xl font-bold text-black mb-1">WCAG {analysis.accessibilityAudit.wcagLevel}</div>
                          <div className="text-xs font-mono opacity-70">COMPLIANCE LEVEL</div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-3xl font-bold text-black mb-1">{analysis.accessibilityAudit.criticalFailures?.length || 0}</div>
                          <div className="text-xs font-mono opacity-70">CRITICAL ISSUES</div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-lg font-bold text-black mb-1">{analysis.accessibilityAudit.keyboardNav}</div>
                          <div className="text-xs font-mono opacity-70">KEYBOARD NAV</div>
                        </div>
                      </div>

                      {/* Enhanced Mobile & Screen Reader Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/50 border border-black/10 p-4 rounded">
                          <div className="text-sm font-bold text-black mb-2">📱 MOBILE ACCESSIBILITY</div>
                          <div className="text-sm font-mono opacity-70">
                            {analysis.accessibilityAudit.mobileAccessibility || 'Not analyzed'}
                          </div>
                        </div>
                        <div className="bg-white/50 border border-black/10 p-4 rounded">
                          <div className="text-sm font-bold text-black mb-2">🔊 SCREEN READER</div>
                          <div className="text-sm font-mono opacity-70">
                            {analysis.accessibilityAudit.screenReaderCompat}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Strengths and Weaknesses Matrix */}
                  {(analysis.accessibilityAudit.strengths || analysis.accessibilityAudit.weaknesses) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {analysis.accessibilityAudit.strengths && analysis.accessibilityAudit.strengths.length > 0 && (
                        <motion.div 
                          className="zombify-card p-6 scan-line relative overflow-hidden"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">✅</div>
                            <GlitchText className="text-lg font-bold text-black" trigger="hover">
                              ACCESSIBILITY STRENGTHS
                            </GlitchText>
                          </div>
                          <div className="space-y-2">
                            {analysis.accessibilityAudit.strengths.map((strength, i) => (
                              <motion.div 
                                key={i} 
                                className="flex items-start gap-3 p-3 bg-white/50 rounded border border-black/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <div className="text-green-600 text-sm">▶</div>
                                <div className="text-sm font-mono opacity-80">{strength}</div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {analysis.accessibilityAudit.weaknesses && analysis.accessibilityAudit.weaknesses.length > 0 && (
                        <motion.div 
                          className="zombify-card p-6 scan-line relative overflow-hidden"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">⚠️</div>
                            <GlitchText className="text-lg font-bold text-black" trigger="hover">
                              VULNERABILITY POINTS
                            </GlitchText>
                          </div>
                          <div className="space-y-2">
                            {analysis.accessibilityAudit.weaknesses.map((weakness, i) => (
                              <motion.div 
                                key={i} 
                                className="flex items-start gap-3 p-3 bg-white/50 rounded border border-black/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <div className="text-red-600 text-sm">▶</div>
                                <div className="text-sm font-mono opacity-80">{weakness}</div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Critical Failures - NO HIGHLIGHT BUTTONS */}
                  {analysis.accessibilityAudit.criticalFailures?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">🎯</div>
                        <GlitchText className="text-2xl font-bold text-red-400" trigger="mount">
                          CRITICAL ACCESSIBILITY BREACHES
                        </GlitchText>
                      </div>

                      {analysis.accessibilityAudit.criticalFailures.map((failure, i) => (
                        <motion.div 
                          key={i} 
                          className="zombify-card p-6 scan-line relative overflow-hidden"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          {/* Glitch effect background */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none"
                            animate={{
                              opacity: [0, 0.3, 0],
                              x: ['-100%', '100%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3
                            }}
                          />

                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="text-xl">🚨</div>
                                  <div className="font-bold text-lg text-black">{failure.criterion}</div>
                                </div>
                                <div className="text-black mb-2 font-mono text-sm opacity-80">{failure.issue}</div>
                                <div className="text-xs font-mono opacity-60">
                                  📍 {failure.location?.selector || failure.location?.element}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-red-50 border border-red-200 p-4 rounded">
                                <div className="text-xs text-red-600 font-bold mb-1">CURRENT VALUE</div>
                                <div className="text-sm font-mono text-red-700">{failure.currentValue}</div>
                              </div>
                              <div className="bg-green-50 border border-green-200 p-4 rounded">
                                <div className="text-xs text-green-600 font-bold mb-1">REQUIRED VALUE</div>
                                <div className="text-sm font-mono text-green-700">{failure.requiredValue}</div>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                              <div className="text-xs text-blue-600 font-bold mb-2">🔧 REMEDIATION</div>
                              <div className="text-sm font-mono text-blue-700">{failure.fix}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Enhanced Priority Recommendations Matrix */}
                  {analysis.accessibilityAudit.recommendations?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">🎛️</div>
                        <GlitchText className="text-2xl font-bold text-cyan-400" trigger="mount">
                          PRIORITY REMEDIATION MATRIX
                        </GlitchText>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {['HIGH', 'MEDIUM', 'LOW'].map(priority => {
                          const priorityRecs = analysis.accessibilityAudit!.recommendations!.filter(rec => rec.priority === priority);
                          if (priorityRecs.length === 0) return null;

                          const priorityColors = {
                            HIGH: { bg: 'from-red-900/30 to-red-800/20', border: 'border-red-500/40', text: 'text-red-400', accent: 'bg-red-600' },
                            MEDIUM: { bg: 'from-orange-900/30 to-orange-800/20', border: 'border-orange-500/40', text: 'text-orange-400', accent: 'bg-orange-600' },
                            LOW: { bg: 'from-blue-900/30 to-blue-800/20', border: 'border-blue-500/40', text: 'text-blue-400', accent: 'bg-blue-600' }
                          };

                          const colors = priorityColors[priority as keyof typeof priorityColors];

                          return (
                            <motion.div
                              key={priority}
                              className={`bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-lg p-4 relative overflow-hidden`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Object.keys(priorityColors).indexOf(priority) * 0.2 }}
                            >
                              <div className={`text-center mb-4 ${colors.text}`}>
                                <div className="text-lg font-bold font-mono">{priority} PRIORITY</div>
                                <div className="text-sm opacity-70">{priorityRecs.length} action{priorityRecs.length !== 1 ? 's' : ''}</div>
                              </div>

                              <div className="space-y-3">
                                {priorityRecs.map((rec, i) => (
                                  <motion.div
                                    key={i}
                                    className={`p-3 rounded border-l-4 ${colors.border} bg-black/20`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                  >
                                    <div className="text-sm font-medium mb-2">{rec.action}</div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className={`${colors.accent} text-white px-2 py-1 rounded font-mono`}>
                                        {rec.effort} EFFORT
                                      </span>
                                      <span className="opacity-70 font-mono">#{i + 1}</span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  className="text-center py-12 bg-gradient-to-br from-gray-900/20 to-gray-800/20 border-2 border-gray-500/30 rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-6xl mb-4">♿</div>
                  <GlitchText className="text-xl font-bold mb-2" trigger="mount">
                    NO ACCESSIBILITY DATA
                  </GlitchText>
                  <div className="font-mono text-sm opacity-60">Analysis module offline</div>
                </motion.div>
              )}
            </div>
          )}

          {/* Enhanced Competitive Analysis Tab */}
          {activeTab === 'competitive' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  COMPETITIVE INTELLIGENCE
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Market positioning & benchmark analysis
                </div>
              </motion.div>

              {isPro && analysis.competitiveAnalysis ? (
                <>
                  {/* Enhanced Conversion Benchmarks */}
                  {analysis.competitiveAnalysis.conversionBenchmarks && (
                    <motion.div
                      className="zombify-card p-6 scan-line relative overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      {/* Scanning line effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none"
                        animate={{
                          x: ['-100%', '100%']
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: "linear"
                        }}
                        style={{ width: '30%', height: '100%' }}
                      />

                      <div className="relative z-10">
                        <div className="text-center mb-6">
                          <GlitchText className="text-xl font-bold mb-2" trigger="hover">
                            CONVERSION INTELLIGENCE MATRIX
                          </GlitchText>
                          <div className="font-mono text-sm opacity-70">Performance vs industry standards</div>
                        </div>

                        {/* Benchmark Comparison Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                          {/* Your Performance */}
                          <motion.div
                            className="text-center p-6 bg-white/50 border border-black/10 rounded-lg relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="text-2xl mb-3">🎯</div>
                            <div className="text-3xl font-bold text-black mb-2">
                              {analysis.competitiveAnalysis.conversionBenchmarks.yourEstimated.rate}
                            </div>
                            <div className="text-sm font-mono mb-3 opacity-70">YOUR ESTIMATED</div>
                            <div className="text-xs opacity-60 font-mono">
                              {analysis.competitiveAnalysis.conversionBenchmarks.yourEstimated.reasoning}
                            </div>
                          </motion.div>

                          {/* Industry Average */}
                          <motion.div
                            className="text-center p-6 bg-white/50 border border-black/10 rounded-lg relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="text-2xl mb-3">📊</div>
                            <div className="text-3xl font-bold text-black mb-2">
                              {analysis.competitiveAnalysis.conversionBenchmarks.industryAverage.rate}
                            </div>
                            <div className="text-sm font-mono mb-3 opacity-70">INDUSTRY AVG</div>
                            <div className="text-xs opacity-60 font-mono">
                              Source: {analysis.competitiveAnalysis.conversionBenchmarks.industryAverage.source}
                            </div>
                          </motion.div>

                          {/* Top Performers */}
                          <motion.div
                            className="text-center p-6 bg-white/50 border border-black/10 rounded-lg relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="text-2xl mb-3">🏆</div>
                            <div className="text-3xl font-bold text-black mb-2">
                              {analysis.competitiveAnalysis.conversionBenchmarks.topPerformers.rate}
                            </div>
                            <div className="text-sm font-mono mb-3 opacity-70">TOP PERFORMERS</div>
                            <div className="text-xs opacity-60">
                              Industry leaders in conversion optimization
                            </div>
                          </motion.div>
                        </div>

                        {/* Visual Comparison Bar */}
                        <div className="mb-6">
                          <div className="text-center mb-4">
                            <div className="text-lg font-bold text-purple-400 mb-2">PERFORMANCE COMPARISON</div>
                            <div className="font-mono text-sm opacity-70">Relative positioning analysis</div>
                          </div>
                          
                          <div className="space-y-3">
                            {[
                              { label: 'Your Design', rate: analysis.competitiveAnalysis.conversionBenchmarks.yourEstimated.rate, color: 'blue' },
                              { label: 'Industry Average', rate: analysis.competitiveAnalysis.conversionBenchmarks.industryAverage.rate, color: 'orange' },
                              { label: 'Top Performers', rate: analysis.competitiveAnalysis.conversionBenchmarks.topPerformers.rate, color: 'green' }
                            ].map((item, index) => {
                              const percentage = parseFloat(item.rate.replace('%', ''));
                              const maxPercentage = 15; // Assuming max reasonable conversion rate for visualization
                              const width = Math.min((percentage / maxPercentage) * 100, 100);
                              
                              const colorMap = {
                                blue: 'bg-blue-500',
                                orange: 'bg-orange-500', 
                                green: 'bg-green-500'
                              };

                              return (
                                <motion.div
                                  key={index}
                                  className="flex items-center gap-4"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <div className="w-24 text-sm font-mono text-right">{item.label}</div>
                                  <div className="flex-1 bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                    <motion.div
                                      className={`h-full ${colorMap[item.color as keyof typeof colorMap]} rounded-full relative`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${width}%` }}
                                      transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                                    >
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        animate={{
                                          x: ['-100%', '100%']
                                        }}
                                        transition={{
                                          repeat: Infinity,
                                          duration: 2,
                                          ease: "linear",
                                          delay: index * 0.3
                                        }}
                                      />
                                    </motion.div>
                                  </div>
                                  <div className="w-16 text-sm font-bold text-right">{item.rate}</div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Improvement Potential */}
                        <motion.div
                          className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 border border-cyan-500/30 p-4 rounded-lg text-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          <div className="text-lg font-bold text-cyan-400 mb-2">💡 IMPROVEMENT POTENTIAL</div>
                          <div className="text-sm font-mono">
                            {analysis.competitiveAnalysis.conversionBenchmarks.improvementPotential}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Top Performer Characteristics */}
                  {analysis.competitiveAnalysis.conversionBenchmarks?.topPerformers?.characteristics && (
                    <motion.div
                      className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-2 border-green-500/30 p-6 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">🏆</div>
                        <GlitchText className="text-xl font-bold text-green-400" trigger="hover">
                          TOP PERFORMER DNA
                        </GlitchText>
                      </div>
                      <div className="text-sm font-mono text-green-300 mb-4">
                        Common traits of industry-leading designs
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.competitiveAnalysis.conversionBenchmarks.topPerformers.characteristics.map((characteristic, i) => (
                          <motion.div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-green-900/20 rounded border border-green-400/20"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="text-green-400 text-sm">▶</div>
                            <div className="text-sm text-green-300 font-mono">{characteristic}</div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Competitive Strengths vs Weaknesses Matrix */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <motion.div 
                      className="zombify-card p-6 scan-line relative overflow-hidden"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">💪</div>
                        <GlitchText className="text-lg font-bold text-black" trigger="hover">
                          COMPETITIVE ADVANTAGES
                        </GlitchText>
                      </div>
                      <div className="space-y-3">
                        {analysis.competitiveAnalysis.strengths.map((strength, i) => (
                          <motion.div
                            key={i}
                            className="p-4 bg-white/50 rounded border border-black/10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="font-medium text-sm text-black mb-2">
                              {typeof strength === 'string' ? strength : strength.finding}
                            </div>
                            {typeof strength === 'object' && (
                              <>
                                <div className="text-xs text-green-600 mb-1">Evidence:</div>
                                <div className="text-xs opacity-70 font-mono mb-2">{strength.evidence}</div>
                                <div className="text-xs bg-green-50 border border-green-200 p-2 rounded">
                                  <strong>Advantage:</strong> {strength.competitiveAdvantage}
                                </div>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Weaknesses */}
                    <motion.div 
                      className="zombify-card p-6 scan-line relative overflow-hidden"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">🎯</div>
                        <GlitchText className="text-lg font-bold text-black" trigger="hover">
                          OPPORTUNITY GAPS
                        </GlitchText>
                      </div>
                      <div className="space-y-3">
                        {analysis.competitiveAnalysis.weaknesses.map((weakness, i) => (
                          <motion.div
                            key={i}
                            className="p-4 bg-white/50 rounded border border-black/10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="font-medium text-sm text-black mb-2">
                              {typeof weakness === 'string' ? weakness : weakness.finding}
                            </div>
                            {typeof weakness === 'object' && (
                              <>
                                <div className="text-xs text-red-600 mb-1">Evidence:</div>
                                <div className="text-xs opacity-70 font-mono mb-2">{weakness.evidence}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div className="bg-red-50 border border-red-200 p-2 rounded">
                                    <strong>Impact:</strong> {weakness.impact}
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                                    <strong>Fix:</strong> {weakness.fix}
                                  </div>
                                </div>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Legacy Benchmarks (Fallback) */}
                  {!analysis.competitiveAnalysis.conversionBenchmarks && analysis.competitiveAnalysis.benchmarks && (
                    <motion.div 
                      className="bg-gradient-to-r from-gray-900/30 to-gray-800/20 border-2 border-gray-500/40 rounded-lg p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h4 className="font-semibold mb-3 text-center">Industry Benchmarks</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-orange-400">
                            {analysis.competitiveAnalysis.benchmarks.industryAvgConversion}
                          </div>
                          <div className="text-xs opacity-60">Industry Average</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-400">
                            {analysis.competitiveAnalysis.benchmarks.topPerformerConversion}
                          </div>
                          <div className="text-xs opacity-60">Top Performers</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">
                            {analysis.competitiveAnalysis.benchmarks.yourEstimatedConversion}
                          </div>
                          <div className="text-xs opacity-60">Your Estimate</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  className="text-center py-12 border-2 border-purple-300 rounded-lg bg-gradient-to-br from-purple-900/20 to-purple-800/20"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-6xl mb-4">🔒</div>
                  <GlitchText className="text-xl font-bold mb-2" trigger="mount">
                    COMPETITIVE INTELLIGENCE
                  </GlitchText>
                  <p className="text-sm mb-4 max-w-md mx-auto opacity-70 font-mono">
                    Compare your design against industry leaders and conversion benchmarks
                  </p>
                  <button className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700 font-mono">
                    UPGRADE TO PRO
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}