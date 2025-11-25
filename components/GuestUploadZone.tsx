'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Script from 'next/script';
import ButtonBig from '@/components/ui/ButtonBig';
import { AuthModal } from '@/components/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';

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
  const [turnstileClicked, setTurnstileClicked] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  
  // Dev mode state (persisted in localStorage)
  const [devMode, setDevMode] = useState(false);
  const [bypassRateLimits, setBypassRateLimits] = useState(false);
  
  // Auth modal
  const { openSignIn, openSignUp, showAuthModal, closeModal, authMode } = useAuthModal();

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

  // Render Turnstile ONLY when user clicks verify button
  useEffect(() => {
    if (!file || !turnstileReady || !turnstileClicked) return;
    if (widgetIdRef.current) return;

    const timer = setTimeout(() => {
      const turnstile = (window as any).turnstile;
      if (!turnstile) return;

      const container = document.getElementById('turnstile-container');
      if (!container) return;

      try {
        const widgetId = turnstile.render(container, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          size: 'normal',
          theme: 'light',
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
  }, [file, turnstileReady, turnstileClicked]);

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
      setTurnstileClicked(false);
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
        } else if (data.code === 'MONTHLY_LIMIT_EXCEEDED') {
          // Authenticated user hit monthly limit on landing page
          // Show cooldown UI with login buttons (don't show error message)
          setCooldownSeconds(999999); // Trigger cooldown UI
        } else {
          setError(data.error || 'Upload failed. Please try again.');
        }
        setUploading(false);
        return;
      }

      if (data.feedbackId) {
        // Store guest session ID in localStorage for persistence across verification flow
        if (data.guestSessionId) {
          localStorage.setItem('z_guest_session_id', data.guestSessionId);
          console.log('[UPLOAD] Stored guest session ID in localStorage');
        }
        
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
        <div className="fixed bottom-4 right-4 z-[9999] bg-yellow-100 border-2 border-yellow-400 p-3 shadow-lg rounded max-w-xs">
          <label className="flex items-center gap-2 text-xs font-mono cursor-pointer font-bold">
            <input
              type="checkbox"
              checked={devMode}
              onChange={(e) => setDevMode(e.target.checked)}
              className="cursor-pointer"
            />
            🧪 Dev Mode
          </label>
          {devMode && (
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-bold text-gray-700 mb-2">RATE LIMIT TESTING:</div>
              
              {/* Bypass Rate Limits Toggle */}
              <button
                onClick={() => setBypassRateLimits(!bypassRateLimits)}
                className="block w-full px-2 py-1.5 bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors rounded text-left"
              >
                {bypassRateLimits ? '✅' : '❌'} Bypass Rate Limits
              </button>
              
              {/* Clear Rate Limit Records */}
              <button
                onClick={async () => {
                  if (!confirm('Clear all guest upload records for this IP/fingerprint? This resets your 30-day cooldown.')) return;
                  try {
                    const res = await fetch(`${APP_URL}/api/admin/clear-guest-uploads`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ dev: true }),
                      credentials: 'include'
                    });
                    if (res.ok) {
                      alert('✅ Guest uploads cleared! You can test again.');
                      setCooldownSeconds(0);
                      localStorage.removeItem('guest_upload_cooldown');
                    } else {
                      alert('❌ Failed to clear: ' + (await res.text()));
                    }
                  } catch (err) {
                    alert('❌ Error: ' + err);
                  }
                }}
                className="block w-full px-2 py-1.5 bg-red-500 text-white text-xs hover:bg-red-600 transition-colors rounded text-left"
              >
                🗑️ Clear Upload History
              </button>
              
              {/* Reset Fingerprint */}
              <button
                onClick={() => {
                  if (!confirm('Reset your browser fingerprint? This generates a new guest session ID.')) return;
                  const newId = crypto.randomUUID();
                  localStorage.setItem('guest_session_id', newId);
                  alert('✅ New fingerprint: ' + newId.substring(0, 8) + '...');
                }}
                className="block w-full px-2 py-1.5 bg-purple-500 text-white text-xs hover:bg-purple-600 transition-colors rounded text-left"
              >
                🔄 Reset Fingerprint
              </button>
              
              {/* Clear All Data */}
              <button
                onClick={async () => {
                  if (!confirm('Clear ALL data? (Database + Cookies + LocalStorage + Reset Fingerprint)')) return;
                  try {
                    // 1. Clear database records
                    const res = await fetch(`${APP_URL}/api/admin/clear-guest-uploads`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ dev: true }),
                      credentials: 'include'
                    });
                    
                    // 2. Clear all cookies
                    document.cookie.split(";").forEach((c) => {
                      document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                    
                    // 3. Clear localStorage
                    localStorage.clear();
                    
                    // 4. Generate new fingerprint
                    const newId = crypto.randomUUID();
                    localStorage.setItem('guest_session_id', newId);
                    
                    // 5. Reset cooldown state
                    setCooldownSeconds(0);
                    
                    if (res.ok) {
                      alert(`✅ All data cleared!\nNew fingerprint: ${newId.substring(0, 12)}...\nYou can test again now.`);
                    } else {
                      alert(`⚠️ LocalStorage/cookies cleared but database clear failed.\nNew fingerprint: ${newId.substring(0, 12)}...\nError: ${await res.text()}`);
                    }
                  } catch (err) {
                    // Still clear local data even if API fails
                    document.cookie.split(";").forEach((c) => {
                      document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                    localStorage.clear();
                    const newId = crypto.randomUUID();
                    localStorage.setItem('guest_session_id', newId);
                    setCooldownSeconds(0);
                    alert(`⚠️ Cleared local data, but API call failed.\nNew fingerprint: ${newId.substring(0, 12)}...\nError: ${err}`);
                  }
                }}
                className="block w-full px-2 py-1.5 bg-gray-500 text-white text-xs hover:bg-gray-600 transition-colors rounded text-left"
              >
                💥 Clear All Data
              </button>
              
              {/* Status Display */}
              <div className="mt-3 p-2 bg-white rounded border border-gray-300 text-[9px] font-mono space-y-1">
                <div><strong>Status:</strong> {bypassRateLimits ? '🟢 Bypass ON' : '🔴 Limits Active'}</div>
                <div><strong>Fingerprint:</strong> {typeof window !== 'undefined' ? localStorage.getItem('guest_session_id')?.substring(0, 12) + '...' : 'N/A'}</div>
                <div><strong>Cooldown:</strong> {cooldownSeconds > 0 ? `${cooldownSeconds}s` : 'None'}</div>
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
            ${cooldownSeconds > 0 ? 'cursor-default' : isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}
            ${!isDisabled && !error ? 'border-black/50 bg-black/5' : 'border-black/20'}
            ${file ? 'border-black/40 bg-black/5' : ''}
            ${error ? 'border-red-400 bg-red-50' : ''}
            ${cooldownSeconds > 0 ? 'border-black/50 bg-black/5' : ''}
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
              <div className="space-y-4">
                <p className="text-lg font-medium">Guest upload limit reached</p>
                <p className="text-sm opacity-60">
                  Please login to your account or sign up free
                </p>
                <div className="flex justify-center items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignIn();
                    }}
                    className="font-mono text-sm tracking-wide px-4 py-2 border border-black text-black hover:bg-black/5 transition-all"
                  >
                    LOGIN
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignUp();
                    }}
                    className="font-mono text-sm tracking-wide px-4 py-2 bg-black border border-black text-white hover:bg-black/90 transition-all"
                  >
                    SIGN UP
                  </button>
                </div>
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
                
                {!uploading && !turnstileClicked && (
                  <ButtonBig
                    onClick={(e) => {
                      e.stopPropagation();
                      setTurnstileClicked(true);
                    }}
                    variant="black"
                    stroke="thick"
                  >
                    VERIFY I'M HUMAN
                  </ButtonBig>
                )}
                
                {!uploading && turnstileClicked && !turnstileToken && (
                  <div className="text-sm font-mono text-black/60">
                    Complete verification below...
                  </div>
                )}
                
                {!uploading && turnstileToken && (
                  <ButtonBig
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    variant="black"
                    stroke="thick"
                  >
                    ANALYZE
                  </ButtonBig>
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
      
      {/* Turnstile Widget - Only shows after clicking "VERIFY I'M HUMAN" */}
      {file && !uploading && turnstileClicked && !turnstileToken && (
        <div className="mt-6 flex justify-center">
          <div id="turnstile-container" className="scale-95 origin-center"></div>
        </div>
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={closeModal} 
          initialMode={authMode}
          dismissible={true}
        />
      )}
    </>
  );
}
