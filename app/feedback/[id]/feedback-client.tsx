'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ZombifyAnalysis } from '@/types/analysis';
import { useUpload } from '@/contexts/UploadContext';
import { normalizeAnalysisData, shouldShowModule } from '@/utils/analysisCompatibility';
import GlitchText from '@/components/GlitchText';
import FeedbackSummary from '@/components/feedback/FeedbackSummary';
import FeedbackDarkPatterns from '@/components/feedback/FeedbackDarkPatterns';
import FeedbackCriticalIssues from '@/components/feedback/FeedbackCriticalIssues';
import FeedbackDetailedAnalysis from '@/components/feedback/FeedbackDetailedAnalysis';
import FeedbackFrictionPoints from '@/components/feedback/FeedbackFrictionPoints';
import FeedbackOpportunities from '@/components/feedback/FeedbackOpportunities';
import FeedbackInsights from '@/components/feedback/FeedbackInsights';
import FeedbackIntentAnalysis from '@/components/feedback/FeedbackIntentAnalysis';
import FeedbackAccessibility from '@/components/feedback/FeedbackAccessibility';
import FeedbackTabs, { FeedbackSectionId } from '@/components/FeedbackTabs';
import UXCopyAnalysisCard from '@/components/UXCopyAnalysisCard';
import PerceptionDisplay from '@/components/PerceptionDisplay';
import ModuleStrengthIndicator from '@/components/ModuleStrengthIndicator';
import DiagnosticsPanel from '@/components/DiagnosticsPanel';
import ExtractedDataDisplay from '@/components/ExtractedDataDisplay';

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
    ('issuesAndFixes' in analysis || 'criticalIssues' in analysis) &&
    'context' in analysis;
}

// Create legacy analysis structure for backward compatibility
function createLegacyAnalysis(score: number): ZombifyAnalysis {
  return {
    context: 'LEGACY' as any,
    industry: 'UNKNOWN' as any,
    industryConfidence: 0,
    gripScore: { 
      overall: score, 
      breakdown: { 
        firstImpression: { score: Math.round(score * 0.8), reasoning: "Legacy analysis - limited data", evidence: [] },
        usability: { score: Math.round(score * 0.9), reasoning: "Legacy analysis - limited data", evidence: [] },
        trustworthiness: { score: Math.round(score * 0.7), reasoning: "Legacy analysis - limited data", evidence: [] },
        conversion: { score: Math.round(score * 0.6), reasoning: "Legacy analysis - limited data", evidence: [] }
      } 
    },
    verdict: {
      summary: "This is a legacy analysis. Upgrade your account to get detailed insights with our enhanced analysis engine.",
      attentionSpan: "Limited data available",
      likelyAction: "Data not available in legacy format", 
      dropoffPoint: "Upgrade for detailed analysis",
      memorable: "Legacy format",
      attentionFlow: []
    },
    
    // NEW ENHANCED SECTIONS - Empty for legacy
    darkPatterns: [],
    intentAnalysis: {
      perceivedPurpose: "Unknown",
      actualPurpose: "Unknown", 
      alignmentScore: 0,
      misalignments: [],
      clarityImprovements: []
    },
    frictionPoints: [],
    
    // Required new fields for compatibility
    issuesAndFixes: [],
    visualDesign: {
      score: Math.round(score * 0.7),
      typography: {
        score: Math.round(score * 0.7),
        issues: [],
        hierarchy: { h1ToH2Ratio: 1, consistencyScore: 0, recommendation: "Upgrade for detailed typography analysis" },
        readability: { fleschScore: 0, avgLineLength: 0, recommendation: "Upgrade for readability analysis" }
      },
      colorAndContrast: {
        score: Math.round(score * 0.8),
        contrastFailures: [],
        colorHarmony: { scheme: "UNKNOWN", brandColors: [], accentSuggestion: "Upgrade for color analysis" }
      },
      spacing: {
        score: Math.round(score * 0.6),
        gridSystem: "UNKNOWN",
        consistency: 0,
        issues: []
      },
      modernPatterns: {
        detected: [],
        implementation: {},
        trendAlignment: { "2025Relevance": 0, suggestions: ["Upgrade for modern pattern analysis"] }
      },
      visualHierarchy: {
        scanPattern: "UNKNOWN",
        focalPoints: [],
        improvements: []
      }
    },
    uxCopyInsights: {
      score: Math.round(score * 0.6),
      audienceAlignment: {
        detectedAudience: "Unknown",
        copyStyle: "Unknown",
        brandArchetype: "Unknown",
        toneMismatch: 0
      },
      issues: [],
      microCopyOpportunities: [],
      writingTone: {
        current: "Unknown",
        recommended: "Upgrade for copy analysis",
        example: "Upgrade to see copy improvements"
      }
    },
    criticalIssues: [],
    usabilityIssues: [],
    opportunities: [],
    behavioralInsights: [],
    generationalAnalysis: { 
      scores: {}, 
      primaryTarget: 'unknown', 
      recommendations: ["Upgrade for generational analysis"] 
    },
    timestamp: new Date().toISOString()
  };
}

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { setCurrentAnalysis, setLastUploadId } = useUpload();
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
  
  // Create proper analysis object for components
  const processedAnalysis = isNewFormat ? normalizeAnalysisData(analysis) : createLegacyAnalysis(score);

  // Active section state - start with summary
  const [activeSection, setActiveSection] = useState<FeedbackSectionId>('summary');

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
          
          // Set current analysis in context for sidebar
          const currentAnalysis = {
            id: feedbackData.id,
            fileName: feedbackData.original_filename || `Analysis #${feedbackData.id.slice(0, 8)}`,
            gripScore: feedbackData.score,
            context: feedbackData.user_id ? 'user_upload' : 'guest_upload',
            timestamp: feedbackData.created_at
          };
          setCurrentAnalysis(currentAnalysis);
          
          // Mark this as the latest upload to ensure sidebar includes it
          setLastUploadId(feedbackData.id);
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
  }, [params.id, supabase, setCurrentAnalysis, setLastUploadId]);

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

  // Enhanced scroll listener to update active section - UPDATED FOR 9 TABS
  useEffect(() => {
    if (!data) return; // Don't run until data is loaded

    const handleScroll = () => {
      const sections = ['summary', 'dark-patterns', 'issues', 'copy', 'design', 'friction', 'intent', 'growth', 'behavior', 'access'];
      
      // Find the specific feedback scroll container
      const scrollContainer = document.getElementById('feedback-scroll-container') as HTMLElement;
      
      if (!scrollContainer) {
        console.log('❌ Feedback scroll container not found');
        return;
      }
      
      const scrollTop = scrollContainer.scrollTop;
      const headerOffset = 150; // Account for sticky tabs height
      
      console.log('📊 Scroll Debug:', {
        scrollTop,
        headerOffset,
        containerHeight: scrollContainer.clientHeight
      });
      
      // Get all section elements and their positions
      const sectionElements = sections.map(id => {
        const element = document.getElementById(id);
        return {
          id,
          element,
          position: element ? element.offsetTop : 0,
          inView: false
        };
      }).filter(section => section.element);
      
      console.log('🎯 Section positions:', sectionElements.map(s => ({ 
        id: s.id, 
        position: s.position,
        isActive: s.position <= scrollTop + headerOffset
      })));
      
      // Find the current section based on scroll position
      let currentSection = sections[0]; // Default to first section
      
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.position <= scrollTop + headerOffset) {
          currentSection = section.id;
          console.log('✅ Active section detected:', currentSection);
          break;
        }
      }
      
      // Only update if the section has changed
      setActiveSection(prevSection => {
        if (prevSection !== currentSection) {
          console.log('🔄 Section changed:', prevSection, '→', currentSection);
          return currentSection as FeedbackSectionId;
        }
        return prevSection;
      });
    };

    // Debounce the scroll handler for better performance
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 50);
    };

    // Find the scrollable container and add listener
    let cleanupFunction: (() => void) | null = null;
    
    const findAndAttachListener = () => {
      // Wait for DOM to be fully ready
      const timeoutId = setTimeout(() => {
        const scrollContainer = document.getElementById('feedback-scroll-container') as HTMLElement;
        
        if (scrollContainer) {
          console.log('✅ Feedback scroll container found:', scrollContainer);
          scrollContainer.addEventListener('scroll', debouncedScrollHandler, { passive: true });
          
          // Initial call to set correct active section
          setTimeout(handleScroll, 100);
          
          cleanupFunction = () => {
            scrollContainer.removeEventListener('scroll', debouncedScrollHandler);
            clearTimeout(scrollTimeout);
          };
        } else {
          console.log('❌ Feedback scroll container not found');
        }
      }, 500); // Increased timeout to ensure DOM is ready
      
      return () => {
        clearTimeout(timeoutId);
        if (cleanupFunction) cleanupFunction();
      };
    };

    const cleanup = findAndAttachListener();
    
    return cleanup;
  }, [data]); // Re-run when data loads to ensure container exists

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

      {/* Feedback Tabs - UPDATED FOR 9 TABS */}
      <FeedbackTabs
        analysis={processedAnalysis}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isPro={isLoggedIn}
      />

      {/* Flowing Single-Page Layout - UPDATED FOR 9 SECTIONS */}
      <div className="space-y-16">
        {/* 1. Executive Summary */}
        <section id="summary">
          <FeedbackSummary 
            analysis={processedAnalysis}
            imageUrl={data?.image_url}
          />
        </section>

        {/* 1.5. Perception Layer - User Psychology */}
        {processedAnalysis.perceptionLayer && (
          <section id="perception">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="text-3xl font-bold mb-3 font-mono tracking-wider">
                  USER PERCEPTION
                </div>
                <div className="text-lg opacity-70 font-mono mb-2">
                  How users emotionally react and what they focus on first
                </div>
                <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
                  <span>Primary Emotion: {processedAnalysis.perceptionLayer.primaryEmotion.type}</span>
                  <span>•</span>
                  <span>Intensity: {processedAnalysis.perceptionLayer.primaryEmotion.intensity}/10</span>
                  <span>•</span>
                  <span>{processedAnalysis.perceptionLayer.attentionFlow?.length || 0} Focus Points</span>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <PerceptionDisplay 
                    perceptionLayer={processedAnalysis.perceptionLayer}
                    heatmapData={(processedAnalysis as any).heatmapData}
                    imageUrl={data?.image_url}
                  />
                </motion.div>
              </div>
            </motion.div>
          </section>
        )}

        {/* 2. Extracted Data - Show ALL real data */}
        {(processedAnalysis as any).extractedData && (
          <section id="extracted-data" className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🔬</span>
                  <h2 className="text-3xl font-bold tracking-tight">EXTRACTED DATA</h2>
                </div>
                <div className="text-sm opacity-60 mb-4">
                  Real data extracted from your image • No hallucinations • 100% accurate
                </div>
              </motion.div>

              <ExtractedDataDisplay extractedData={(processedAnalysis as any).extractedData} />
            </motion.div>
          </section>
        )}

        {/* 3. Dark Patterns - NEW SECTION */}
        <section id="dark-patterns">
          <FeedbackDarkPatterns 
            analysis={processedAnalysis}
            imageUrl={data?.image_url}
          />
        </section>

        {/* 3. Issues & Fixes */}
        <section id="issues">
          <FeedbackCriticalIssues 
            analysis={processedAnalysis}
            imageUrl={data?.image_url}
            isLoggedIn={isLoggedIn}
            isPro={true}
          />
        </section>

        {/* 4. Copy Analysis - ENHANCED */}
        {shouldShowModule('uxCopyInsights', processedAnalysis) && (
          <section id="copy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl font-bold font-mono tracking-wider">
                    UX COPY INTELLIGENCE
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${
                    (() => {
                      const strength = processedAnalysis.moduleStrength?.uxCopyInsights || 0;
                      const clarityFlag = processedAnalysis.perceptionLayer?.clarityFlags?.uxCopyInsights;
                      
                      if (strength >= 4 && clarityFlag) return 'bg-green-100 text-green-700';
                      if (strength >= 3 || clarityFlag) return 'bg-yellow-100 text-yellow-700';
                      return 'bg-red-100 text-red-700';
                    })()
                  }`}>
                    {(() => {
                      const strength = processedAnalysis.moduleStrength?.uxCopyInsights || 0;
                      const clarityFlag = processedAnalysis.perceptionLayer?.clarityFlags?.uxCopyInsights;
                      
                      if (strength >= 4 && clarityFlag) return '🟢 High Quality';
                      if (strength >= 3 || clarityFlag) return '🟡 Good Signal';
                      return '🔴 Low Signal';
                    })()}
                  </span>
                </div>
                <div className="text-lg opacity-70 font-mono mb-2">
                  Audience targeting, microcopy optimization, and strategic copy analysis
                </div>
                <div className="flex items-center gap-4 text-sm opacity-60 font-mono">
                  <span>{processedAnalysis.uxCopyAnalysis?.issues?.length || 0} Copy Issues</span>
                  <span>•</span>
                  <span className="text-blue-600 font-bold">Score: {processedAnalysis.uxCopyAnalysis?.score || 0}/100</span>
                </div>
              </motion.div>

              {processedAnalysis.uxCopyAnalysis ? (
                <div className="grid grid-cols-1 max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <UXCopyAnalysisCard uxCopy={processedAnalysis.uxCopyAnalysis} />
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  className="text-center py-16 border-2 border-black bg-[#f5f1e6] relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-8xl mb-6">📝</div>
                  <div className="text-3xl font-bold mb-4 font-mono tracking-wider">
                    COPY ANALYSIS UNAVAILABLE
                  </div>
                  <p className="text-lg opacity-70 font-mono mb-4">
                    No copy analysis available for this interface
                  </p>
                </motion.div>
              )}
            </motion.div>
          </section>
        )}

        {/* 5. Design Analysis */}
        {shouldShowModule('visualDesign', processedAnalysis) && (
          <section id="design">
            <FeedbackDetailedAnalysis 
              analysis={processedAnalysis}
            />
          </section>
        )}

        {/* 6. Accessibility Analysis */}
        {processedAnalysis.accessibilityAudit && (
          <section id="accessibility">
            <FeedbackAccessibility 
              analysis={processedAnalysis}
            />
          </section>
        )}

        {/* 7. Friction Points - UI OBSTACLES */}
        {shouldShowModule('frictionPoints', processedAnalysis) && (
          <section id="friction">
            <FeedbackFrictionPoints 
              analysis={processedAnalysis}
              imageUrl={data?.image_url}
            />
          </section>
        )}

        {/* 8. Intent Analysis - STRATEGIC PURPOSE ALIGNMENT */}
        <section id="intent">
          <FeedbackIntentAnalysis 
            analysis={processedAnalysis}
            imageUrl={data?.image_url}
          />
        </section>

        {/* 9. Growth Opportunities - Pro Feature */}
        {shouldShowModule('opportunities', processedAnalysis) && (
          <section id="growth">
            <FeedbackOpportunities 
              analysis={processedAnalysis}
              imageUrl={data?.image_url}
              isPro={isLoggedIn}
              onUpgrade={() => {/* Handle upgrade logic */}}
            />
          </section>
        )}

        {/* 10. Behavioral Insights - Pro Feature */}
        {shouldShowModule('behavioralInsights', processedAnalysis) && (
          <section id="behavior">
            <FeedbackInsights 
              analysis={processedAnalysis}
              isPro={isLoggedIn}
              onUpgrade={() => {/* Handle upgrade logic */}}
            />
          </section>
        )}

      </div>

      {/* Diagnostics Panel */}
      <DiagnosticsPanel analysis={processedAnalysis} />

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
        id="feedback-scroll-container"
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