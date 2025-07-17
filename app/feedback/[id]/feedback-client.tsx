'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import GenerationalRadarChart from '@/components/GenerationalRadarChart';
import { AppLayout } from '@/components/AppLayout';
import { ZombifyAnalysis } from '@/types/analysis';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import GripScoreCard from '@/components/GripScoreCard';
import VisualDesignAnalysisCard from '@/components/VisualDesignAnalysisCard';
import UXCopyAnalysisCard from '@/components/UXCopyAnalysisCard';
import GlitchText from '@/components/GlitchText';
import FeedbackTabs from '@/components/FeedbackTabs';
import { FeedbackTabId } from '@/components/FeedbackDisplay';

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
  const [activeTab, setActiveTab] = useState<FeedbackTabId>('overview');

  const supabase = createClientComponentClient();

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
          <GlitchText className="text-2xl mb-4" trigger="continuous">
            ERROR LOADING ANALYSIS
          </GlitchText>
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
          <GlitchText className="text-xl mb-2" trigger="continuous">
            LOADING ANALYSIS...
          </GlitchText>
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
          <GlitchText className="text-2xl mb-4" trigger="continuous">
            ANALYSIS NOT FOUND
          </GlitchText>
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

  // Parse analysis data
  const analysis = data.analysis || {};
  const isNewFormat = isNewAnalysisFormat(analysis);
  
  // Extract data based on format
  const score = isNewFormat ? analysis.gripScore.overall : (data.score || 0);

  const feedbackContent = (
    <>
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
          <GlitchText className="text-4xl font-bold mb-2" trigger="mount" intensity="high">
            ANALYSIS #{data.id.slice(0, 8).toUpperCase()}
          </GlitchText>
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

      {/* Tab Navigation */}
      {isNewFormat && (
        <FeedbackTabs 
          analysis={analysis} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isPro={true} 
        />
      )}

      {/* Main Content Layout */}
      {activeTab === 'overview' ? (
        <div className="space-y-8 w-full">
          {/* Top Row - Image, Grip Score, Context */}
          <div className="flex gap-8 w-full">
            {/* Left Column - Source Image */}
            <motion.div 
              className="w-1/3 min-w-[300px]"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="zombify-card p-6 scan-line">
                <GlitchText className="text-lg font-bold mb-4" trigger="hover">
                  SOURCE MATERIAL
                </GlitchText>
                <motion.div 
                  className="relative overflow-hidden rounded border-2 border-black/20"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={data.image_url}
                    alt="Interface Analysis"
                    className="w-full h-auto max-h-80 object-contain mx-auto"
                    onError={(e: any) => {
                      if (e.target.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxNzZWMTc2SDgwVjgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8dGV4dCB4PSIxMjgiIHk9IjE0MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=') {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxNzZWMTc2SDgwVjgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8dGV4dCB4PSIxMjgiIHk9IjE0MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                      }
                    }}
                  />
                  
                  {/* Overlay scanning effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent h-full"
                    animate={{
                      y: ['-100%', '100%']
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear"
                    }}
                    style={{ width: '100%', height: '20px' }}
                  />
                </motion.div>
                
                <motion.p 
                  className="text-xs opacity-60 mt-3 font-mono text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  ANALYSIS COMPLETE • {new Date(data.created_at).toLocaleString()}
                </motion.p>
              </div>
            </motion.div>

            {/* Right Column - Grip Score and Generational Chart */}
            <div className="flex-1 space-y-6">
              {/* Grip Score Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {isNewFormat ? (
                  <GripScoreCard 
                    gripScore={analysis.gripScore}
                    showBreakdown={true}
                  />
                ) : (
                  <GripScoreCard score={score} />
                )}
              </motion.div>

              {/* Generational Radar Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <div className="zombify-card p-6 scan-line relative overflow-hidden">
                  {((isNewFormat && analysis.generationalAnalysis) || (!isNewFormat && analysis?.generationalScores)) ? (
                    <GenerationalRadarChart 
                      scores={isNewFormat ? analysis.generationalAnalysis.scores : analysis.generationalScores}
                      primaryTarget={isNewFormat ? analysis.generationalAnalysis.primaryTarget : (analysis.primaryTarget || 'millennials')}
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
          </div>

          {/* Analysis Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Design Analysis */}
            {isNewFormat && analysis.visualDesignAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <VisualDesignAnalysisCard visualDesign={analysis.visualDesignAnalysis} />
              </motion.div>
            )}

            {/* UX Copy Analysis */}
            {isNewFormat && analysis.uxCopyAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <UXCopyAnalysisCard uxCopy={analysis.uxCopyAnalysis} />
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        // All other tabs use FeedbackDisplay component
        <div className="w-full">
          <FeedbackDisplay 
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
            isLoggedIn={isLoggedIn}
            isPro={true}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      )}

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
            
            <GlitchText className="text-2xl font-bold mb-4" trigger="continuous">
              UPGRADE TO PREMIUM
            </GlitchText>
            
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
    </>
  );

  return (
    <div className="fixed inset-0 bg-[#f5f1e6] z-30">
      {/* Sidebar space */}
      <div className="w-64 h-full bg-transparent"></div>
      
      {/* Main content - positioned absolutely to fill remaining space */}
      <div 
        className="absolute top-0 bottom-0 overflow-y-auto p-12"
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