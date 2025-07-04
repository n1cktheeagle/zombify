'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import GenerationalRadarChart from '@/components/GenerationalRadarChart';
import { MainHeader } from '@/components/MainHeader';

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

interface RecentUpload {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
  analysis: any;
}

// Component to show recent uploads - Memoized to prevent unnecessary re-renders
const RecentUploads = React.memo(({ userId, currentId }: { userId: string; currentId: string }) => {
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchRecentUploads() {
      try {
        console.log('Fetching recent uploads for user:', userId);
        
        const { data, error } = await supabase
          .from('feedback')
          .select('id, image_url, score, created_at, analysis')
          .eq('user_id', userId)
          .neq('id', currentId) // Exclude current analysis
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('Recent uploads query result:', { data, error });

        if (error) {
          console.error('Error fetching recent uploads:', error);
          setRecentUploads([]);
        } else if (data) {
          setRecentUploads(data);
        }
      } catch (err) {
        console.error('Error fetching recent uploads:', err);
        setRecentUploads([]);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchRecentUploads();
    } else {
      setLoading(false);
    }
  }, [userId, currentId, supabase]);

  const getImageFileName = (url: string) => {
    if (!url) return 'Analysis';
    const segments = url.split('/');
    const filename = segments[segments.length - 1];
    return filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '') || 'Analysis';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-xs opacity-60">Loading recent uploads...</div>
      </div>
    );
  }

  if (recentUploads.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl opacity-30 mb-2">📊</div>
        <p className="text-xs opacity-60 leading-relaxed">
          No other uploads yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentUploads.map((upload) => (
        <button
          key={upload.id}
          onClick={() => router.push(`/feedback/${upload.id}`)}
          className="w-full p-2 rounded border border-black/10 hover:bg-black/5 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium truncate">
              {getImageFileName(upload.image_url)}
            </div>
            <span className="text-xs font-bold ml-2">{upload.score}</span>
          </div>
          <div className="text-xs opacity-60">
            {new Date(upload.created_at).toLocaleDateString()}
          </div>
        </button>
      ))}
    </div>
  );
});

RecentUploads.displayName = 'RecentUploads';

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [cooldownTime, setCooldownTime] = useState(60);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const supabase = createClientComponentClient();

  const openSignIn = () => {
    // Your sign in logic here
  };

  const openSignUp = () => {
    // Your sign up logic here
  };

  // SIMPLIFIED: Initialize page data without complex timeout logic
  useEffect(() => {
    let mounted = true;

    async function initializePage() {
      console.log('🚀 Starting initializePage for ID:', params.id);
      
      try {
        // SIMPLIFIED: Get user without timeout (fast check)
        console.log('🔐 Checking authentication...');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log('👤 Current user:', currentUser?.id || 'guest');
        
        if (mounted) {
          setUser(currentUser);
        }

        // SIMPLIFIED: Direct database query (RLS is disabled anyway)
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

  // ADDED: Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="text-black font-mono text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl mb-4">Unable to Load Analysis</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <p className="text-sm opacity-60 mb-6">ID: {params.id}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-black rounded hover:bg-gray-100"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="text-black font-mono text-center">
          <div className="text-2xl mb-4">⏳</div>
          <h1 className="text-xl mb-2">Loading Analysis...</h1>
          <p className="text-sm opacity-60">ID: {params.id}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="text-black font-mono text-center">
          <h1 className="text-2xl mb-4">Analysis Not Found</h1>
          <p className="mb-4">This analysis doesn't exist or you don't have permission to view it.</p>
          <p className="text-sm opacity-60 mb-4">ID: {params.id}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-black text-white font-mono hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!user;
  const isCooldownActive = !isLoggedIn && cooldownTime > 0;

  // Extract filename from image URL
  const getImageFileName = (url: string) => {
    if (!url) return 'Current Analysis';
    const segments = url.split('/');
    const filename = segments[segments.length - 1];
    return filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '') || 'Current Analysis';
  };

  // Parse analysis data from your actual table structure
  const analysis = data.analysis || {};
  const issues = data.issues || [];
  const score = data.score || 0;

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative">
      <MainHeader variant="app" />

      {/* Guest CTA - Only show for non-logged in users */}
      {!user && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-mono text-purple-800 mb-3">
              Want to zombify more designs? Create an account for 3 free analyses per month
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={openSignIn}
                className="text-sm font-mono px-4 py-2 border border-purple-400 text-purple-700 hover:bg-purple-50"
              >
                LOGIN
              </button>
              <button 
                onClick={openSignUp}
                className="text-sm font-mono px-4 py-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                SIGN UP FREE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="flex pt-20">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-[#f5f1e6] border-r border-black/10 flex-shrink-0 transition-all duration-300 overflow-hidden`}>
          {!sidebarCollapsed && (
            <div className="p-4 w-64">
              {/* Projects Section with Collapse Button */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide">Projects</h3>
                  <button 
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-6 h-6 border border-black/20 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
                    title="Collapse Sidebar"
                  >
                    <span className="text-xs">‹</span>
                  </button>
                </div>
                <div className="text-center py-4">
                  <div className="text-2xl opacity-30 mb-2">🔒</div>
                  <p className="text-xs opacity-60 leading-relaxed">
                    Projects are only available for Pro users
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-black/10 mb-4"></div>

              {/* Recent Section */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Recent</h3>
                
                {/* Current Analysis */}
                <div className="p-3 rounded bg-black/5 border border-black/10 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-green-600">CURRENT</div>
                    <div className="text-xs bg-black/10 px-1.5 py-0.5 rounded font-mono text-[10px]">
                      {analysis?.context?.replace('_', ' ') || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">
                    {getImageFileName(data.image_url)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60">Grip Score</span>
                    <span className="text-sm font-bold">{score}</span>
                  </div>
                </div>

                {/* Show recent uploads if user is logged in */}
                {user && (
                  <RecentUploads userId={user.id} currentId={params.id} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsed Sidebar Toggle Button */}
        {sidebarCollapsed && (
          <div className="bg-[#f5f1e6] border-r border-black/10 flex flex-col w-12">
            <div className="p-4">
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-6 h-6 border border-black/20 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
                title="Expand Sidebar"
              >
                <span className="text-xs">›</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            {/* Back to Dashboard Button */}
            <div className="pt-4 mb-6">
              <button 
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-sm font-mono text-black opacity-70 hover:opacity-100 transition-opacity"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold glitch-text">SIGNAL REPORT</h1>
              
              {/* Only show upgrade CTA if logged in */}
              {isLoggedIn && (
                <div className="text-right">
                  <div className="text-xs opacity-60 mb-1">Want deeper insights?</div>
                  <button className="zombify-primary-button px-6 py-2 text-sm font-bold tracking-wide">
                    UPGRADE TO PRO
                  </button>
                </div>
              )}
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Image and Generational Data */}
              <div className="lg:col-span-1 space-y-6">
                {/* Source Image */}
                <div className="zombify-card p-4">
                  <h3 className="text-lg font-bold mb-3">SOURCE MATERIAL</h3>
                  <img
                    src={data.image_url}
                    alt="Interface Analysis"
                    className="w-full h-auto rounded border border-black/20 max-h-64 object-contain"
                    onError={(e: any) => {
                      // Prevent infinite loop by only setting placeholder once
                      if (e.target.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxNzZWMTc2SDgwVjgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8dGV4dCB4PSIxMjgiIHk9IjE0MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=') {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxNzZWMTc2SDgwVjgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8dGV4dCB4PSIxMjgiIHk9IjE0MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                      }
                    }}
                  />
                  <p className="text-xs opacity-60 mt-2">
                    Analyzed • {new Date(data.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Generational Analysis */}
                {analysis?.generationalScores && (
                  <div className="zombify-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      {/* Only show Pro badge if logged in */}
                      {isLoggedIn && (
                        <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono ml-auto">
                          PRO INSIGHT
                        </div>
                      )}
                    </div>
                    
                    <GenerationalRadarChart 
                      scores={analysis.generationalScores}
                      primaryTarget={analysis.primaryTarget || 'millennials'}
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Grip Score and Analysis Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Grip Score */}
                <div className="zombify-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">GRIP SCORE</h2>
                    {analysis?.context && (
                      <span className="text-xs bg-black/10 px-2 py-1 rounded font-mono">
                        {analysis.context.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-5xl font-bold glitch-text mb-4">{score}</div>
                  <p className="opacity-70 text-sm">How well this cuts through the noise</p>
                  
                  <div className="mt-4 flex justify-between text-xs opacity-60">
                    <span>INVISIBLE</span>
                    <span>SIGNAL</span>
                    <span>AWAKENING</span>
                  </div>
                  <div className="relative h-2 bg-black/10 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {/* Pattern Recognition */}
                <div className="zombify-card p-6">
                  <h3 className="text-xl font-bold mb-4">PATTERN RECOGNITION</h3>
                  <div className="space-y-4">
                    {issues.slice(0, isLoggedIn ? 3 : issues.length).map((issue: string, i: number) => (
                      <div key={i} className="border-l-4 border-red-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-red-500">⚡</span>
                          <span className="font-medium text-sm">{issue}</span>
                        </div>
                        {analysis?.insights?.[i] && (
                          <p className="text-xs italic opacity-70 ml-6">
                            "{analysis.insights[i]}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signal Amplification */}
                {analysis?.recommendations && analysis.recommendations.length > 0 && (
                  <div className="zombify-card p-6">
                    <h3 className="text-xl font-bold mb-4">SIGNAL AMPLIFICATION</h3>
                    <div className="space-y-3">
                      {analysis.recommendations.slice(0, isLoggedIn ? 2 : analysis.recommendations.length).map((rec: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-green-500 mt-1">▲</span>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA Section - Only show if NOT logged in */}
            {!isLoggedIn && (
              <div className="mt-12 text-center py-8 border-t border-black/10">
                <h3 className="text-lg font-bold mb-2">WANT MORE DETAILED ANALYSIS?</h3>
                <p className="text-sm opacity-70 mb-4 max-w-md mx-auto">
                  Sign up for free to track your design progress and unlock advanced insights.
                </p>
                <button className="zombify-primary-button px-8 py-3 text-lg font-bold tracking-wide mb-4">
                  SIGN UP FREE
                </button>
                <div className="text-xs opacity-50 font-mono">
                  Signal received. Pattern recognized. Wake them up.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}