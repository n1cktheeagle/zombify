'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
  import { useUpload } from '@/contexts/UploadContext';
  import UploadZone from '@/components/UploadZone';
import { MainHeader } from '@/components/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react'
import AuthNotifications from '@/components/AuthNotifications'
import Link from 'next/link'
import { AuthButton } from '@/components/AuthButton'
import GlitchLogo from '@/components/GlitchLogo'

type AppState = 'landing' | 'analyzing' | 'complete';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const { user, profile, loading, initialized } = useAuth();
  const router = useRouter();
  const { setLastUploadId } = useUpload();

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

  // Handle auth errors from URL - UPDATED with OAuth conflict handling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error') || urlParams.get('auth_error');
    const provider = urlParams.get('provider');
    
    if (error) {
      let errorMessage = '';
      
      // NEW: Handle OAuth conflict errors
      if (error === 'email_conflict' && provider) {
        errorMessage = `This email is already registered with email/password. Please sign in using that method instead of ${provider}.`;
        addDebugLog(`🚨 OAuth conflict detected: ${provider} attempted on email account`);
      } else if (error === 'security_check_failed' && provider) {
        errorMessage = `Security check failed for ${provider} sign-in. Please try again or contact support.`;
        addDebugLog(`🚨 Security check failed for ${provider}`);
      } else {
        // Handle existing error types
        const details = urlParams.get('details');
        errorMessage = details ? `${error}: ${decodeURIComponent(details)}` : decodeURIComponent(error);
        addDebugLog(`Auth error from URL: ${errorMessage}`);
      }
      
      // Only show error if it's a recent one (not from cache/previous attempts)
      if (!error.includes('auth_failed')) {
        setAuthError(errorMessage);
      }
      
      // Always clean URL regardless
      window.history.replaceState({}, '', window.location.pathname);
      
      // Clear error after 5 seconds (longer for conflict errors)
      setTimeout(() => setAuthError(null), 5000);
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

  // Typing animation effect
  useEffect(() => {
    if (!showContent) return;
    
    const fullText = 'Interface analysis engine for the modern day zombie';
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
    
    return () => clearInterval(typeInterval);
  }, [showContent]);

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
        // Refresh sidebar to include the new upload
        setLastUploadId(result.feedbackId);
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

      {/* Custom header without box */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        {/* Logo with image */}
        <GlitchLogo 
          onClick={() => router.push('/')}
          className="text-xl"
        />
        
        {/* Auth Component */}
        <AuthButton />
      </nav>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* UPDATED: Enhanced Auth Error Message */}
        {authError && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded font-mono text-sm max-w-lg shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-bold mb-1">Authentication Error</div>
                <div className="text-xs leading-relaxed">{authError}</div>
              </div>
            </div>
          </div>
        )}

        {/* ASCII Art */}
        <div className="mb-20 select-none flex justify-center cursor-pointer ascii-container">
          <pre className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-original transition-opacity duration-[2000ms] ease-out">
{`                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                          %%#%%@                                                                    
                       %##+--=++**######%%##%                                                       
                    %##+-:::::::::::::--==++*#######%%%@                                            
                 %##=::::::::::::::::::::::::::::::-=+*######%%%@                                   
              %#*-....:::::::::::::::::::::::::::::::::::::::-==+**#####%%%%%%                      
             @#-...................::::::::::::::::::::::::::::::::::::--==+*#@@                    
             @#-.:::::::::::::...............::::::::::::::::::::::::::::::-+*@@                    
             %#-.:::----:::::::::::::::::...............::::::::::::::::-++++*@@%%%%%@              
             %#-.::=+#%##*++====---::::::::::::::::::...............:-=++++++*@+:-=+*@@             
             %#-.::=+@@@@@@@@@@@@%#**+=+====--:::::::::::::::::::...:=*++++++*@+-++++@@             
             %#-.::=+%@@@@@@@@@@@@@@@@@@@@@@%#**++++===--:::::::::::-+#++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@@@@@@@@@%%@@@@@@@@@@@@@@@@%%#**+==::::-+#++++++*@#+++++@@             
             %#-.::=+@@@@@@@@@@@@%*+:....-@@%+=+%@@@@@@@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@@#:.........@*:....:-=*@@@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@%*=:::::..:-@*:--::.::=%@@@@@@@@@#..::-+*++++++*@#+++++@@             
              #-.::=+@@@@@@@@#-..........:%+--::.....:*@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+@@@@@@@%+-.::::--:-::%-.........:=#@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@%=:...:::.-=..%=..:-:.....:+@@@@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+%@@@@@%+---....::...-%-:-::..::::-*@@@@@@@#..::-+#++++++#@#+++++@@             
             @#-.::=+%@@@@%+-....-....:..:#=:::.:::.:..:=%@@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@%#-.....-:-...:#=...-:...--::=*%@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@*-:-.......:::#=.:::-=++=:..-*%@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@@#=:..:..:...:#=.........:----#@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@@@%*:..::....:%+.:::::-==...+@@@@@@#..::-+*++++++*@#+++*%@@             
             @#-.::=+@@@@@@@@@@@%*-:::::.:%+:...:::..::=#@@@@@@#..::-+*++++++#@#+*@@@               
             @#-.::=+@@@@@@@@@@@@#-:....::@*-:.:.:..:-*@@@@@@@@#..::-+*++++++#@%@@@                 
             @#-.::=+@@@@@@@@@@@@@@@#=-=+@@@+:..:--=#@@@@@@@@@@#..::-+*++++++#@@@                   
             %#-.::=+#@@@@@@@@@@@@@@@@@@@@@@@@@%@%@@@@@@@@@@@@@#..::-+*++++++#@%@@@@@@@@@           
             %#-.:::........-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++++**@@          
             %#-.::::::::::::........:-=+*#%@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++=-=+%@          
              %#=====--:::::::::::::::::........:--+#%@@@@@@@@@*..::-+*+++++*@@+++=-=+++%@          
                 @@@@@%#*++++==--:::::::::::::::::..........-+#+..::-+*+++*@@*++=-++++++%@          
              %%*=:-++++**#%%@@%%%#***+===---:::::::::::::::.....:::=+*+#@%*++==++++++++%@          
           %#*-::::::---==++*@@%#**+**##%%@%%#*++===--::::::::::::::=*@@#*++==++++++++++%@          
          %*...........:::::::::-+#@@@@@@%#*+++*#%@@@%#*++++==-::::-@@*++=-+++++++++++++%@          
          %*..:::::::............::::::::-+*#%%@@@@%##@@@%#%@%%%##*#*++=-+++++++++++++++%@          
          %*..::::::::::::::::::............::::::--=+++++++++++++++=-=++++++++++++++++#@@          
          %*..::::::::::::::::::::::::::::............::::::::--==--=++++++++++++++++%@@            
          %*..:::::::::::::::::::::::::::::::::::::.............:-++++++++++++++++*%@@              
          %*..::::::::::::::::::::::::::::::::===--:::::::::::..-+*+++++++++++++#@@@                
          %#:::::::::::::::::::::::::::::::::=*@@@%#*++*+=-:::::+**+++++++++++#@@                   
           @@##**++==----:::::::::::::::::::::.....-=*#%@@@*::::+**++++++++*%@@                     
             @@@@@@@@@%%#**+====---:::::::::::::::::::......::::+**++++++*@@@                       
                         @@@@@@@@%#*+=+++=--::::::::::::::::::::+**++++*@@@                         
                                  @@@@@@@@%##**++===---:::::::::+**++#@@@                           
                                           @@@@@@@@@%%##*+=====-+*#%@@                              
                                                       @@@@@@@@@%@@@                                
                                                                @@                                  
                                                                                                    
                                                                                                    
                                                                                                    `}
          </pre>
          <pre className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-fragment left">
{`                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                          %%#%%@                                                                    
                       %##+--=++**######%%##%                                                       
                    %##+-:::::::::::::--==++*#######%%%@                                            
                 %##=::::::::::::::::::::::::::::::-=+*######%%%@                                   
              %#*-....:::::::::::::::::::::::::::::::::::::::-==+**#####%%%%%%                      
             @#-...................::::::::::::::::::::::::::::::::::::--==+*#@@                    
             @#-.:::::::::::::...............::::::::::::::::::::::::::::::-+*@@                    
             %#-.:::----:::::::::::::::::...............::::::::::::::::-++++*@@%%%%%@              
             %#-.::=+#%##*++====---::::::::::::::::::...............:-=++++++*@+:-=+*@@             
             %#-.::=+@@@@@@@@@@@@%#**+=+====--:::::::::::::::::::...:=*++++++*@+-++++@@             
             %#-.::=+%@@@@@@@@@@@@@@@@@@@@@@%#**++++===--:::::::::::-+#++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@@@@@@@@@%%@@@@@@@@@@@@@@@@%%#**+==::::-+#++++++*@#+++++@@             
             %#-.::=+@@@@@@@@@@@@%*+:....-@@%+=+%@@@@@@@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@@#:.........@*:....:-=*@@@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@%*=:::::..:-@*:--::.::=%@@@@@@@@@#..::-+*++++++*@#+++++@@             
              #-.::=+@@@@@@@@#-..........:%+--::.....:*@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+@@@@@@@%+-.::::--:-::%-.........:=#@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@%=:...:::.-=..%=..:-:.....:+@@@@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+%@@@@@%+---....::...-%-:-::..::::-*@@@@@@@#..::-+#++++++#@#+++++@@             
             @#-.::=+%@@@@%+-....-....:..:#=:::.:::.:..:=%@@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@%#-.....-:-...:#=...-:...--::=*%@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@*-:-.......:::#=.:::-=++=:..-*%@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@@#=:..:..:...:#=.........:----#@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@@@%*:..::....:%+.:::::-==...+@@@@@@#..::-+*++++++*@#+++*%@@             
             @#-.::=+@@@@@@@@@@@%*-:::::.:%+:...:::..::=#@@@@@@#..::-+*++++++#@#+*@@@               
             @#-.::=+@@@@@@@@@@@@#-:....::@*-:.:.:..:-*@@@@@@@@#..::-+*++++++#@%@@@                 
             @#-.::=+@@@@@@@@@@@@@@@#=-=+@@@+:..:--=#@@@@@@@@@@#..::-+*++++++#@@@                   
             %#-.::=+#@@@@@@@@@@@@@@@@@@@@@@@@@%@%@@@@@@@@@@@@@#..::-+*++++++#@%@@@@@@@@@           
             %#-.:::........-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++++**@@          
             %#-.::::::::::::........:-=+*#%@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++=-=+%@          
              %#=====--:::::::::::::::::........:--+#%@@@@@@@@@*..::-+*+++++*@@+++=-=+++%@          
                 @@@@@%#*++++==--:::::::::::::::::..........-+#+..::-+*+++*@@*++=-++++++%@          
              %%*=:-++++**#%%@@%%%#***+===---:::::::::::::::.....:::=+*+#@%*++==++++++++%@          
           %#*-::::::---==++*@@%#**+**##%%@%%#*++===--::::::::::::::=*@@#*++==++++++++++%@          
          %*...........:::::::::-+#@@@@@@%#*+++*#%@@@%#*++++==-::::-@@*++=-+++++++++++++%@          
          %*..:::::::............::::::::-+*#%%@@@@%##@@@%#%@%%%##*#*++=-+++++++++++++++%@          
          %*..::::::::::::::::::............::::::--=+++++++++++++++=-=++++++++++++++++#@@          
          %*..::::::::::::::::::::::::::::............::::::::--==--=++++++++++++++++%@@            
          %*..:::::::::::::::::::::::::::::::::::::.............:-++++++++++++++++*%@@              
          %*..::::::::::::::::::::::::::::::::===--:::::::::::..-+*+++++++++++++#@@@                
          %#:::::::::::::::::::::::::::::::::=*@@@%#*++*+=-:::::+**+++++++++++#@@                   
           @@##**++==----:::::::::::::::::::::.....-=*#%@@@*::::+**++++++++*%@@                     
             @@@@@@@@@%%#**+====---:::::::::::::::::::......::::+**++++++*@@@                       
                         @@@@@@@@%#*+=+++=--::::::::::::::::::::+**++++*@@@                         
                                  @@@@@@@@%##**++===---:::::::::+**++#@@@                           
                                           @@@@@@@@@%%##*+=====-+*#%@@                              
                                                       @@@@@@@@@%@@@                                
                                                                @@                                  
                                                                                                    
                                                                                                    
                                                                                                    `}
          </pre>
          <pre className="text-[4px] leading-[1] opacity-20 font-mono whitespace-pre pointer-events-none ascii-fragment right">
{`                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                          %%#%%@                                                                    
                       %##+--=++**######%%##%                                                       
                    %##+-:::::::::::::--==++*#######%%%@                                            
                 %##=::::::::::::::::::::::::::::::-=+*######%%%@                                   
              %#*-....:::::::::::::::::::::::::::::::::::::::-==+**#####%%%%%%                      
             @#-...................::::::::::::::::::::::::::::::::::::--==+*#@@                    
             @#-.:::::::::::::...............::::::::::::::::::::::::::::::-+*@@                    
             %#-.:::----:::::::::::::::::...............::::::::::::::::-++++*@@%%%%%@              
             %#-.::=+#%##*++====---::::::::::::::::::...............:-=++++++*@+:-=+*@@             
             %#-.::=+@@@@@@@@@@@@%#**+=+====--:::::::::::::::::::...:=*++++++*@+-++++@@             
             %#-.::=+%@@@@@@@@@@@@@@@@@@@@@@%#**++++===--:::::::::::-+#++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@@@@@@@@@%%@@@@@@@@@@@@@@@@%%#**+==::::-+#++++++*@#+++++@@             
             %#-.::=+@@@@@@@@@@@@%*+:....-@@%+=+%@@@@@@@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@@#:.........@*:....:-=*@@@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@@@%*=:::::..:-@*:--::.::=%@@@@@@@@@#..::-+*++++++*@#+++++@@             
              #-.::=+@@@@@@@@#-..........:%+--::.....:*@@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+@@@@@@@%+-.::::--:-::%-.........:=#@@@@@@@#..::-+*++++++*@#+++++@@             
             %#-.::=+%@@@@@@%=:...:::.-=..%=..:-:.....:+@@@@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+%@@@@@%+---....::...-%-:-::..::::-*@@@@@@@#..::-+#++++++#@#+++++@@             
             @#-.::=+%@@@@%+-....-....:..:#=:::.:::.:..:=%@@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@%#-.....-:-...:#=...-:...--::=*%@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@*-:-.......:::#=.:::-=++=:..-*%@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@@#=:..:..:...:#=.........:----#@@@@#..::-+*++++++*@#+++++@@             
             @#-.::=+@@@@@@@@@%*:..::....:%+.:::::-==...+@@@@@@#..::-+*++++++*@#+++*%@@             
             @#-.::=+@@@@@@@@@@@%*-:::::.:%+:...:::..::=#@@@@@@#..::-+*++++++#@#+*@@@               
             @#-.::=+@@@@@@@@@@@@#-:....::@*-:.:.:..:-*@@@@@@@@#..::-+*++++++#@%@@@                 
             @#-.::=+@@@@@@@@@@@@@@@#=-=+@@@+:..:--=#@@@@@@@@@@#..::-+*++++++#@@@                   
             %#-.::=+#@@@@@@@@@@@@@@@@@@@@@@@@@%@%@@@@@@@@@@@@@#..::-+*++++++#@%@@@@@@@@@           
             %#-.:::........-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++++**@@          
             %#-.::::::::::::........:-=+*#%@@@@@@@@@@@@@@@@@@@#..::-+*++++++#@*++++=-=+%@          
              %#=====--:::::::::::::::::........:--+#%@@@@@@@@@*..::-+*+++++*@@+++=-=+++%@          
                 @@@@@%#*++++==--:::::::::::::::::..........-+#+..::-+*+++*@@*++=-++++++%@          
              %%*=:-++++**#%%@@%%%#***+===---:::::::::::::::.....:::=+*+#@%*++==++++++++%@          
           %#*-::::::---==++*@@%#**+**##%%@%%#*++===--::::::::::::::=*@@#*++==++++++++++%@          
          %*...........:::::::::-+#@@@@@@%#*+++*#%@@@%#*++++==-::::-@@*++=-+++++++++++++%@          
          %*..:::::::............::::::::-+*#%%@@@@%##@@@%#%@%%%##*#*++=-+++++++++++++++%@          
          %*..::::::::::::::::::............::::::--=+++++++++++++++=-=++++++++++++++++#@@          
          %*..::::::::::::::::::::::::::::............::::::::--==--=++++++++++++++++%@@            
          %*..:::::::::::::::::::::::::::::::::::::.............:-++++++++++++++++*%@@              
          %*..::::::::::::::::::::::::::::::::===--:::::::::::..-+*+++++++++++++#@@@                
          %#:::::::::::::::::::::::::::::::::=*@@@%#*++*+=-:::::+**+++++++++++#@@                   
           @@##**++==----:::::::::::::::::::::.....-=*#%@@@*::::+**++++++++*%@@                     
             @@@@@@@@@%%#**+====---:::::::::::::::::::......::::+**++++++*@@@                       
                         @@@@@@@@%#*+=+++=--::::::::::::::::::::+**++++*@@@                         
                                  @@@@@@@@%##**++===---:::::::::+**++#@@@                           
                                           @@@@@@@@@%%##*+=====-+*#%@@                              
                                                       @@@@@@@@@%@@@                                
                                                                @@                                  
                                                                                                    
                                                                                                    
                                                                                                    `}
          </pre>
        </div>

        {/* Upload your interface text */}
        <div className="text-center mb-20">
          <h1 className="text-3xl font-light leading-tight font-mono">
            {typedText}<span className="inline-block w-[14px] h-[0.9em] bg-black ml-[3px] animate-blink align-middle"></span>
          </h1>
        </div>

        {/* Upload box with custom styling - wider and shorter */}
        <div className="mb-20">
          {!isAtUploadLimit ? (
            <>
              <div className="w-full max-w-7xl mx-auto px-10">
                <div className="[&>div]:!w-full [&_.border-dashed]:!py-9 [&_.border-dashed]:!px-40">
                  <UploadZone 
                    isLoggedIn={isLoggedIn}
                    showCooldown={false}
                    onZombify={handleZombify}
                  />
                </div>
              </div>
              
              {/* Usage info directly below upload box */}
              {!isLoggedIn && (
                <div className="mt-8 text-center">
                  <p className="text-[10px] font-mono opacity-60">
                    Try 1 free analysis • Sign up for free and get more
                  </p>
                </div>
              )}
              
              {isLoggedIn && profile && (
                <div className="mt-8 text-center">
                  <p className="text-xs font-mono opacity-60">
                    {profile.plan_type === 'pro' 
                      ? '⭐ Pro: Unlimited analysis' 
                      : `${profile.feedback_count}/${profile.monthly_limit} uploads used this month`
                    }
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="zombify-card max-w-4xl mx-auto text-center">
              <p className="text-lg font-mono mb-4">Upload limit reached</p>
              <p className="text-sm opacity-70 mb-6">
                You&apos;ve used all {profile?.monthly_limit} uploads this month
              </p>
              <button className="zombify-primary-button">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        {isAtUploadLimit && (
          <div className="text-center mb-6">
            <p className="text-sm font-mono opacity-60">
              Monthly limit reached • Upgrade to Pro for unlimited analysis
            </p>
          </div>
        )}

        <div className="text-center space-y-6 mb-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg opacity-70 leading-[1.75] font-mono">
              People are changing. Attention spans are shrinking, critical thinking is fading, and people navigate products on autopilot. Zombify helps designers, builders, and founders stress test their interfaces against this reality by analyzing friction points, misaligned intent, shady patterns, and missed opportunities. It doesn't just simulate user behavior — it gives you the second set of eyes that turns instinct into evidence.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-black/10 py-8 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* Discord Icon */}
            <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.046-.32 13.41.099 17.731a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
              </svg>
            </a>
            {/* Email Icon */}
            <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-10 5L2 7"></path>
              </svg>
            </a>
          </div>
          <p className="text-sm font-mono opacity-60">
            © 2025 Zombify. Built for creators who want their designs to matter.
          </p>
        </div>
      </footer>
    </div>
  );
}