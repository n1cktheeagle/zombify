'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import UploadZone from '@/components/UploadZone';
import { useAuth } from '@/hooks/useAuth';
import { ZombifyAnalysis } from '@/types/analysis';
import EthicsScore from '@/components/EthicsScore';

interface FeedbackItem {
  id: string;
  score: number;
  created_at: string;
  user_id: string | null;
  is_guest: boolean;
  image_url: string;
  original_filename: string | null;
  analysis?: ZombifyAnalysis | any; // Support both new and old formats
}

// Helper to check if analysis is new format
function isNewAnalysisFormat(analysis: any): analysis is ZombifyAnalysis {
  return analysis && 
    typeof analysis === 'object' && 
    'gripScore' in analysis && 
    'verdict' in analysis;
}

export default function Dashboard() {
  const { user, profile, loading: authLoading, initialized } = useAuth();
  
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [latestDarkPatterns, setLatestDarkPatterns] = useState<any>(undefined);
  const [latestFeedbackId, setLatestFeedbackId] = useState<string | undefined>(undefined);
  const [showDarkPatternsModal, setShowDarkPatternsModal] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Auth guard - Redirect if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      console.log('🚪 No authenticated user, redirecting to landing page');
      router.replace('/');
      return;
    }
  }, [initialized, user, router]);

  // Load dashboard-specific data
  useEffect(() => {
    if (!initialized || !user) {
      console.log('⏳ Waiting for auth initialization...');
      return;
    }

    const loadFeedback = async () => {
      try {
        console.log('📊 Loading feedback for authenticated user:', user.id);
        
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .or(`user_id.eq.${user.id},and(user_id.is.null,is_guest.eq.true)`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (feedbackError) {
          console.error('❌ Feedback query failed:', feedbackError);
          
          if (feedbackError.message?.includes('406') || 
              feedbackError.message?.includes('403') || 
              feedbackError.message?.includes('Unauthorized')) {
            console.log('🚪 Auth error in feedback query - user may be deleted');
            return;
          }
          
          setError('Failed to load your analyses');
        } else {
          setFeedback(feedbackData || []);
          console.log('✅ Feedback loaded successfully');
          
          // Check if the most recent analysis has dark patterns
          if (feedbackData && feedbackData.length > 0) {
            const mostRecent = feedbackData[0];
            if (isNewAnalysisFormat(mostRecent.analysis)) {
              setLatestDarkPatterns(mostRecent.analysis.darkPatterns);
              setLatestFeedbackId(mostRecent.id);
            }
          }
        }
      } catch (err: any) {
        console.error('💥 Error loading feedback:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [initialized, user, supabase]);

  // Handle file upload
  const handleUpload = async (file: File) => {
    if (!user) {
      console.error('❌ Cannot upload: user not authenticated');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_name', 'Untitled');
      formData.append('user_id', user.id);
      formData.append('is_guest', 'false');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const result = await res.json();
      if (result.success && result.feedbackId) {
        router.push(`/feedback/${result.feedbackId}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
    }
  };

  // Handle navigation
  const handleNavigate = async (id: string) => {
    setNavigating(id);
    router.push(`/feedback/${id}`);
  };


  // Show loading while auth is initializing
  if (authLoading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-black font-mono text-center">
          <div className="text-2xl mb-4">🔐</div>
          <h1 className="text-xl mb-2">Checking Authentication...</h1>
          <p className="text-sm opacity-60">Please wait...</p>
        </div>
      </div>
    );
  }

  // If no user after initialization, we're redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-black font-mono text-center">
          <div className="text-2xl mb-4">🔄</div>
          <h1 className="text-xl mb-2">Redirecting...</h1>
          <p className="text-sm opacity-60">Taking you to the landing page...</p>
        </div>
      </div>
    );
  }

  // Loading dashboard data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-black font-mono text-center">
          <div className="text-2xl mb-4">⏳</div>
          <h1 className="text-xl mb-2">Loading Dashboard...</h1>
          <p className="text-sm opacity-60">Getting your data ready...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="text-black font-mono text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl mb-4">Error Loading Dashboard</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-black text-white rounded"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 border border-gray-400 rounded text-gray-600"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats - handle both old and new formats
  const isAtUploadLimit = profile?.plan_type === 'free' && (profile?.feedback_count || 0) >= (profile?.monthly_limit || 3);
  const avgScore = feedback.length > 0 
    ? Math.round(
        feedback.reduce((acc, f) => {
          // Try to get score from new format first, then fall back to old format
          const score = isNewAnalysisFormat(f.analysis) 
            ? f.analysis.gripScore.overall 
            : (f.score || 0);
          return acc + score;
        }, 0) / feedback.length
      ) 
    : 0;

  return (
    <div className="p-12">
      <div>
        

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f5f1e6] p-4 border-2 border-black/70">
            <div className="text-xs text-black/60 mb-1 font-mono">[TOTAL_ANALYSES]</div>
            <div className="text-5xl font-bold font-mono mb-1">{feedback.length.toString().padStart(3, '0')}</div>
            <div className="text-xs text-black/60">└ all time</div>
          </div>
          <div className="bg-[#f5f1e6] p-4 border-2 border-black/70">
            <div className="text-xs text-black/60 mb-1 font-mono">[MONTH_USAGE]</div>
            <div className="text-5xl font-bold font-mono mb-1">
              {(profile?.feedback_count || 0).toString().padStart(3, '0')}
              {profile?.plan_type === 'free' && (
                <span className="text-3xl text-black/60">/{profile?.monthly_limit || 3}</span>
              )}
            </div>
            <div className="text-xs text-black/60">└ {profile?.plan_type === 'free' ? 'free tier' : 'pro tier'}</div>
          </div>
          <div className="bg-[#f5f1e6] p-4 border-2 border-black/70">
            <div className="text-xs text-black/60 mb-1 font-mono">[AVG_GRIP]</div>
            <div className="text-5xl font-bold font-mono mb-1">{avgScore ? avgScore.toString().padStart(3, '0') : '---'}</div>
            <div className="text-xs text-black/60">└ overall</div>
          </div>
          <div className="md:col-span-1">
            <EthicsScore 
              userId={user.id} 
              latestDarkPatterns={latestDarkPatterns}
              latestFeedbackId={latestFeedbackId}
              onShowDarkPatterns={() => setShowDarkPatternsModal(true)}
              feedback={feedback}
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 font-heading">NEW ANALYSIS</h2>
          
          {!isAtUploadLimit ? (
            <UploadZone 
              isLoggedIn={true}
              showCooldown={false}
              disableTypingAnimation={true}
              onZombify={handleUpload}
            />
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-8 text-center">
              <div className="text-4xl opacity-30 mb-4">🚫</div>
              <p className="text-lg font-bold mb-2">Monthly limit reached</p>
              <p className="text-sm opacity-70 mb-6">
                You&apos;ve used all {profile?.monthly_limit} uploads this month
              </p>
              <button className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700">
                UPGRADE TO PRO
              </button>
            </div>
          )}
        </div>

        {/* Recent Analyses */}
        <div>
                      <h2 className="text-2xl font-bold mb-6 font-heading">RECENT ACTIVITY</h2>
          
          {feedback.length === 0 ? (
            <div className="bg-white border border-black/20 rounded p-12 text-center">
              <div className="text-4xl opacity-20 mb-4">📊</div>
              <p className="text-lg opacity-60 mb-2">No analyses yet</p>
              <p className="text-sm opacity-40">
                Upload your first interface above to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedback.map((item, index) => {
                // Check if this is new format
                const isNew = isNewAnalysisFormat(item.analysis);
                const score = isNew 
                  ? item.analysis.gripScore.overall 
                  : (item.score || 0);
                const verdict = isNew ? item.analysis.verdict : null;
                const context = isNew ? item.analysis.context : null;
                const industry = isNew ? item.analysis.industry : null;

                const getScoreColor = (score: number) => {
                  if (score >= 80) return 'text-green-700';
                  if (score >= 60) return 'text-yellow-700';
                  return 'text-red-700';
                };

                // Generate timestamp for retro feel
                const timestamp = new Date(item.created_at);
                const unixTime = Math.floor(timestamp.getTime() / 1000);
                const retroDate = timestamp.toISOString().slice(0, 19).replace('T', ' ');

                return (
                  <div 
                    key={item.id} 
                    className={`bg-[#f5f1e6] cursor-pointer transition-all duration-200 relative font-mono text-xs border border-black/30 hover:bg-[#ebe7dc] hover:border-black/50 ${
                      navigating === item.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                    onClick={() => handleNavigate(item.id)}
                  >
                    {/* Retro scanlines */}
                    <div className="absolute inset-0 pointer-events-none" 
                         style={{
                           backgroundImage: `repeating-linear-gradient(
                             0deg,
                             transparent,
                             transparent 2px,
                             rgba(0, 0, 0, 0.02) 2px,
                             rgba(0, 0, 0, 0.02) 4px
                           )`
                         }}>
                    </div>

                    <div className="p-4 space-y-3 relative z-10">
                      {/* File header */}
                      <div className="border-b border-black/20 pb-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="text-black/80 font-bold">
                            {item.original_filename || `analysis_${item.id.slice(0, 8)}.ui`}
                          </div>
                          <div className={`font-bold text-sm ${getScoreColor(score)}`}>
                            GRIP:{score.toString().padStart(3, '0')}
                          </div>
                        </div>
                      </div>

                      {/* Date info */}
                      <div className="text-xs mb-3">
                        <div className="space-y-1">
                          <div className="text-black/40">UPLOADED:</div>
                          <div className="text-black/70 font-mono">{new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}</div>
                        </div>
                      </div>

                      {/* System tags */}
                      {(context || (industry && industry !== 'UNKNOWN')) && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {context && (
                              <span className="text-xs bg-black/20 text-black/80 px-1 font-mono">
                                {context.replace('_', ' ')}
                              </span>
                            )}
                            {industry && industry !== 'UNKNOWN' && (
                              <span className="text-xs bg-black/20 text-black/80 px-1 font-mono">
                                {industry}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Terminal-style image display */}
                      <div className="relative mb-3">
                        <div className="text-xs text-black/40 mb-1">
                          ┌─[ VISUAL_DATA ]─┐
                        </div>
                        {navigating === item.id ? (
                          <div className="w-full h-32 bg-black/10 border border-black/20 flex items-center justify-center">
                            <div className="text-black/60 font-mono text-sm">░░░ LOADING ░░░</div>
                          </div>
                        ) : (
                          <img
                            src={item.image_url}
                            alt="Analysis"
                            className="w-full h-32 object-cover border border-black/30"
                            onError={(e: any) => {
                              if (e.target.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDI1NiAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA0MEgxNzZWODhIODBWNDBaIiBmaWxsPSIjRDFENURCIi8+Cjwvc3ZnPgo=') {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDI1NiAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA0MEgxNzZWODhIODBWNDBaIiBmaWxsPSIjRDFENURCIi8+Cjwvc3ZnPgo=';
                              }
                            }}
                          />
                        )}
                      </div>

                      {/* System summary */}
                      {verdict?.summary && (
                        <div className="mb-3">
                          <div className="text-xs text-black/40 mb-1">
                            ├─[ ANALYSIS_LOG ]
                          </div>
                          <div className="bg-black/5 border-l-2 border-black/30 p-2 ml-3">
                            <p className="text-xs text-black/80 line-clamp-2 font-mono">
                              > {verdict.summary}
                            </p>
                          </div>
                        </div>
                      )}


                      {navigating === item.id && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <div className="text-black font-mono text-sm bg-[#f5f1e6] px-3 py-1 border border-black/40">
                            ░░░ ACCESSING FILE ░░░
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dark Patterns Modal */}
      {showDarkPatternsModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDarkPatternsModal(false)}
        >
          <div 
            className="bg-[#f5f1e6] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b-2 border-black p-4 flex items-center justify-between bg-black text-white">
              <h3 className="text-xl font-bold font-mono">UPLOADS WITH DARK PATTERNS</h3>
              <button 
                onClick={() => setShowDarkPatternsModal(false)}
                className="text-2xl hover:text-gray-300 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {(() => {
                const uploadsWithDarkPatterns = feedback.filter(item => {
                  if (isNewAnalysisFormat(item.analysis)) {
                    return item.analysis.darkPatterns && item.analysis.darkPatterns.length > 0;
                  }
                  return false;
                });

                if (uploadsWithDarkPatterns.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">✨</div>
                      <p className="text-lg font-mono">No uploads with dark patterns found!</p>
                      <p className="text-sm opacity-60 mt-2">Keep up the ethical design work.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <p className="text-sm font-mono opacity-70 mb-4">
                      Found {uploadsWithDarkPatterns.length} upload{uploadsWithDarkPatterns.length !== 1 ? 's' : ''} with dark patterns
                    </p>
                    {uploadsWithDarkPatterns.map((item) => {
                      const darkPatterns = item.analysis.darkPatterns;
                      const highCount = darkPatterns.filter((p: any) => p.severity === 'HIGH').length;
                      const mediumCount = darkPatterns.filter((p: any) => p.severity === 'MEDIUM').length;
                      const lowCount = darkPatterns.filter((p: any) => p.severity === 'LOW').length;

                      return (
                        <div
                          key={item.id}
                          className="border-2 border-black p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer bg-white"
                          onClick={() => {
                            setShowDarkPatternsModal(false);
                            handleNavigate(item.id);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold font-mono">
                                {item.original_filename || `Analysis #${item.id.slice(0, 8)}`}
                              </h4>
                              <p className="text-sm opacity-60">
                                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{item.analysis.gripScore.overall}</div>
                              <div className="text-xs opacity-60">Grip Score</div>
                            </div>
                          </div>

                          {/* Dark Pattern Summary */}
                          <div className="border-t border-black/20 pt-2 mt-2">
                            <div className="flex items-center gap-4 text-sm font-mono">
                              {highCount > 0 && (
                                <span className="text-red-600 font-bold">
                                  {highCount} HIGH
                                </span>
                              )}
                              {mediumCount > 0 && (
                                <span className="text-orange-600 font-bold">
                                  {mediumCount} MEDIUM
                                </span>
                              )}
                              {lowCount > 0 && (
                                <span className="text-yellow-600 font-bold">
                                  {lowCount} LOW
                                </span>
                              )}
                            </div>
                            
                            {/* Pattern Types */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {[...new Set(darkPatterns.map((p: any) => p.type))].map((type: string) => (
                                <span key={type} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                  {type.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="text-xs text-blue-600 mt-3 font-mono">
                            Click to view full analysis →
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}