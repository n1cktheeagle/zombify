'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';
import IssueCard from './IssueCard';
import GripScoreCard from './GripScoreCard';
import GenerationalRadarChart from './GenerationalRadarChart';
import VisualDesignAnalysisCard from './VisualDesignAnalysisCard';
import UXCopyAnalysisCard from './UXCopyAnalysisCard';
import VerdictCard from './VerdictCard';
import FeedbackSummary from './feedback/FeedbackSummary';

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
  imageUrl?: string;
};

type FeedbackDisplayProps = LegacyFeedbackDisplayProps | NewFeedbackDisplayProps;

// Type guard to check which props we have
function isNewFormat(props: FeedbackDisplayProps): props is NewFeedbackDisplayProps {
  return 'analysis' in props;
}

// Export tab types and tab array for use in parent - UPDATED WITH NEW STRUCTURE
export type FeedbackTabId = 'overview' | 'issues' | 'opportunities' | 'insights' | 'accessibility';

export const feedbackTabs = [
  { id: 'overview', label: 'OVERVIEW', getCount: () => 0 },
  { id: 'issues', label: 'ISSUES & FIXES', getCount: (a: ZombifyAnalysis) => a.criticalIssues.length + a.usabilityIssues.length },
  { id: 'opportunities', label: 'OPPORTUNITIES', getCount: (a: ZombifyAnalysis) => a.opportunities?.length || 0, pro: true },
  { id: 'insights', label: 'BEHAVIORAL INSIGHTS', getCount: (a: ZombifyAnalysis) => a.behavioralInsights?.length || 0, pro: true },
  { id: 'accessibility', label: 'ACCESSIBILITY', getCount: (a: ZombifyAnalysis) => {
    const audit = a.accessibilityAudit;
    if (!audit) return 0;
    if ('automated' in audit) return 0; // AutomatedAccessibilityAudit doesn't have criticalFailures
    return (audit as import('@/types/analysis').AccessibilityAudit).criticalFailures?.length || 0;
  }}
];

export default function FeedbackDisplay(props: FeedbackDisplayProps) {
  const [showImageComparison, setShowImageComparison] = useState(false);
  
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
  const { analysis, isLoggedIn = false, isPro = false, activeTab, setActiveTab, imageUrl } = props;
  
  // Type guard to check if it's a manual AccessibilityAudit
  const isManualAudit = (audit: any): audit is import('@/types/analysis').AccessibilityAudit => {
    return audit && !('automated' in audit);
  };

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
          <span>UX ANALYSIS ENGINE v2.1.0</span>
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
              {/* New Summary Section - Replaces old header, grip score, and verdict */}
              <FeedbackSummary 
                analysis={analysis}
                imageUrl={imageUrl}
              />

              {/* Compact Generational Analysis */}
              {analysis.generationalAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="border-2 border-black bg-[#f5f1e6] p-4 relative overflow-hidden"
                >
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
                </motion.div>
              )}

              {/* Analysis Cards Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Design Analysis */}
                {analysis.visualDesignAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <VisualDesignAnalysisCard visualDesign={analysis.visualDesignAnalysis} />
                  </motion.div>
                )}

                {/* UX Copy Analysis */}
                {analysis.uxCopyAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <UXCopyAnalysisCard uxCopy={analysis.uxCopyAnalysis} />
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* COMBINED Issues & Fixes Tab (Critical + Usability) */}
          {activeTab === 'issues' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2>
                      <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                        ISSUES & FIXES
                      </GlitchText>
                    </h2>
                  </div>
                  
                  {/* Side-by-side comparison toggle */}
                  {imageUrl && (
                    <motion.button
                      className="bg-black text-white px-4 py-2 rounded font-mono text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowImageComparison(!showImageComparison)}
                    >
                      {showImageComparison ? 'Hide' : 'Show'} Image Reference
                    </motion.button>
                  )}
                </div>
              </motion.div>
              
              {/* Side-by-side layout when enabled */}
              <div className={showImageComparison ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
                {/* Image reference panel */}
                {showImageComparison && imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:sticky lg:top-4 h-fit"
                  >
                    <div className="zombify-card p-4">
                      <h3 className="text-lg font-bold mb-3">Reference Image</h3>
                      <img 
                        src={imageUrl} 
                        alt="Reference" 
                        className="w-full rounded-lg border border-black/20"
                      />
                      <p className="text-xs opacity-60 mt-2 font-mono">
                        Refer to this image while reviewing issues
                      </p>
                    </div>
                  </motion.div>
                )}
                
                        {/* Issues list */}
        <div className="space-y-4">
          {/* Critical Issues */}
          {analysis.criticalIssues.map((issue, index) => (
            <IssueCard
              key={`critical-${index}`}
              issue={issue}
              index={index}
              type="critical"
              isPro={isPro}
            />
          ))}

          {/* Usability Issues */}
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
                + {analysis.usabilityIssues.length - 2} more issues detected
              </div>
              <button className="zombify-primary-button px-6 py-2 text-sm">
                SIGN UP TO VIEW ALL
              </button>
            </motion.div>
          )}

                  {/* No Issues State */}
                  {analysis.criticalIssues.length === 0 && analysis.usabilityIssues.length === 0 && (
                    <motion.div
                      className="text-center py-12 bg-green-50 border border-green-200 rounded-lg"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="text-6xl mb-4">✨</div>
                      <GlitchText className="text-xl font-bold mb-2" trigger="mount">
                        NO CRITICAL ISSUES DETECTED
                      </GlitchText>
                      <p className="text-sm opacity-70 font-mono">
                        Your design follows good UX practices
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
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
                <div className="flex justify-between items-start">
                  <div>
                    <h2>
                      <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                        OPPORTUNITIES
                      </GlitchText>
                    </h2>
                    <div className="text-sm opacity-70 font-mono">
                      Growth and improvement opportunities
                    </div>
                  </div>
                  
                  {/* Side-by-side comparison toggle */}
                  {isPro && imageUrl && (
                    <motion.button
                      className="bg-black text-white px-4 py-2 rounded font-mono text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowImageComparison(!showImageComparison)}
                    >
                      {showImageComparison ? 'Hide' : 'Show'} Image Reference
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {isPro ? (
                <div className={showImageComparison ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                  {/* Image reference panel */}
                  {showImageComparison && imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="lg:sticky lg:top-4 h-fit"
                    >
                      <div className="zombify-card p-4">
                        <h3 className="text-lg font-bold mb-3">Reference Image</h3>
                        <img 
                          src={imageUrl} 
                          alt="Reference" 
                          className="w-full rounded-lg border border-black/20"
                        />
                        <p className="text-xs opacity-60 mt-2 font-mono">
                          Refer to this image while reviewing opportunities
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Opportunities list */}
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
                        <div className="font-mono">No opportunities detected in this analysis</div>
                      </div>
                    )}
                  </div>
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
                        <h3>
          <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
            BEHAVIORAL INSIGHTS
          </GlitchText>
        </h3>
                <div className="text-sm opacity-70 font-mono">
                  User behavior patterns and psychology
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
                      <div className="font-mono">No behavioral insights detected</div>
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

          {/* Accessibility Audit - CLEANED UP, NO FAKE FEATURES */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  ACCESSIBILITY
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Visual accessibility analysis for static images
                </div>
              </motion.div>

              {analysis.accessibilityAudit ? (
                <>
                  {/* Accessibility Score Matrix */}
                  <motion.div 
                    className="zombify-card p-6 relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >

                    
                    <div className="relative z-10">
                      <div className="text-center mb-6">
                        <GlitchText className="text-xl font-bold mb-2" trigger="hover">
                          VISUAL ACCESSIBILITY ANALYSIS
                        </GlitchText>
                        <div className="font-mono text-sm opacity-70">Visual elements only - no alt text, keyboard nav, or screen reader analysis</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-3xl font-bold text-black mb-1">{analysis.accessibilityAudit.score}</div>
                          <div className="text-xs font-mono opacity-70">ACCESSIBILITY SCORE</div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-3xl font-bold text-black mb-1">VISUAL</div>
                          <div className="text-xs font-mono opacity-70">ANALYSIS TYPE</div>
                        </div>
                        <div className="text-center p-4 bg-white/50 rounded border border-black/10">
                          <div className="text-3xl font-bold text-black mb-1">{isManualAudit(analysis.accessibilityAudit) ? (analysis.accessibilityAudit.criticalFailures?.length || 0) : 0}</div>
                          <div className="text-xs font-mono opacity-70">VISUAL ISSUES</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Strengths and Weaknesses */}
                  {isManualAudit(analysis.accessibilityAudit) && (analysis.accessibilityAudit.strengths || analysis.accessibilityAudit.weaknesses) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {isManualAudit(analysis.accessibilityAudit) && analysis.accessibilityAudit.strengths && analysis.accessibilityAudit.strengths.length > 0 && (
                        <motion.div 
                          className="zombify-card p-6 relative overflow-hidden"
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
                            {analysis.accessibilityAudit.strengths!.map((strength: string, i: number) => (
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
                      
                      {isManualAudit(analysis.accessibilityAudit) && analysis.accessibilityAudit.weaknesses && analysis.accessibilityAudit.weaknesses.length > 0 && (
                        <motion.div 
                          className="zombify-card p-6 relative overflow-hidden"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">⚠️</div>
                            <GlitchText className="text-lg font-bold text-black" trigger="hover">
                              AREAS FOR IMPROVEMENT
                            </GlitchText>
                          </div>
                          <div className="space-y-2">
                            {analysis.accessibilityAudit.weaknesses!.map((weakness: string, i: number) => (
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

                  {/* Critical Failures - VISUAL ONLY */}
                  {isManualAudit(analysis.accessibilityAudit) && analysis.accessibilityAudit.criticalFailures && analysis.accessibilityAudit.criticalFailures.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">🎯</div>
                        <GlitchText className="text-2xl font-bold text-red-400" trigger="mount">
                          VISUAL ACCESSIBILITY ISSUES
                        </GlitchText>
                      </div>

                      {analysis.accessibilityAudit.criticalFailures!.map((failure: import('@/types/analysis').AccessibilityFailure, i: number) => (
                        <motion.div 
                          key={i} 
                          className="zombify-card p-6 relative overflow-hidden"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
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

                  {/* Priority Recommendations */}
                  {isManualAudit(analysis.accessibilityAudit) && analysis.accessibilityAudit.recommendations && analysis.accessibilityAudit.recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">🎛️</div>
                        <GlitchText className="text-2xl font-bold text-cyan-400" trigger="mount">
                          PRIORITY RECOMMENDATIONS
                        </GlitchText>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {['HIGH', 'MEDIUM', 'LOW'].map(priority => {
                          const priorityRecs = isManualAudit(analysis.accessibilityAudit) ? analysis.accessibilityAudit.recommendations!.filter((rec: any) => rec.priority === priority) : [];
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
                                <div className="text-sm opacity-70">{priorityRecs.length} action{priorityRecs.length !== 1 ? '&apos;s' : ''}</div>
                              </div>

                              <div className="space-y-3">
                                {priorityRecs.map((rec: any, i: number) => (
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
                  <div className="font-mono text-sm opacity-60">Accessibility analysis not available</div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}