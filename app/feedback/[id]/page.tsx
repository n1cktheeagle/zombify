'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MainHeader } from '@/components/MainHeader';
import { canUserUpload, incrementFeedbackCount } from '@/lib/auth';
import UploadZone from '@/components/UploadZone';

type AppState = 'dashboard' | 'analyzing' | 'complete';

interface AnalysisData {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
  analysis?: {
    context?: string;
  };
}

interface UserProfile {
  id: string;
  plan_type: 'free' | 'pro';
  feedback_count: number;
  monthly_limit: number;
}

export default function DashboardPage() {
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Initialize user and data
  useEffect(() => {
    let mounted = true;

    async function initializeDashboard() {
      try {
        // Get user auth state
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('Dashboard auth check:', { user: user?.id, error: authError });
        
        if (!mounted) return;

        if (!user) {
          router.push('/');
          return;
        }

        setUser(user);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData && !profileError) {
          setProfile(profileData);
        }

        // Fetch user's recent analyses
        const { data: analysesData, error: analysesError } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (analysesData && !analysesError) {
          setRecentAnalyses(analysesData);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const handleZombify = async (file: File) => {
    // Check upload permissions for authenticated users
    if (user && profile) {
      const canUpload = await canUserUpload(user.id);
      if (!canUpload) {
        alert('Upload limit reached! Upgrade to Pro for unlimited uploads.');
        return;
      }
    }

    setAppState('analyzing');
    setAnalysisProgress(0);

    try {
      // Start progress animation
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
      
      // Add user info
      if (user) {
        formData.append('user_id', user.id);
        formData.append('is_guest', 'false');
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!res.ok) {
        console.error('Response not ok:', res.status, res.statusText);
        throw new Error('Analysis failed');
      }

      const result = await res.json();
      console.log('Upload result:', result);
      
      if (result.success && result.feedbackId) {
        console.log('Redirecting to:', `/feedback/${result.feedbackId}`);
        // Brief completion state before redirect
        setAppState('complete');
        
        // Refresh user profile data to update counter
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        
        setTimeout(() => {
          router.push(`/feedback/${result.feedbackId}`);
        }, 800);
        return;
      }

      // If no feedbackId but we have redirectUrl, use that
      if (result.redirectUrl) {
        console.log('Using redirectUrl:', result.redirectUrl);
        setAppState('complete');
        setTimeout(() => {
          router.push(result.redirectUrl);
        }, 800);
        return;
      }

      console.error('No valid response format:', result);
      throw new Error(result.error || 'Analysis failed');

    } catch (err) {
      console.error('Upload error:', err);
      setAppState('dashboard');
      setAnalysisProgress(0);
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getImageFileName = (url: string) => {
    if (!url) return 'Analysis';
    const segments = url.split('/');
    const filename = segments[segments.length - 1];
    return filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '') || 'Analysis';
  };

  // Show analyzing screen
  if (appState === 'analyzing' || appState === 'complete') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-[#c8c8c8] font-mono relative overflow-hidden flex items-center justify-center">
        {/* Analysis screen content */}
        <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto p-8">
          <div className="space-y-4">
            <div className="text-4xl font-bold tracking-wider terminal-text">
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
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] text-black font-mono">
        <MainHeader variant="app" />
        
        <div className="pt-20 flex">
          {/* Sidebar - Always visible */}
          <div className="w-64 bg-[#f5f1e6] border-r border-black/10 flex-shrink-0 p-4">
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Projects</h3>
              <div className="text-center py-4">
                <div className="text-2xl opacity-30 mb-2">🔒</div>
                <p className="text-xs opacity-60 leading-relaxed">
                  Projects are only available for Pro users
                </p>
              </div>
            </div>
            <div className="border-t border-black/10 mb-4"></div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Recent</h3>
              <div className="text-center py-4">
                <div className="text-xs opacity-60">Loading...</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 px-6 py-4">
            <div className="flex items-center justify-center py-20">
              <div className="font-mono text-gray-600">Loading dashboard...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  const isAtUploadLimit = Boolean(profile && profile.plan_type === 'free' && profile.feedback_count >= profile.monthly_limit);
  const avgScore = recentAnalyses.length > 0 
    ? Math.round(recentAnalyses.reduce((acc, a) => acc + a.score, 0) / recentAnalyses.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono">
      <MainHeader variant="app" />
      
      <div className="pt-20 flex">
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
                
                {recentAnalyses.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-2xl opacity-30 mb-2">📊</div>
                    <p className="text-xs opacity-60 leading-relaxed">
                      Upload your first design to see recent analyses
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentAnalyses.slice(0, 5).map((analysis) => (
                      <button
                        key={analysis.id}
                        onClick={() => router.push(`/feedback/${analysis.id}`)}
                        className="w-full p-2 rounded border border-black/10 hover:bg-black/5 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-medium truncate">
                            {getImageFileName(analysis.image_url)}
                          </div>
                          <span className="text-xs font-bold ml-2">{analysis.score}</span>
                        </div>
                        <div className="text-xs opacity-60">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
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
        
        {/* Main Content */}
        <div className="flex-1 px-6 py-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold glitch-text mb-2">ZOMBIFY DASHBOARD</h1>
            <p className="text-lg opacity-70">Upload and manage your interface analyses</p>
          </div>

          {/* Stats Grid - Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="zombify-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Total Analyses</h3>
              <div className="text-3xl font-bold">{recentAnalyses.length}</div>
            </div>
            <div className="zombify-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">This Month</h3>
              <div className="text-3xl font-bold">
                {profile?.feedback_count || 0}
                {profile?.plan_type === 'free' && (
                  <span className="text-lg opacity-60">/{profile?.monthly_limit || 3}</span>
                )}
              </div>
            </div>
            <div className="zombify-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Avg Grip Score</h3>
              <div className="text-3xl font-bold">{avgScore || '—'}</div>
            </div>
            <div className="zombify-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Plan</h3>
              <div className="text-2xl font-bold">
                {profile?.plan_type === 'pro' ? (
                  <span className="text-purple-600">⭐ PRO</span>
                ) : (
                  <span>FREE</span>
                )}
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Upload Section - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">NEW ANALYSIS</h2>
                
                {!isAtUploadLimit ? (
                  <UploadZone 
                    isLoggedIn={true}
                    showCooldown={isAtUploadLimit}
                    onZombify={handleZombify}
                  />
                ) : (
                  <div className="zombify-card text-center p-8 border-red-200 bg-red-50/30">
                    <div className="text-4xl opacity-30 mb-4">🚫</div>
                    <p className="text-lg font-bold mb-2">Monthly limit reached</p>
                    <p className="text-sm opacity-70 mb-6">
                      You've used all {profile?.monthly_limit} uploads this month
                    </p>
                    <button className="zombify-primary-button">
                      UPGRADE TO PRO
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Analyses */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">RECENT ACTIVITY</h2>
                  {recentAnalyses.length > 5 && (
                    <button className="text-sm font-mono tracking-wide px-4 py-2 border border-black/20 text-black hover:bg-black/5 transition-all">
                      VIEW ALL
                    </button>
                  )}
                </div>
                
                {recentAnalyses.length === 0 ? (
                  <div className="zombify-card p-12 text-center">
                    <div className="text-4xl opacity-20 mb-4">📊</div>
                    <p className="text-lg opacity-60 mb-2">No analyses yet</p>
                    <p className="text-sm opacity-40">Upload your first interface above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentAnalyses.slice(0, 5).map((analysis) => (
                      <div 
                        key={analysis.id} 
                        className="zombify-card p-4 hover:bg-black/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/feedback/${analysis.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={analysis.image_url}
                            alt="Interface Analysis"
                            className="w-16 h-16 object-cover rounded border border-black/20"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium">{getImageFileName(analysis.image_url)}</h3>
                              <span className="text-lg font-bold">{analysis.score}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-60">
                              <span>{analysis.analysis?.context?.replace('_', ' ') || 'INTERFACE'}</span>
                              <span>{formatDate(analysis.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Insights & Upgrades */}
            <div className="space-y-6">
              
              {/* Quick Insights */}
              <div className="zombify-card p-6">
                <h3 className="text-lg font-bold mb-4">QUICK INSIGHTS</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Best Score</span>
                    <span className="font-bold">
                      {recentAnalyses.length > 0 ? Math.max(...recentAnalyses.map(a => a.score)) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">This Week</span>
                    <span className="font-bold">
                      {recentAnalyses.filter(a => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(a.created_at) > weekAgo;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Most Common</span>
                    <span className="font-bold text-xs">
                      {recentAnalyses.length > 0 ? 'INTERFACE' : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pro Features or Upgrade */}
              {profile?.plan_type === 'free' ? (
                <div className="zombify-card p-6 border-purple-200 bg-purple-50/30">
                  <h3 className="text-lg font-bold mb-4 text-purple-800">UPGRADE TO PRO</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">◆</span>
                      <span>Unlimited analyses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">◆</span>
                      <span>Advanced insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">◆</span>
                      <span>Project organization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">◆</span>
                      <span>Priority support</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 zombify-primary-button">
                    UPGRADE NOW
                  </button>
                </div>
              ) : (
                <div className="zombify-card p-6 border-green-200 bg-green-50/30">
                  <h3 className="text-lg font-bold mb-4 text-green-800">PRO FEATURES</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Unlimited uploads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Advanced analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Project management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              <div className="zombify-card p-6">
                <h3 className="text-lg font-bold mb-4">USAGE THIS MONTH</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Uploads</span>
                    <span>{profile?.feedback_count || 0}/{profile?.plan_type === 'free' ? profile?.monthly_limit || 3 : '∞'}</span>
                  </div>
                  {profile?.plan_type === 'free' && (
                    <div className="w-full bg-black/10 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-green-500 to-orange-500 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, ((profile?.feedback_count || 0) / (profile?.monthly_limit || 3)) * 100)}%` 
                        }}
                      />
                    </div>
                  )}
                  <div className="text-xs opacity-60 text-center mt-2">
                    {profile?.plan_type === 'free' 
                      ? `${(profile?.monthly_limit || 3) - (profile?.feedback_count || 0)} uploads remaining`
                      : 'Unlimited uploads'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}