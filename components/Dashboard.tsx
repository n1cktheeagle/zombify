'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import UploadZone from '@/components/UploadZone';
import { useAuth } from '@/hooks/useAuth';
import { ZombifyAnalysis } from '@/types/analysis';

interface FeedbackItem {
  id: string;
  score: number;
  created_at: string;
  user_id: string | null;
  is_guest: boolean;
  image_url: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this upload? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete upload');
      setFeedback(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete upload. Please try again.');
    } finally {
      setDeletingId(null);
    }
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">DASHBOARD</h1>
          <p className="text-lg opacity-70">
            Welcome back, {user.email?.split('@')[0]}! Upload and manage your interface analyses.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-black/20 p-6 rounded">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Total Analyses</h3>
            <div className="text-3xl font-bold">{feedback.length}</div>
          </div>
          <div className="bg-white border border-black/20 p-6 rounded">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">This Month</h3>
            <div className="text-3xl font-bold">
              {profile?.feedback_count || 0}
              {profile?.plan_type === 'free' && (
                <span className="text-lg opacity-60">/{profile?.monthly_limit || 3}</span>
              )}
            </div>
          </div>
          <div className="bg-white border border-black/20 p-6 rounded">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Avg Score</h3>
            <div className="text-3xl font-bold">{avgScore || '—'}</div>
          </div>
          <div className="bg-white border border-black/20 p-6 rounded">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Status</h3>
            <div className="text-2xl font-bold">
              {profile?.plan_type === 'pro' ? (
                <span className="text-purple-600">⭐ PRO</span>
              ) : (
                <span>FREE</span>
              )}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">NEW ANALYSIS</h2>
          
          {!isAtUploadLimit ? (
            <UploadZone 
              isLoggedIn={true}
              showCooldown={false}
              onZombify={handleUpload}
            />
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-8 text-center">
              <div className="text-4xl opacity-30 mb-4">🚫</div>
              <p className="text-lg font-bold mb-2">Monthly limit reached</p>
              <p className="text-sm opacity-70 mb-6">
                You've used all {profile?.monthly_limit} uploads this month
              </p>
              <button className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700">
                UPGRADE TO PRO
              </button>
            </div>
          )}
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-2xl font-bold mb-6">RECENT ACTIVITY</h2>
          
          {feedback.length === 0 ? (
            <div className="bg-white border border-black/20 rounded p-12 text-center">
              <div className="text-4xl opacity-20 mb-4">📊</div>
              <p className="text-lg opacity-60 mb-2">No analyses yet</p>
              <p className="text-sm opacity-40">
                Upload your first interface above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => {
                // Check if this is new format
                const isNew = isNewAnalysisFormat(item.analysis);
                const score = isNew 
                  ? item.analysis.gripScore.overall 
                  : (item.score || 0);
                const verdict = isNew ? item.analysis.verdict : null;
                const context = isNew ? item.analysis.context : null;
                const industry = isNew ? item.analysis.industry : null;

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white border border-black/20 rounded p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                      navigating === item.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <div className="flex items-center gap-4">
                      {navigating === item.id ? (
                        <div className="w-16 h-16 bg-gray-100 rounded border border-black/20 flex items-center justify-center">
                          <div className="text-xs">⏳</div>
                        </div>
                      ) : (
                        <img
                          src={item.image_url}
                          alt="Analysis"
                          className="w-16 h-16 object-cover rounded border border-black/20"
                          onError={(e: any) => {
                            if (e.target.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMSAyMUg0M1Y0M0gyMVYyMVoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+PC9wPgo8L3N2Zz4K') {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMSAyMUg0M1Y0M0gyMVYyMVoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+PC9wPgo8L3N2Zz4K';
                            }
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium">
                            Analysis #{item.id.slice(0, 8)}
                            {context && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {context.replace('_', ' ')}
                              </span>
                            )}
                            {industry && industry !== 'UNKNOWN' && (
                              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {industry}
                              </span>
                            )}
                          </h3>
                          <span className="text-lg font-bold">{score}</span>
                        </div>
                        {/* Verdict Summary */}
                        {verdict?.summary && (
                          <p className="text-sm text-gray-700 mb-1 line-clamp-1">
                            {verdict.summary}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs opacity-60">
                          <span>{item.user_id ? 'User' : 'Guest'}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {navigating === item.id && (
                          <div className="text-xs text-blue-600 mt-1">Navigating...</div>
                        )}
                      </div>
                      {/* Delete Button */}
                      <button
                        className="ml-4 px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete upload"
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        disabled={deletingId === item.id}
                        aria-label="Delete upload"
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}