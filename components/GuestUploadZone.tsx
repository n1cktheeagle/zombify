'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Script from 'next/script';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zombify.ai';

export function GuestUploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
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

  const getTurnstileToken = async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      try {
        const t = (window as any).turnstile;
        if (!t) return reject(new Error('Turnstile not ready'));
        const el = document.getElementById('guest-turnstile') as any;
        if (!el) return reject(new Error('Turnstile element missing'));

        if (!el.__rendered) {
          const wid = t.render('#guest-turnstile', {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
            size: 'invisible',
            retry: 'auto',
            callback: (token: string) => {
              el.__resolve?.(token);
              el.__resolve = undefined;
            }
          });
          el.__wid = wid;
          el.__rendered = true;
        }

        if (el.__wid) t.reset(el.__wid);
        el.__resolve = resolve;
        t.execute(el.__wid);
      } catch (e) {
        reject(e as any);
      }
    });
  };

  const handleUpload = async () => {
    if (!file || uploading || cooldownSeconds > 0) return;
    
    setUploading(true);
    setError(null);

    try {
      // Get Turnstile token
      let turnstileToken: string;
      try {
        turnstileToken = await getTurnstileToken();
      } catch {
        setError('Please complete the verification and try again.');
        setUploading(false);
        return;
      }

      // Get guest session ID
      const guestSessionId = localStorage.getItem('guest_session_id');

      // Upload to zombify-app API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isGuest', 'true');
      formData.append('guestSessionId', guestSessionId || '');
      formData.append('turnstileToken', turnstileToken);

      const response = await fetch(`${APP_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include' // Important for cross-domain cookies
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'RATE_LIMIT_EXCEEDED' && data.remainingTime) {
          // Set cooldown
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

      // Success! Redirect to feedback page
      if (data.feedbackId) {
        window.location.href = `${APP_URL}/feedback/${data.feedbackId}`;
      } else {
        setError('Upload succeeded but no feedback ID returned.');
        setUploading(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const isDisabled = cooldownSeconds > 0 || uploading;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
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

          {/* Invisible Turnstile */}
          <div id="guest-turnstile" className="absolute opacity-0 pointer-events-none" />

          <div className="space-y-4 relative z-10 w-full">
            {/* Cooldown Timer */}
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
                {/* Thumbnail remains visible */}
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
                  {/* Terminal-style segmented progress bar */}
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
                {/* Image Preview with Remove Button */}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    className="font-mono text-sm tracking-wide px-6 py-3 bg-black text-white hover:bg-black/90 transition-all rounded"
                  >
                    ANALYZE NOW
                  </button>
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
                    {isDisabled ? 'Account required for more uploads' : 'or click to browse UI image • PNG, JPG & WebP'}
                  </p>
                  <p className="text-xs opacity-40 mt-2">
                    Free one-time analysis • No signup required
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

