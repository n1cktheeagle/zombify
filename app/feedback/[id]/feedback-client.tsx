'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import GlitchText from '@/components/GlitchText';
import FeedbackSummary from '@/components/feedback/FeedbackSummary';
import FeedbackCriticalIssues from '@/components/feedback/FeedbackCriticalIssues';
import FeedbackDetailedAnalysis from '@/components/feedback/FeedbackDetailedAnalysis';
import FeedbackOpportunities from '@/components/feedback/FeedbackOpportunities';
import FeedbackInsights from '@/components/feedback/FeedbackInsights';
import FeedbackAccessibility from '@/components/feedback/FeedbackAccessibility';
import FeedbackNavigation, { useFeedbackNavigation } from '@/components/feedback/FeedbackNavigation';

// TypeScript interfaces
interface FeedbackData {
  id: string;
  created_at: string;
  image_url: string;
  project_name: string;
  analysis: any;
  chain_id: string;
  issues: string[];
  score: number;
  user_id: string | null;
  is_guest: boolean;
  original_filename: string | null;
}

// Helper function to check if analysis is new format
function isNewAnalysisFormat(analysis: any): analysis is ZombifyAnalysis {
  return analysis && 
    typeof analysis === 'object' && 
    'gripScore' in analysis && 
    'criticalIssues' in analysis &&
    'context' in analysis;
}

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [cooldownTime, setCooldownTime] = useState(60);

  const supabase = createClientComponentClient();

  // Parse analysis data early to avoid conditional hook calls
  const analysis = data?.analysis || {};
  const isNewFormat = data ? isNewAnalysisFormat(analysis) : false;
  const score = isNewFormat ? analysis.gripScore?.overall || 0 : (data?.score || 0);

  // Navigation sections for the flowing layout - memoized to prevent hook re-ordering
  const navigationSections = useMemo(() => [
    { id: 'summary', title: 'Executive Summary', icon: '📊', completed: true },
    { id: 'issues', title: 'Issues & Fixes', icon: '🚨', count: (analysis.criticalIssues?.length || 0) + (analysis.usabilityIssues?.length || 0) },
    { id: 'detailed-analysis', title: 'Detailed Analysis', icon: '🔍' },
    { id: 'opportunities', title: 'Growth Opportunities', icon: '🚀', count: analysis.opportunities?.length || 0 },
    { id: 'insights', title: 'Behavioral Insights', icon: '🧠', count: analysis.behavioralInsights?.length || 0 },
    { id: 'accessibility', title: 'Accessibility', icon: '♿', count: analysis.accessibilityAudit?.criticalFailures?.length || 0 }
  ], [
    analysis.criticalIssues?.length,
    analysis.usabilityIssues?.length,
    analysis.opportunities?.length,
    analysis.behavioralInsights?.length,
    analysis.accessibilityAudit?.criticalFailures?.length
  ]);

  const { activeSection, setActiveSection } = useFeedbackNavigation(navigationSections);

  const openSignIn = () => {
    // Your sign in logic here
  };

  const openSignUp = () => {
    // Your sign up logic here
  };

  // Initialize page data
  useEffect(() => {
    let mounted = true;

    async function initializePage() {
      console.log('🚀 Starting initializePage for ID:', params.id);
      
      try {
        // Get user
        console.log('🔐 Checking authentication...');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log('👤 Current user:', currentUser?.id || 'guest');
        
        if (mounted) {
          setUser(currentUser);
        }

        // Fetch feedback data
        console.log('📡 Fetching feedback data...');
        
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .eq('id', params.id)
          .single();

        console.log('📊 Query result:', { feedbackData, feedbackError });

        if (feedbackError) {
          console.error('Database error:', feedbackError);
          throw new Error(`Database error: ${feedbackError.message}`);
        }
        
        if (!feedbackData) {
          console.log('No data found for ID:', params.id);
          throw new Error('Feedback not found');
        }

        console.log('✅ Data loaded successfully:', feedbackData);
        console.log('Analysis structure:', JSON.stringify(feedbackData.analysis, null, 2));
        if (mounted) {
          setData(feedbackData);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ Error initializing page:', err);
        if (mounted) {
          setError(err.message || 'Failed to load feedback');
          setLoading(false);
        }
      }
    }

    initializePage();

    return () => {
      mounted = false;
    };
  }, [params.id, supabase]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      const interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTime]);



  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] text-black font-mono flex items-center justify-center">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div 
              className="text-6xl mb-6"
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              ⚠️
            </motion.div>
            <h2>
              <GlitchText className="text-2xl mb-4" trigger="continuous">
                ERROR LOADING ANALYSIS
              </GlitchText>
            </h2>
            <motion.p 
              className="mb-4 text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {error}
            </motion.p>
            <motion.p 
              className="text-sm opacity-60 mb-6 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              TRACE ID: {params.id}
            </motion.p>
            <div className="space-x-4">
              <motion.button 
                onClick={() => window.location.reload()}
                className="zombify-primary-button px-6 py-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                RETRY LOADING
              </motion.button>
              <motion.button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 border-2 border-black rounded hover:bg-gray-100 font-mono font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                RETURN TO DASHBOARD
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] text-black font-mono flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="text-4xl mb-4"
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                scale: { repeat: Infinity, duration: 1, ease: "easeInOut" }
              }}
            >
              ⏳
            </motion.div>
            <h2>
              <GlitchText className="text-xl mb-2" trigger="continuous">
                LOADING ANALYSIS...
              </GlitchText>
            </h2>
            <motion.div className="flex justify-center mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-8 bg-black mx-1 rounded"
                  animate={{
                    scaleY: [0.3, 1, 0.3],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
            <p className="text-sm opacity-60 font-mono">Analysis ID: {params.id}</p>
          </motion.div>
        </div>
      );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] text-black font-mono flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                opacity: [0.5, 1, 0.5],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut"
              }}
            >
              👻
            </motion.div>
            <h2>
              <GlitchText className="text-2xl mb-4" trigger="continuous">
                ANALYSIS NOT FOUND
              </GlitchText>
            </h2>
            <p className="mb-4">This analysis could not be found.</p>
            <p className="text-sm opacity-60 mb-4 font-mono">Analysis ID: {params.id}</p>
            <motion.button 
              onClick={() => router.push('/dashboard')}
              className="zombify-primary-button px-6 py-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              RETURN TO DASHBOARD
            </motion.button>
          </motion.div>
        </div>
      );
  }

  const isLoggedIn = !!user;

  const feedbackContent = (
    <div className="p-12">
      {/* Guest CTA - Only show for non-logged in users */}
      {!user && (
        <motion.div 
          className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b-2 border-purple-500/30 p-6 mb-6 relative overflow-hidden"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"
            animate={{
              x: [-1000, 1000],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear"
            }}
          />
          
          <div className="w-full text-center relative z-10">
            <GlitchText className="font-mono text-purple-200 mb-4 text-lg" trigger="continuous">
              PREMIUM ANALYSIS AVAILABLE • UPGRADE TO PRO?
            </GlitchText>
            <p className="font-mono text-purple-100 mb-4 text-sm">
              Get unlimited analysis with advanced insights and detailed reports.
            </p>
            <div className="flex gap-3 justify-center">
              <motion.button 
                onClick={openSignIn}
                className="text-sm font-mono px-6 py-3 border-2 border-purple-400 text-purple-300 hover:bg-purple-500/20 rounded transition-all font-bold tracking-wider"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                SIGN IN
              </motion.button>
              <motion.button 
                onClick={openSignUp}
                className="text-sm font-mono px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded font-bold tracking-wider"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                UPGRADE TO PRO
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div>
          <h1>
            <GlitchText className="text-4xl font-bold mb-2" trigger="mount" intensity="high">
              {data.original_filename || `ANALYSIS #${data.id.slice(0, 8).toUpperCase()}`}
            </GlitchText>
          </h1>
          <motion.div 
            className="flex items-center gap-4 text-sm opacity-60 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span>{new Date(data.created_at).toLocaleString()}</span>
            {/* Analysis badges */}
            {isNewFormat && (
              <>
                <span>•</span>
                <motion.span 
                  className="text-xs bg-gradient-to-r from-stone-300 to-stone-200 text-stone-700 px-3 py-1 border border-stone-400/40 font-mono font-bold tracking-wider shadow-sm"
                  whileHover={{ 
                    boxShadow: '0 0 8px rgba(120, 113, 108, 0.2)',
                    borderColor: 'rgba(120, 113, 108, 0.6)'
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  {analysis.context.replace('_', ' ')}
                </motion.span>
                {analysis.industry !== 'UNKNOWN' && (
                  <motion.span 
                    className="text-xs bg-gradient-to-r from-neutral-300 to-neutral-200 text-neutral-700 px-3 py-1 border border-neutral-400/40 font-mono font-bold tracking-wider shadow-sm"
                    whileHover={{ 
                      boxShadow: '0 0 8px rgba(115, 115, 115, 0.2)',
                      borderColor: 'rgba(115, 115, 115, 0.6)'
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    {analysis.industry} ({Math.round(analysis.industryConfidence * 100)}% CERTAINTY)
                  </motion.span>
                )}
              </>
            )}
          </motion.div>
        </div>
        
        {/* Only show upgrade CTA if logged in */}
        {isLoggedIn && (
          <motion.div 
            className="text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-xs opacity-60 mb-2 font-mono">PREMIUM FEATURES AVAILABLE</div>
            <motion.button 
              className="zombify-primary-button px-6 py-2 text-sm font-bold tracking-wider"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              UPGRADE TO PRO
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Navigation Component */}
      <FeedbackNavigation 
        sections={navigationSections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Flowing Single-Page Layout */}
      <div className="space-y-16">
        {/* Executive Summary */}
        <section id="summary">
          <FeedbackSummary 
            analysis={isNewFormat ? analysis : {
              context: 'LEGACY' as any,
              industry: 'UNKNOWN' as any,
              industryConfidence: 0.85,
              gripScore: { 
                overall: score, 
                breakdown: { 
                  firstImpression: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  usability: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  trustworthiness: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  conversion: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  accessibility: { score: 0, reasoning: "Legacy analysis", evidence: [] }
                } 
              },
              verdict: {
                summary: "Legacy analysis - upgrade for detailed insights",
                attentionSpan: "N/A",
                likelyAction: "N/A", 
                dropoffPoint: "N/A",
                memorable: "N/A",
                attentionFlow: []
              },
              visualDesignAnalysis: null as any,
              uxCopyAnalysis: null as any,
              criticalIssues: [],
              usabilityIssues: [],
              opportunities: [],
              behavioralInsights: [],
              generationalAnalysis: null as any,
              accessibilityAudit: null,
              timestamp: new Date().toISOString()
            }}
            imageUrl={data?.image_url}
          />
        </section>

        {/* Issues & Fixes */}
        <section id="issues">
          <FeedbackCriticalIssues 
            analysis={isNewFormat ? analysis : {
              context: 'LEGACY' as any,
              industry: 'UNKNOWN' as any,
              industryConfidence: 0,
              gripScore: { 
                overall: score, 
                breakdown: { 
                  firstImpression: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  usability: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  trustworthiness: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  conversion: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  accessibility: { score: 0, reasoning: "Legacy analysis", evidence: [] }
                } 
              },
              verdict: {
                summary: "Legacy analysis format",
                attentionSpan: "N/A",
                likelyAction: "N/A",
                dropoffPoint: "N/A",
                memorable: "N/A",
                attentionFlow: []
              },
              visualDesignAnalysis: null as any,
              uxCopyAnalysis: null as any,
              criticalIssues: [],
              usabilityIssues: [],
              opportunities: [],
              behavioralInsights: [],
              generationalAnalysis: null as any,
              accessibilityAudit: null,
              timestamp: new Date().toISOString()
            }}
            imageUrl={data?.image_url}
            isLoggedIn={isLoggedIn}
            isPro={true}
          />
        </section>

        {/* Detailed Analysis */}
        <section id="detailed-analysis">
          <FeedbackDetailedAnalysis 
            analysis={isNewFormat ? analysis : {
              context: 'LEGACY' as any,
              industry: 'UNKNOWN' as any,
              industryConfidence: 0,
              gripScore: { 
                overall: score, 
                breakdown: { 
                  firstImpression: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  usability: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  trustworthiness: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  conversion: { score: 0, reasoning: "Legacy analysis", evidence: [] },
                  accessibility: { score: 0, reasoning: "Legacy analysis", evidence: [] }
                } 
              },
              verdict: {
                summary: "Legacy analysis format",
                attentionSpan: "N/A",
                likelyAction: "N/A",
                dropoffPoint: "N/A",
                memorable: "N/A",
                attentionFlow: []
              },
              visualDesignAnalysis: {
                score: 0,
                typography: {
                  score: 0,
                  issues: [],
                  hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: "No analysis available" },
                  readability: { fleschScore: 0, avgLineLength: 0, recommendation: "No analysis available" }
                },
                colorAndContrast: {
                  score: 0,
                  contrastFailures: [],
                  colorHarmony: { scheme: "UNKNOWN", brandColors: [], accentSuggestion: "No analysis available" }
                },
                spacing: {
                  score: 0,
                  gridSystem: "UNKNOWN",
                  consistency: 0,
                  issues: []
                },
                modernPatterns: {
                  detected: [],
                  implementation: {},
                  trendAlignment: { "2025Relevance": 0, suggestions: [] }
                },
                visualHierarchy: {
                  scanPattern: "UNKNOWN",
                  focalPoints: [],
                  improvements: []
                }
              },
              uxCopyAnalysis: {
                score: 0,
                issues: [],
                writingTone: {
                  current: "Unknown",
                  recommended: "Unknown",
                  example: "No analysis available"
                }
              },
              criticalIssues: [],
              usabilityIssues: [],
              opportunities: [],
              behavioralInsights: [],
              generationalAnalysis: { scores: {}, primaryTarget: 'unknown', recommendations: [] },
              timestamp: new Date().toISOString(),
              accessibilityAudit: null
            }}
          />
        </section>

        {/* Growth Opportunities - Pro Feature */}
        <section id="opportunities">
          <FeedbackOpportunities 
            analysis={isNewFormat ? analysis : {
              context: 'LEGACY' as any,
              industry: 'UNKNOWN' as any,
              industryConfidence: 0,
              gripScore: { overall: score, breakdown: {} as any },
              verdict: { summary: "", attentionSpan: "", likelyAction: "", dropoffPoint: "", memorable: "", attentionFlow: [] },
              visualDesignAnalysis: null as any,
              uxCopyAnalysis: null as any,
              criticalIssues: [],
              usabilityIssues: [],
              opportunities: [],
              behavioralInsights: [],
              generationalAnalysis: null as any,
              accessibilityAudit: null,
              timestamp: new Date().toISOString()
            }}
            imageUrl={data?.image_url}
            isPro={isLoggedIn}
            onUpgrade={() => {/* Handle upgrade logic */}}
          />
        </section>

        {/* Behavioral Insights - Pro Feature */}
        <section id="insights">
          <FeedbackInsights 
            analysis={isNewFormat ? analysis : {
              context: 'LEGACY' as any,
              industry: 'UNKNOWN' as any,
              industryConfidence: 0,
              gripScore: { overall: score, breakdown: {} as any },
              verdict: { summary: "", attentionSpan: "", likelyAction: "", dropoffPoint: "", memorable: "", attentionFlow: [] },
              visualDesignAnalysis: null as any,
              uxCopyAnalysis: null as any,
              criticalIssues: [],
              usabilityIssues: [],
              opportunities: [],
              behavioralInsights: [],
              generationalAnalysis: null as any,
              accessibilityAudit: null,
              timestamp: new Date().toISOString()
            }}
            isPro={isLoggedIn}
            onUpgrade={() => {/* Handle upgrade logic */}}
          />
        </section>

        {/* Accessibility Analysis */}
        <section id="accessibility">
          <FeedbackAccessibility 
            analysis={isNewFormat ? analysis : {
              context: 'LEGACY' as any,
              industry: 'UNKNOWN' as any,
              industryConfidence: 0,
              gripScore: { overall: score, breakdown: {} as any },
              verdict: { summary: "", attentionSpan: "", likelyAction: "", dropoffPoint: "", memorable: "", attentionFlow: [] },
              visualDesignAnalysis: null as any,
              uxCopyAnalysis: null as any,
              criticalIssues: [],
              usabilityIssues: [],
              opportunities: [],
              behavioralInsights: [],
              generationalAnalysis: null as any,
              accessibilityAudit: null,
              timestamp: new Date().toISOString()
            }}
          />
        </section>
      </div>

      {/* Bottom CTA Section - Only show if NOT logged in */}
      {!isLoggedIn && (
        <motion.div 
          className="mt-16 text-center py-12 border-t-2 border-black/10 relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          {/* Background matrix effect */}
          <div className="absolute inset-0 data-matrix opacity-5" />
          
          <div className="relative z-10">
            <motion.div
              className="text-6xl mb-6"
              animate={{
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotateY: { repeat: Infinity, duration: 4, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
            >
              🧠
            </motion.div>
            
            <h2>
              <GlitchText className="text-2xl font-bold mb-4" trigger="continuous">
                UPGRADE TO PREMIUM
              </GlitchText>
            </h2>
            
            <motion.p 
              className="text-sm opacity-70 mb-6 max-w-md mx-auto font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              Get unlimited analysis with advanced insights and detailed reports.
            </motion.p>
            
            <motion.button 
              onClick={openSignUp}
              className="zombify-primary-button px-8 py-4 text-lg font-bold tracking-wider mb-6"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 30px rgba(0, 0, 0, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2, type: "spring", stiffness: 200 }}
            >
              UPGRADE TO PRO
            </motion.button>
            
            <motion.div 
              className="text-xs opacity-50 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              Get advanced UX insights and detailed analysis reports.
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#f5f1e6] z-30">
      {/* Sidebar space */}
      <div className="w-64 h-full bg-transparent"></div>
      
      {/* Main content - positioned absolutely to fill remaining space */}
      <div 
        className="absolute top-0 bottom-0 overflow-y-auto"
        style={{
          left: '256px',
          right: '0',
          width: 'calc(100vw - 256px)'
        }}
      >
        {feedbackContent}
      </div>
    </div>
  );
}