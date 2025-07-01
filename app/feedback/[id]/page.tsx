import { createSupabaseServerClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import GenerationalRadarChart from '@/components/GenerationalRadarChart';
import UploadZone from '@/components/UploadZone';
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function FeedbackPage({ params }: { params: { id: string } }) {
  // Use dynamic import like in the upload route
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  console.log('Looking for feedback with ID:', params.id);

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', params.id)
    .single();

  console.log('Feedback query result:', { data, error });

  if (error || !data) {
    console.log('Database error:', error);
    notFound();
  }

  // For now, assume user is not logged in - you'll update this with real auth later
  const isLoggedIn = false;

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative">
      {/* Subtle scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

      {/* Top Navigation - Consistent with landing page */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[#f5f1e6]/90 backdrop-blur-sm border-b border-black/10">
        {/* Logo */}
        <div className="text-2xl font-bold tracking-tight text-black">
          ZOMBIFY
        </div>
        
        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <button className="text-sm font-mono tracking-wide text-black opacity-70 hover:opacity-100 transition-opacity">
            LOGIN
          </button>
          <button className="text-sm font-mono tracking-wide px-4 py-2 border border-black/20 text-black hover:border-black/40 hover:bg-black/5 transition-all">
            SIGN UP
          </button>
        </div>
      </nav>

      <div className="pt-24 p-6 max-w-7xl mx-auto">
        {/* Upload Zone - Always visible but conditionally functional */}
        <div className="mb-8">
          <UploadZone 
            isLoggedIn={isLoggedIn}
            showCooldown={!isLoggedIn}
            cooldownSeconds={60}
            disabled={false}
          />
        </div>

        {/* Header with conditional CTA */}
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
          {/* Left Column - Image and Core Score */}
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

            {/* Grip Score */}
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
          </div>

          {/* Right Column - Analysis Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generational Analysis */}
            {data.analysis?.generationalScores && (
              <div className="zombify-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">DEMOGRAPHIC TARGETING</h3>
                    <p className="text-sm opacity-70">
                      Which generation feels this design the strongest
                    </p>
                  </div>
                  
                  {/* Only show Pro badge if logged in */}
                  {isLoggedIn && (
                    <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono">
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
                    <h4 className="font-bold mb-3">GENERATIONAL INSIGHTS</h4>
                    <div className="space-y-2">
                      {data.analysis.generationalInsights.slice(0, 2).map((insight: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-purple-500 mt-1">◆</span>
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))}
                      {/* Only show paywall if logged in and there are more insights */}
                      {isLoggedIn && data.analysis.generationalInsights.length > 2 && (
                        <div className="mt-3 p-3 bg-black/5 rounded border border-black/10">
                          <p className="text-sm opacity-70 text-center">
                            +{data.analysis.generationalInsights.length - 2} more insights available with Pro
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
  );
}