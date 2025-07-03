'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import GenerationalRadarChart from '@/components/GenerationalRadarChart';
import { MainHeader } from '@/components/MainHeader';

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(60);
  const [user, setUser] = useState(null);

  const openSignIn = () => {
    // Your sign in logic here
  };

  const openSignUp = () => {
    // Your sign up logic here
  };

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching data for ID:', params.id); // DEBUG
        
        // Use the same client setup as your dashboard/working pages
        const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs');
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        
        // Try the component client first (like your working pages)
        const supabase = createClientComponentClient();

        const { data: result, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('id', params.id)
          .single();

        console.log('Database query result:', { result, error }); // DEBUG

        if (error) {
          console.error('Database error details:', error); // DEBUG
          // Don't return here, let it fall through to show 404
        }
        
        if (!result) {
          console.log('No data found for ID:', params.id); // DEBUG
          // Don't return here, let it fall through to show 404
        }

        if (result && !error) {
          console.log('Data loaded successfully:', result); // DEBUG
          setData(result);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

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

  if (loading) {
    return <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
      <div className="text-black font-mono">Loading...</div>
    </div>;
  }

  if (!data) {
    notFound();
  }

  const isLoggedIn = false; // Set based on actual auth state
  const isCooldownActive = !isLoggedIn && cooldownTime > 0;

  // Extract filename from image URL
  const getImageFileName = (url: string) => {
    if (!url) return 'Current Analysis';
    const segments = url.split('/');
    const filename = segments[segments.length - 1];
    return filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '') || 'Current Analysis';
  };

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative flex flex-col">
      
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

      {/* Back to Dashboard Button */}
      <div className="pt-24 px-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-mono text-black opacity-70 hover:opacity-100 transition-opacity mb-6"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Main Content Area with Sidebar - Account for fixed nav */}
      <div className="flex pt-24">
        {/* Sidebar - Fixed */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-[#f5f1e6] border-r border-black/10 flex-shrink-0 transition-all duration-300 overflow-hidden fixed left-0 top-20 bottom-0 z-40`}>
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
                <div className="p-3 rounded bg-black/5 border border-black/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-green-600">CURRENT</div>
                    <div className="text-xs bg-black/10 px-1.5 py-0.5 rounded font-mono text-[10px]">
                      {data.analysis?.context?.replace('_', ' ') || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">
                    {getImageFileName(data.image_url)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60">Grip Score</span>
                    <span className="text-sm font-bold">{data.score}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsed Sidebar Toggle Button - Inline Position */}
        {sidebarCollapsed && (
          <div className="fixed left-0 top-24 bottom-0 bg-[#f5f1e6] border-r border-black/10 z-40 flex flex-col">
            <div className="p-4">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div></div>
                  <button 
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-6 h-6 border border-black/20 rounded flex items-center justify-center hover:bg-black/5 transition-colors"
                    title="Expand Sidebar"
                  >
                    <span className="text-xs">›</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area - Account for fixed sidebar */}
        <div className={`flex-1 p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-64'}`}>
          <div className="max-w-6xl mx-auto w-full">
            


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

            {/* Main Grid Layout - Rearranged */}
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
                  />
                  <p className="text-xs opacity-60 mt-2">
                    Analyzed • {new Date(data.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Generational Analysis - Moved to left */}
                {data.analysis?.generationalScores && (
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
                      scores={data.analysis.generationalScores}
                      primaryTarget={data.analysis.primaryTarget || 'millennials'}
                    />
                    
                    {/* Generational Insights */}
                    {data.analysis.generationalInsights && data.analysis.generationalInsights.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-black/10">
                        <h4 className="font-bold mb-3 text-sm">GENERATIONAL INSIGHTS</h4>
                        <div className="space-y-2">
                          {data.analysis.generationalInsights.slice(0, isLoggedIn ? 2 : data.analysis.generationalInsights.length).map((insight: string, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="text-purple-500 mt-1">◆</span>
                              <span className="text-xs">{insight}</span>
                            </div>
                          ))}
                          {/* Only show paywall if logged in and there are more insights */}
                          {isLoggedIn && data.analysis.generationalInsights.length > 2 && (
                            <div className="mt-3 p-3 bg-black/5 rounded border border-black/10">
                              <p className="text-xs opacity-70 text-center">
                                +{data.analysis.generationalInsights.length - 2} more insights available with Pro
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Grip Score and Analysis Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Grip Score - Moved to right */}
                <div className="zombify-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">GRIP SCORE</h2>
                    {data.analysis?.context && (
                      <span className="text-xs bg-black/10 px-2 py-1 rounded font-mono">
                        {data.analysis.context.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-5xl font-bold glitch-text mb-4">{data.score}</div>
                  <p className="opacity-70 text-sm">How well this cuts through the noise</p>
                  
                  <div className="mt-4 flex justify-between text-xs opacity-60">
                    <span>INVISIBLE</span>
                    <span>SIGNAL</span>
                    <span>AWAKENING</span>
                  </div>
                  <div className="relative h-2 bg-black/10 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                </div>

                {/* Pattern Recognition */}
                <div className="zombify-card p-6">
                  <h3 className="text-xl font-bold mb-4">PATTERN RECOGNITION</h3>
                  <div className="space-y-4">
                    {/* Show all issues for non-logged in users, paywall for logged in users */}
                    {(data.issues || []).slice(0, isLoggedIn ? 3 : data.issues?.length || 0).map((issue: string, i: number) => (
                      <div key={i} className="border-l-4 border-red-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-red-500">⚡</span>
                          <span className="font-medium text-sm">{issue}</span>
                        </div>
                        {data.analysis?.insights?.[i] && (
                          <p className="text-xs italic opacity-70 ml-6">
                            "{data.analysis.insights[i]}"
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {/* Only show paywall if logged in and there are more issues */}
                    {isLoggedIn && data.issues && data.issues.length > 3 && (
                      <div className="mt-4 p-4 bg-black/5 rounded border border-black/10 text-center">
                        <p className="text-sm opacity-70 mb-3">
                          +{data.issues.length - 3} more critical issues detected
                        </p>
                        <button className="text-xs font-mono tracking-wide px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 transition-all">
                          UNLOCK WITH PRO
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signal Amplification */}
                {data.analysis?.recommendations && data.analysis.recommendations.length > 0 && (
                  <div className="zombify-card p-6">
                    <h3 className="text-xl font-bold mb-4">SIGNAL AMPLIFICATION</h3>
                    <div className="space-y-3">
                      {/* Show all recommendations for non-logged in users, limit for logged in users */}
                      {data.analysis.recommendations.slice(0, isLoggedIn ? 2 : data.analysis.recommendations.length).map((rec: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-green-500 mt-1">▲</span>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                      
                      {/* Only show paywall if logged in and there are more recommendations */}
                      {isLoggedIn && data.analysis.recommendations.length > 2 && (
                        <div className="mt-4 p-4 bg-black/5 rounded border border-black/10 text-center">
                          <p className="text-sm opacity-70 mb-3">
                            +{data.analysis.recommendations.length - 2} more strategic recommendations
                          </p>
                          <button className="text-xs font-mono tracking-wide px-4 py-2 border border-green-300 text-green-700 hover:bg-green-50 transition-all">
                            UNLOCK WITH PRO
                          </button>
                        </div>
                      )}
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