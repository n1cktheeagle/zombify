'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from './GlitchText';
import IssueCard from './IssueCard';
import CodeBlock from './CodeBlock';

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

// Export tab types and tab array for use in parent
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

  const handleLocationClick = (location: any) => {
    // Here you could implement image annotation overlay
    console.log('Location clicked:', location);
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
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  OVERVIEW
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Key metrics and insights from the analysis
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="bg-blue-50 border border-blue-200 p-6 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h4 className="font-semibold mb-2 text-blue-800">Grip Score</h4>
                  <div className="text-4xl font-bold">{analysis.gripScore.overall}/100</div>
                  <div className="text-xs opacity-60 mt-2">Overall user engagement and satisfaction</div>
                </motion.div>
                <motion.div 
                  className="bg-purple-50 border border-purple-200 p-6 rounded-lg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h4 className="font-semibold mb-2 text-purple-800">Confidence</h4>
                  <div className="text-4xl font-bold">{Math.round(analysis.industryConfidence * 100)}%</div>
                  <div className="text-xs opacity-60 mt-2">Level of certainty in the analysis</div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  ANALYSIS CONTEXT
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Industry, Context, and Key Findings
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border p-4 rounded">
                  <h4 className="font-semibold mb-2">Industry</h4>
                  <p className="text-sm opacity-70">{analysis.industry}</p>
                </div>
                <div className="bg-gray-50 border p-4 rounded">
                  <h4 className="font-semibold mb-2">Context</h4>
                  <p className="text-sm opacity-70">{analysis.context}</p>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  KEY FINDINGS
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Summary of the most important insights
                </div>
              </motion.div>

              {/* Remove the summary section from the overview tab (the div with analysis.summary) */}
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
                      onLocationClick={handleLocationClick}
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
                        onLocationClick={handleLocationClick}
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

          {/* Accessibility Audit */}
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
                  {/* Accessibility Score */}
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold">{analysis.accessibilityAudit.score}/100</div>
                        <div className="text-xs opacity-60">Accessibility Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">WCAG {analysis.accessibilityAudit.wcagLevel}</div>
                        <div className="text-xs opacity-60">Compliance Level</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold">{analysis.accessibilityAudit.keyboardNav}</div>
                        <div className="text-xs opacity-60">Keyboard Navigation</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Critical Failures */}
                  {analysis.accessibilityAudit.criticalFailures?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg">Critical Accessibility Issues</h4>
                      {analysis.accessibilityAudit.criticalFailures.map((failure, i) => (
                        <motion.div 
                          key={i} 
                          className="border-2 border-red-400 bg-red-50 p-4 rounded"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="font-semibold text-sm mb-1">
                            {failure.criterion}: {failure.issue}
                          </div>
                          <div className="text-xs opacity-70 mb-2">{failure.location?.selector}</div>
                          <div className="bg-red-100 p-2 rounded text-sm">
                            <strong>Fix:</strong> {failure.fix}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 opacity-60">
                  <div className="text-4xl mb-4">♿</div>
                  <div className="font-mono">No accessibility audit available</div>
                </div>
              )}
            </div>
          )}

          {/* Competitive Analysis */}
          {activeTab === 'competitive' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <GlitchText className="text-2xl font-bold mb-2" trigger="mount">
                  INTEL REPORT
                </GlitchText>
                <div className="text-sm opacity-70 font-mono">
                  Competitive landscape analysis
                </div>
              </motion.div>

              {isPro && analysis.competitiveAnalysis ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div 
                      className="bg-green-50 border border-green-200 p-4 rounded"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h4 className="font-semibold mb-2 text-green-800">Competitive Strengths</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {analysis.competitiveAnalysis.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </motion.div>
                    <motion.div 
                      className="bg-red-50 border border-red-200 p-4 rounded"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h4 className="font-semibold mb-2 text-red-800">Areas for Improvement</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {analysis.competitiveAnalysis.weaknesses.map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="bg-gray-50 border p-4 rounded"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="font-semibold mb-3">Industry Benchmarks</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{analysis.competitiveAnalysis.benchmarks.industryAvgConversion}</div>
                        <div className="text-xs opacity-60">Industry Average</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{analysis.competitiveAnalysis.benchmarks.topPerformerConversion}</div>
                        <div className="text-xs opacity-60">Top Performers</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{analysis.competitiveAnalysis.benchmarks.yourEstimatedConversion}</div>
                        <div className="text-xs opacity-60">Your Estimate</div>
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  className="text-center py-12 border-2 border-purple-300 rounded-lg bg-purple-50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-bold mb-2">Competitive Intelligence</h3>
                  <p className="text-sm mb-4 max-w-md mx-auto opacity-70">
                    Compare your design against industry leaders and benchmarks
                  </p>
                  <button className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700">
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