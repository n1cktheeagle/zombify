'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Script from 'next/script';
import ButtonBig from '@/components/ui/ButtonBig';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zombify.ai';

export function GuestUploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  
  // Dev mode state (persisted in localStorage)
  const [devMode, setDevMode] = useState(false);
  const [bypassRateLimits, setBypassRateLimits] = useState(false);

  // Load dev mode state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBypass = localStorage.getItem('dev_bypass_rate_limits') === 'true';
      setBypassRateLimits(savedBypass);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_bypass_rate_limits', String(bypassRateLimits));
    }
  }, [bypassRateLimits]);

  useEffect(() => {
    // Generate or retrieve guest session ID
    let guestSessionId = localStorage.getItem('guest_session_id');
    if (!guestSessionId) {
      guestSessionId = crypto.randomUUID();
      localStorage.setItem('guest_session_id', guestSessionId);
    }

    // Check for existing guest cooldown
    const cooldownEnd = localStorage.getItem('guest_upload_cooldown');
    if (cooldownEnd) {
      const remaining = Math.max(0, Math.floor((parseInt(cooldownEnd) - Date.now()) / 1000));
      if (remaining > 0) {
        setCooldownSeconds(remaining);
      } else {
        localStorage.removeItem('guest_upload_cooldown');
      }
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('guest_upload_cooldown');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  // Render Turnstile when file is selected and script is ready
  useEffect(() => {
    if (!file || !turnstileReady) return;
    if (widgetIdRef.current) return;

    const timer = setTimeout(() => {
      const turnstile = (window as any).turnstile;
      if (!turnstile) return;

      const container = document.getElementById('turnstile-container');
      if (!container) return;

      try {
        const widgetId = turnstile.render(container, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            console.log('[Turnstile] Success callback, token received');
            setTurnstileToken(token);
            setError(null);
          },
          'error-callback': () => {
            console.error('[Turnstile] Error callback triggered');
            setTurnstileToken(null);
            setError('Bot verification failed. Please refresh the page and try again.');
          },
          'timeout-callback': () => {
            console.error('[Turnstile] Timeout callback triggered');
            setTurnstileToken(null);
            setError('Verification timed out. Please try again.');
          }
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('Turnstile render error:', err);
        setError('Verification failed to load. Please refresh and try again.');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [file, turnstileReady]);

  // Cleanup when file is removed
  useEffect(() => {
    if (!file && widgetIdRef.current) {
      const turnstile = (window as any).turnstile;
      if (turnstile) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
      widgetIdRef.current = null;
      setTurnstileToken(null);
    }
  }, [file]);

  // Animate loading dots when verifying
  useEffect(() => {
    if (!turnstileToken && file) {
      const interval = setInterval(() => {
        setLoadingDots((prev) => (prev >= 3 ? 1 : prev + 1));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [turnstileToken, file]);

  const formatCooldownTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file || uploading || cooldownSeconds > 0) return;
    
    if (!turnstileToken) {
      setError('Please complete the verification checkbox first.');
      return;
    }
    
    setUploading(true);
    setError(null);

    try {
      const guestSessionId = localStorage.getItem('guest_session_id');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_guest', 'true');
      formData.append('guest_session_id', guestSessionId || '');
      formData.append('turnstile_token', turnstileToken);
      if (bypassRateLimits) {
        formData.append('dev_bypass_rate_limits', 'true');
      }

      const response = await fetch(`${APP_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'RATE_LIMIT_EXCEEDED' && data.remainingTime) {
          const cooldownEnd = Date.now() + (data.remainingTime * 1000);
          localStorage.setItem('guest_upload_cooldown', cooldownEnd.toString());
          setCooldownSeconds(data.remainingTime);
          setError(data.error || 'Rate limit exceeded. Please try again later.');
        } else {
          setError(data.error || 'Upload failed. Please try again.');
        }
        setUploading(false);
        return;
      }

      if (data.feedbackId) {
        window.location.href = `${APP_URL}/feedback/${data.feedbackId}`;
      } else {
        setError('Upload succeeded but no feedback ID returned.');
        setUploading(false);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const isDisabled = cooldownSeconds > 0 || uploading;

  return (
    <>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />
      
      {/* Dev Mode Toggle - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-yellow-100 border-2 border-yellow-400 p-2 shadow-lg rounded">
          <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={devMode}
              onChange={(e) => setDevMode(e.target.checked)}
              className="cursor-pointer"
            />
            Dev Mode
          </label>
          {devMode && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => setBypassRateLimits(!bypassRateLimits)}
                className="block w-full px-2 py-1 bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors rounded"
              >
                {bypassRateLimits ? '✓' : '○'} Bypass Rate Limits
              </button>
              <div className="text-[10px] text-gray-600 mt-1">
                {bypassRateLimits ? 'Rate limits OFF' : 'Rate limits ON'}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="w-full">
        <div
          className={`
            relative overflow-hidden
            border-2 border-dashed rounded-lg p-8 text-center
            transition-all duration-300 scanline-effect
            flex items-center justify-center
            ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}
            ${!isDisabled && !error ? 'border-black/50 bg-black/5' : 'border-black/20'}
            ${file ? 'border-black/40 bg-black/5' : ''}
            ${error ? 'border-red-400 bg-red-50' : ''}
            ${cooldownSeconds > 0 ? 'border-orange-400 bg-orange-50' : ''}
            min-h-[260px]
          `}
          onDragOver={!isDisabled ? handleDragOver : undefined}
          onDragLeave={!isDisabled ? handleDragLeave : undefined}
          onDrop={!isDisabled ? handleDrop : undefined}
          onClick={() => {
            if (isDisabled || uploading) return;
            fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileSelect(selectedFile);
            }}
            disabled={isDisabled}
          />

          <div className="space-y-4 relative z-10 w-full">
            {cooldownSeconds > 0 ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2 font-mono">
                  {formatCooldownTime(cooldownSeconds)}
                </div>
                <p className="text-sm text-orange-700 font-mono">
                  GUEST UPLOAD LIMIT REACHED
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  <a href={`${APP_URL}/auth/signup`} className="underline hover:opacity-70">
                    Create a free account
                  </a>{' '}
                  for 3 uploads per month
                </p>
              </div>
            ) : uploading ? (
              <div className="space-y-3">
                <div className="relative mx-auto">
                  <div className="w-24 h-24 mx-auto border-2 border-black/40 rounded-lg overflow-hidden bg-black/5 relative">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-black/50">No preview</div>
                    )}
                  </div>
                </div>
                <div className="text-sm font-mono tracking-wide text-black/80">
                  Analyzing...
                </div>
                <div className="w-3/4 max-w-sm mx-auto">
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const isFilled = i < 12;
                      const isFlashing = i === 12;
                      return (
                        <div
                          key={i}
                          className={`h-2 flex-1 ${isFilled ? 'bg-black' : 'bg-black/20'} ${isFlashing ? 'animate-pulse' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : file && previewUrl ? (
              <>
                <div className="relative mx-auto">
                  <div className="w-24 h-24 mx-auto border-2 border-black/40 rounded-lg overflow-hidden bg-black/5 relative group">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {!isDisabled && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setPreviewUrl(null);
                            setError(null);
                          }}
                          className="text-white text-xs font-mono tracking-wide px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >
                          REMOVE
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs opacity-60">
                    {(file.size / 1024 / 1024).toFixed(2)}MB • Ready for analysis
                  </p>
                </div>

                {error && (
                  <p className="text-red-600 text-sm font-mono">{error}</p>
                )}
                
                {!uploading && (
                  <div className="flex flex-col items-center gap-3">
                    <div id="turnstile-container"></div>
                    
                    <ButtonBig
                      onClick={(e) => {
                        e.stopPropagation();
                        if (turnstileToken) handleUpload();
                      }}
                      disabled={!turnstileToken}
                      variant="black"
                      stroke="thick"
                    >
                      {turnstileToken ? 'ANALYZE' : `VERIFYING YOU'RE HUMAN${'.'.repeat(loadingDots)}`}
                    </ButtonBig>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={`w-12 h-12 mx-auto border-2 border-black/20 rounded-lg flex items-center justify-center transition-colors ${!isDisabled ? 'group-hover:border-black/40' : ''}`}>
                  <Upload className={`w-6 h-6 opacity-60 transition-opacity ${!isDisabled ? 'group-hover:opacity-80' : ''}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium">
                    {isDisabled ? 'Upload disabled' : 'Feed Zombify'}
                  </p>
                  <p className="text-sm opacity-60">
                    {isDisabled ? 'Account required for more uploads' : 'or click to browse & analyze UI image (PNG, JPG & WebP)'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
