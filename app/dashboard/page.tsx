// FIXED SUPABASE AUTH DASHBOARD
// This addresses TypeScript errors and implements proper data loading

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MainHeader } from '@/components/MainHeader';
import UploadZone from '@/components/UploadZone';

interface FeedbackItem {
  id: string;
  score: number;
  created_at: string;
  user_id: string | null;
  is_guest: boolean;
  image_url: string;
  analysis?: any;
}

interface UserProfile {
  id: string;
  plan_type: 'free' | 'pro';
  feedback_count: number;
  monthly_limit: number;
}

// GLOBAL SUPABASE CLIENT - Create once and reuse
let globalSupabase: any = null;

function getSupabaseClient() {
  if (!globalSupabase) {
    console.log('🔧 Creating global Supabase client...');
    globalSupabase = createClientComponentClient();
  }
  return globalSupabase;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState('starting');
  
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    let mounted = true;
    
    const aggressiveInit = async () => {
      try {
        setAuthStep('checking_cache');
        
        // Check if we have cached user data
        const cachedUser = localStorage.getItem('zombify_user');
        if (cachedUser) {
          console.log('🔄 Using cached user data');
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          await loadDashboardDataDirect(userData.id);
          return;
        }
        
        setAuthStep('attempting_auth');
        
        // Try direct auth with aggressive timeout
        const authPromise = supabase.auth.getUser();
        const shortTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        try {
          const authResult = await Promise.race([authPromise, shortTimeout]);
          
          if (authResult.data?.user) {
            console.log('✅ Auth success, caching user');
            const userData = authResult.data.user;
            localStorage.setItem('zombify_user', JSON.stringify(userData));
            setUser(userData);
            await loadDashboardDataDirect(userData.id);
            return;
          } else {
            // No user found - redirect to landing page
            console.log('❌ No authenticated user, redirecting to home');
            localStorage.removeItem('zombify_user');
            router.replace('/');
            return;
          }
        } catch (authError) {
          console.log('❌ Auth failed, trying fallback...');
        }
        
        setAuthStep('fallback_mode');
        
        // FALLBACK: Try to load data without auth (guest mode)
        console.log('🔄 Attempting guest fallback...');
        await loadGuestData();
        
      } catch (err: any) {
        console.error('💥 All auth methods failed:', err);
        // If we're getting auth errors, probably signed out - redirect home
        if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' &&
            (err.message.includes('406') || err.message.includes('Unauthorized'))) {
          console.log('🚪 Auth error detected, redirecting to home');
          localStorage.removeItem('zombify_user');
          router.replace('/');
          return;
        }
        setError('Unable to connect. Please check your internet connection.');
        setLoading(false);
      }
    };
    
    aggressiveInit();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Load data directly with user ID using Supabase queries
  const loadDashboardDataDirect = async (userId: string) => {
    console.log('📊 Loading data directly for user:', userId);
    setAuthStep('loading_data');
    
    try {
      // Use direct Supabase queries instead of API calls
      const [profileResult, feedbackResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('feedback').select('*').or(`user_id.eq.${userId},and(user_id.is.null,is_guest.eq.true)`).order('created_at', { ascending: false }).limit(20)
      ]);
      
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        setProfile(profileResult.value.data);
        console.log('✅ Profile loaded via direct query');
      } else {
        console.log('⚠️ Profile query failed:', profileResult.status === 'rejected' ? profileResult.reason : 'No data');
        
        // Check if it's an auth error (406, 401, etc.)
        if (profileResult.status === 'rejected' && 
            profileResult.reason && 
            typeof profileResult.reason === 'object' && 
            'message' in profileResult.reason &&
            typeof profileResult.reason.message === 'string' &&
            profileResult.reason.message.includes('406')) {
          console.log('🚪 Auth error in profile query, redirecting to home');
          localStorage.removeItem('zombify_user');
          router.replace('/');
          return;
        }
        
        // Create default profile if none exists
        const defaultProfile: UserProfile = {
          id: userId,
          plan_type: 'free',
          feedback_count: 0,
          monthly_limit: 3
        };
        setProfile(defaultProfile);
      }
      
      if (feedbackResult.status === 'fulfilled' && feedbackResult.value.data) {
        setFeedback(feedbackResult.value.data);
        console.log('✅ Feedback loaded via direct query');
      } else {
        console.log('⚠️ Feedback query failed:', feedbackResult.status === 'rejected' ? feedbackResult.reason : 'No data');
        
        // Check if it's an auth error for feedback too
        if (feedbackResult.status === 'rejected' && 
            feedbackResult.reason && 
            typeof feedbackResult.reason === 'object' && 
            'message' in feedbackResult.reason &&
            typeof feedbackResult.reason.message === 'string' &&
            feedbackResult.reason.message.includes('406')) {
          console.log('🚪 Auth error in feedback query, redirecting to home');
          localStorage.removeItem('zombify_user');
          router.replace('/');
          return;
        }
        
        setFeedback([]);
      }
      
      setLoading(false);
      console.log('✅ Dashboard loaded via direct queries');
      
    } catch (err: any) {
      console.error('💥 Direct queries failed:', err);
      
      // Check for auth errors
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' &&
          (err.message.includes('406') || err.message.includes('401') || err.message.includes('Unauthorized'))) {
        console.log('🚪 Database auth error, redirecting to home');
        localStorage.removeItem('zombify_user');
        router.replace('/');
        return;
      }
      
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Guest mode fallback
  const loadGuestData = async () => {
    console.log('👤 Loading in guest mode...');
    setAuthStep('guest_mode');
    
    try {
      // Load recent guest feedback
      const { data: guestFeedback, error: guestError } = await supabase
        .from('feedback')
        .select('*')
        .is('user_id', null)
        .eq('is_guest', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (guestError) {
        console.error('Guest feedback error:', guestError);
      }
      
      setFeedback(guestFeedback || []);
      setLoading(false);
      console.log('✅ Guest mode loaded');
      
    } catch (err) {
      console.error('💥 Guest mode failed:', err);
      setError('Unable to load application');
      setLoading(false);
    }
  };

  // Clear cache and retry
  const clearCacheAndRetry = () => {
    localStorage.removeItem('zombify_user');
    sessionStorage.clear();
    window.location.reload();
  };

  // Handle navigation
  const handleNavigate = async (id: string) => {
    setNavigating(id);
    router.push(`/feedback/${id}`);
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_name', 'Untitled');
      if (user) {
        formData.append('user_id', user.id);
        formData.append('is_guest', 'false');
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="text-black font-mono text-center">
          <div className="text-2xl mb-4">⏳</div>
          <h1 className="text-xl mb-2">Loading Dashboard...</h1>
          <p className="text-sm opacity-60 capitalize">
            {authStep.replace('_', ' ')}...
          </p>
          {authStep === 'attempting_auth' && (
            <div className="mt-4">
              <div className="text-xs opacity-40">
                If this takes too long, there may be a connection issue
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="text-black font-mono text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl mb-4">Connection Error</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={clearCacheAndRetry}
              className="w-full px-4 py-2 bg-black text-white rounded"
            >
              Clear Cache & Retry
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 border border-black rounded"
            >
              Simple Retry
            </button>
            <button 
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 border border-gray-400 rounded text-gray-600"
            >
              Go Home
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Current step: {authStep.replace('_', ' ')}
          </div>
        </div>
      </div>
    );
  }

  const isGuest = !user;
  const isAtUploadLimit = !isGuest && profile?.plan_type === 'free' && (profile?.feedback_count || 0) >= (profile?.monthly_limit || 3);
  const avgScore = feedback.length > 0 ? Math.round(feedback.reduce((acc, f) => acc + f.score, 0) / feedback.length) : 0;

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono">
      <MainHeader variant="app" />
      
      <div className="pt-20 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">ZOMBIFY DASHBOARD</h1>
            <p className="text-lg opacity-70">
              {isGuest ? 'Browse recent analyses' : 'Upload and manage your interface analyses'}
            </p>
            {isGuest && (
              <div className="mt-2 text-sm text-orange-600">
                ⚠️ Running in guest mode - <button onClick={clearCacheAndRetry} className="underline">retry login</button>
              </div>
            )}
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
                {isGuest ? '—' : profile?.feedback_count || 0}
                {!isGuest && profile?.plan_type === 'free' && (
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
                {isGuest ? (
                  <span className="text-orange-600">GUEST</span>
                ) : profile?.plan_type === 'pro' ? (
                  <span className="text-purple-600">⭐ PRO</span>
                ) : (
                  <span>FREE</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">
                {isGuest ? 'RECENT ACTIVITY' : 'NEW ANALYSIS'}
              </h2>
              
              {!isGuest && !isAtUploadLimit ? (
                <UploadZone 
                  isLoggedIn={true}
                  showCooldown={false}
                  onZombify={handleUpload}
                />
              ) : !isGuest ? (
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
              ) : null}

              {/* Recent Analyses */}
              <div className={!isGuest ? "mt-8" : ""}>
                {!isGuest && <h2 className="text-2xl font-bold mb-6">RECENT ACTIVITY</h2>}
                
                {feedback.length === 0 ? (
                  <div className="bg-white border border-black/20 rounded p-12 text-center">
                    <div className="text-4xl opacity-20 mb-4">📊</div>
                    <p className="text-lg opacity-60 mb-2">No analyses yet</p>
                    <p className="text-sm opacity-40">
                      {isGuest ? 'No recent guest analyses found' : 'Upload your first interface above to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((item) => (
                      <div 
                        key={item.id} 
                        className={`bg-white border border-black/20 rounded p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
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
                              </h3>
                              <span className="text-lg font-bold">{item.score}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-60">
                              <span>{item.user_id ? 'User' : 'Guest'}</span>
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            {navigating === item.id && (
                              <div className="text-xs text-blue-600 mt-1">Navigating...</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Stats */}
              <div className="bg-white border border-black/20 rounded p-6">
                <h3 className="text-lg font-bold mb-4">QUICK INSIGHTS</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Best Score</span>
                    <span className="font-bold">
                      {feedback.length > 0 ? Math.max(...feedback.map(f => f.score)) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">This Week</span>
                    <span className="font-bold">
                      {feedback.filter(f => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(f.created_at) > weekAgo;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Average</span>
                    <span className="font-bold">{avgScore}</span>
                  </div>
                </div>
              </div>

              {/* Status/Upgrade */}
              {isGuest ? (
                <div className="bg-blue-50 border border-blue-200 rounded p-6">
                  <h3 className="text-lg font-bold mb-4 text-blue-800">SIGN UP</h3>
                  <p className="text-sm mb-4">Create an account to upload and manage your own analyses.</p>
                  <button 
                    onClick={clearCacheAndRetry}
                    className="w-full px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                  >
                    TRY LOGIN AGAIN
                  </button>
                </div>
              ) : profile?.plan_type === 'free' ? (
                <div className="bg-purple-50 border border-purple-200 rounded p-6">
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
                  </div>
                  <button className="w-full mt-4 px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700">
                    UPGRADE NOW
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-6">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}