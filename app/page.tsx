'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { canUserUpload, incrementFeedbackCount } from '@/lib/auth';
import UploadZone from '@/components/UploadZone';
import { MainHeader } from '@/components/MainHeader';
import { Suspense } from 'react'
import AuthNotifications from '@/components/AuthNotifications'

type AppState = 'landing' | 'analyzing' | 'complete';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const { user, profile, loading, initialized } = useAuth();
  const router = useRouter();

  // Debug logging function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugInfo(prev => [...prev.slice(-10), logMessage]);
  };

  // INSTANT redirect check - runs immediately on mount
  useEffect(() => {
    // Check cached user first (instant redirect)
    const cachedUser = localStorage.getItem('zombify_user');
    if (cachedUser && !hasRedirected) {
      try {
        const userData = JSON.parse(cachedUser);
        addDebugLog('🚀 INSTANT redirect from cache');
        setHasRedirected(true);
        router.replace('/dashboard');
        return;
      } catch (err) {
        addDebugLog('❌ Invalid cached user data, clearing cache');
        localStorage.removeItem('zombify_user');
      }
    }
    
    // If no cached user, we can start showing loading state
    addDebugLog('No cached user found, proceeding with auth check');
  }, []);

  // Handle auth errors from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error') || urlParams.get('auth_error');
    if (error) {
      const details = urlParams.get('details');
      const errorMessage = details ? `${error}: ${decodeURIComponent(details)}` : decodeURIComponent(error);
      
      // Only show error if it's a recent one (not from cache/previous attempts)
      if (!error.includes('auth_failed')) {
        setAuthError(errorMessage);
        addDebugLog(`Auth error from URL: ${errorMessage}`);
      }
      
      // Always clean URL regardless
      window.history.replaceState({}, '', window.location.pathname);
      
      // Clear error after 3 seconds
      if (authError) {
        setTimeout(() => setAuthError(null), 3000);
      }
    }
  }, []);

  // Log auth state changes
  useEffect(() => {
    addDebugLog(`Auth state: user=${user?.email || 'null'}, loading=${loading}, initialized=${initialized}, hasRedirected=${hasRedirected}`);
  }, [user, loading, initialized, hasRedirected]);

  // Main redirect logic - AGGRESSIVE early redirect
  useEffect(() => {
    addDebugLog('Redirect effect triggered');
    
    // IMPORTANT: If we have cached user but no actual auth user, clear the cache
    const cachedUser = localStorage.getItem('zombify_user');
    if (cachedUser && !user && initialized && !loading) {
      addDebugLog('🧹 Clearing stale cache - user signed out');
      localStorage.removeItem('zombify_user');
    }
    
    // IMMEDIATE redirect if we detect any user, even before fully initialized
    if (user && !hasRedirected) {
      addDebugLog(`🚀 IMMEDIATE redirect for user: ${user.email}`);
      setHasRedirected(true);
      router.replace('/dashboard');
      return;
    }
    
    if (!initialized) {
      addDebugLog('Not initialized yet, waiting...');
      return;
    }

    if (loading) {
      addDebugLog('Still loading, waiting...');
      return;
    }

    if (hasRedirected) {
      addDebugLog('Already attempted redirect, skipping...');
      return;
    }
    
    // Only show content if we're absolutely sure there's no user
    if (!user) {
      addDebugLog('No user found, showing landing page');
      // Add a small delay to ensure auth is really done
      setTimeout(() => {
        setShowContent(true);
      }, 100);
    }
  }, [user, loading, initialized, router, hasRedirected]);

  // Show loading state while auth is initializing OR if we're redirecting OR haven't decided what to show
  if (!initialized || (user && !hasRedirected) || !showContent) {
    // If we have a user, don't show anything - just redirect silently
    if (user && !hasRedirected) {
      return null; // Render nothing while redirecting
    }

    const loadingMessage = !initialized 
      ? 'Initializing...' 
      : 'Loading...';
    
    const loadingSubtext = !initialized 
      ? 'Starting up the signal...' 
      : 'Please wait...';

    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <Suspense fallback={null}>
  <AuthNotifications />
</Suspense>

        <div className="font-mono text-gray-600 text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p className="text-lg mb-2">{loadingMessage}</p>
          <p className="text-sm opacity-60">{loadingSubtext}</p>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-xs text-left bg-black text-green-400 p-4 rounded font-mono max-w-md mx-auto">
              <div className="mb-2 font-bold">Debug Log:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugInfo.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleZombify = async (file: File) => {
    setAppState('analyzing');
    setAnalysisProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 8 + 2;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_name', 'Untitled');
      
      if (user) {
        formData.append('user_id', user.id);
        formData.append('is_guest', 'false');
      } else {
        formData.append('is_guest', 'true');
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const result = await res.json();
      
      if (result.success && result.feedbackId) {
        setAppState('complete');
        setTimeout(() => {
          router.push(`/feedback/${result.feedbackId}`);
        }, 800);
        return;
      }

      throw new Error(result.error || 'Analysis failed');

    } catch (err) {
      console.error('Upload error:', err);
      setAppState('landing');
      setAnalysisProgress(0);
      throw err;
    }
  };

  // Analysis Screen
  if (appState === 'analyzing' || appState === 'complete') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-[#c8c8c8] font-mono relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto p-8">
          <div className="space-y-4">
            <div className="text-4xl font-bold tracking-wider">
              {appState === 'analyzing' ? 'ANALYZING' : 'SIGNAL ACQUIRED'}
            </div>
            
            <div className="text-lg opacity-80 tracking-wide">
              {appState === 'analyzing' ? 'Scanning interface patterns...' : 'Preparing transmission...'}
            </div>
          </div>

          <div className="bg-black/60 border border-[#666]/40 p-6 rounded font-mono text-left backdrop-blur-sm">
            <div className="text-[#999] text-sm mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse"></div>
              <span>ZOMBIFY ANALYSIS ENGINE v2.1</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className={analysisProgress > 10 ? 'text-[#c8c8c8]' : 'text-[#666]'}>
                › Detecting interface context...
              </div>
              <div className={analysisProgress > 30 ? 'text-[#c8c8c8]' : 'text-[#666]'}>
                › Mapping attention flow patterns...
              </div>
              <div className={analysisProgress > 50 ? 'text-[#c8c8c8]' : 'text-[#666]'}>
                › Analyzing cognitive load distribution...
              </div>
              <div className={analysisProgress > 70 ? 'text-[#c8c8c8]' : 'text-[#666]'}>
                › Processing behavioral triggers...
              </div>
              <div className={analysisProgress > 90 ? 'text-[#c8c8c8]' : 'text-[#666]'}>
                › Generating signal report...
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span>PROGRESS</span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <div className="h-2 bg-black border border-[#666]/40 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#c8c8c8] to-[#999] transition-all duration-300 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center space-x-2">
            <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!user;
  const isAtUploadLimit = Boolean(profile && profile.plan_type === 'free' && profile.feedback_count >= profile.monthly_limit);

  // Landing Page
  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

      <MainHeader variant="landing" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* Auth Error Message */}
        {authError && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded font-mono text-sm max-w-md">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>Authentication failed: {authError}</span>
            </div>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <div className="fixed bottom-4 right-4 text-xs bg-black text-green-400 p-4 rounded font-mono max-w-sm z-50">
            <div className="mb-2 font-bold">Landing Page Debug:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {debugInfo.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center space-y-6 mb-12">
          <div className="space-y-4">
            <div className="text-sm tracking-[0.3em] opacity-60 font-mono">
              WAKE THE SIGNAL
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-2xl font-light leading-tight">
              Upload your interface. Get brutal feedback.
            </p>
            <p className="text-lg opacity-70 leading-relaxed">
              AI-powered analysis that cuts through the noise. Built for creators who want their designs to matter.
            </p>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="text-center mb-6">
            <p className="text-sm font-mono opacity-60">
              Try 1 free analysis • Sign up for 3/month • Pro for unlimited
            </p>
          </div>
        )}

        {isAtUploadLimit && (
          <div className="text-center mb-6">
            <p className="text-sm font-mono opacity-60">
              Monthly limit reached • Upgrade to Pro for unlimited analysis
            </p>
          </div>
        )}

        {!isAtUploadLimit ? (
          <UploadZone 
            isLoggedIn={isLoggedIn}
            showCooldown={false}
            onZombify={handleZombify}
          />
        ) : (
          <div className="zombify-card max-w-md mx-auto text-center">
            <p className="text-lg font-mono mb-4">Upload limit reached</p>
            <p className="text-sm opacity-70 mb-6">
              You've used all {profile?.monthly_limit} uploads this month
            </p>
            <button className="zombify-primary-button">
              Upgrade to Pro
            </button>
          </div>
        )}

        {isLoggedIn && profile && !isAtUploadLimit && (
          <div className="mt-6 text-center">
            <p className="text-xs font-mono opacity-60">
              {profile.plan_type === 'pro' 
                ? '⭐ Pro: Unlimited analysis' 
                : `${profile.feedback_count}/${profile.monthly_limit} uploads used this month`
              }
            </p>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-sm opacity-50 font-mono tracking-wide">
            Signal received. Pattern recognized. Wake them up.
          </p>
        </div>
      </div>
    </div>
  );
}