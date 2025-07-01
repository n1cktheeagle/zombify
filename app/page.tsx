'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';

type AppState = 'landing' | 'analyzing' | 'complete';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const router = useRouter();

  const handleZombify = async (file: File) => {
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

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (res.url.includes('/feedback/')) {
        const id = res.url.split('/feedback/')[1];
        
        // Brief completion state before redirect
        setAppState('complete');
        setTimeout(() => {
          router.push(`/feedback/${id}`);
        }, 800);
        return;
      }

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setAppState('landing');
      setAnalysisProgress(0);
      throw err; // Re-throw to let UploadZone handle the error display
    }
  };

  // Analysis Screen - Updated with Grey/Noise Theme
  if (appState === 'analyzing' || appState === 'complete') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-[#c8c8c8] font-mono relative overflow-hidden flex items-center justify-center">
        {/* Noise Pattern Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px'
            }}
          />
        </div>

        {/* Animated Scanlines - Subtle Grey */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="scanlines"></div>
          <div className="scanlines-overlay"></div>
        </div>

        {/* Flickering Glow - Grey */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="flicker-glow"></div>
        </div>

        {/* Terminal Content */}
        <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto p-8">
          <div className="space-y-4">
            <div className="text-4xl font-bold tracking-wider terminal-text">
              {appState === 'analyzing' ? 'ANALYZING' : 'SIGNAL ACQUIRED'}
            </div>
            
            <div className="text-lg opacity-80 tracking-wide">
              {appState === 'analyzing' ? 'Scanning interface patterns...' : 'Preparing transmission...'}
            </div>
          </div>

          {/* Progress Terminal - Updated Colors */}
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

            {/* Progress Bar - Grey Theme */}
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span>PROGRESS</span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <div className="h-2 bg-black border border-[#666]/40 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#c8c8c8] to-[#999] transition-all duration-300 ease-out progress-glow"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pulsing Status - Grey Dots */}
          <div className="flex justify-center items-center space-x-2">
            <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-[#c8c8c8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        <style jsx>{`
          .scanlines {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              transparent 50%,
              rgba(200, 200, 200, 0.04) 50%
            );
            background-size: 100% 4px;
            animation: scanlines-move 0.1s linear infinite;
          }
          
          .scanlines-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(200, 200, 200, 0.02),
              transparent
            );
            animation: scanlines-sweep 4s ease-in-out infinite;
          }
          
          .flicker-glow {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at center,
              rgba(200, 200, 200, 0.1) 0%,
              transparent 70%
            );
            animation: flicker 0.2s infinite linear alternate;
          }
          
          .progress-glow {
            box-shadow: 0 0 10px rgba(200, 200, 200, 0.4);
          }
          
          @keyframes scanlines-move {
            0% { transform: translateY(0); }
            100% { transform: translateY(4px); }
          }
          
          @keyframes scanlines-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes flicker {
            0% { opacity: 1; }
            50% { opacity: 0.97; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono relative">
      {/* Subtle scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-gradient-to-b from-transparent via-black to-transparent bg-[length:100%_4px]" />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* Header */}
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

        {/* Upload Area - Using Reusable Component */}
        <UploadZone 
          isLoggedIn={true} // Landing page allows first upload for everyone
          showCooldown={false}
          onZombify={handleZombify}
        />

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm opacity-50 font-mono tracking-wide">
            Signal received. Pattern recognized. Wake them up.
          </p>
        </div>
      </div>
    </div>
  );
}