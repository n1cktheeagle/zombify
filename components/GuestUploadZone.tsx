'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Script from 'next/script';
import ButtonBig from '@/components/ui/ButtonBig';
import { AnalyzeButton } from '@/components/ui/AnalyzeButton';
import { AuthModal } from '@/components/AuthModal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { BrowserExtractor } from '@/lib/extractors/browserExtractor';
import { APP_URL } from '@/lib/config';

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
  
  // Progress tracking (like the app)
  const [uploadStage, setUploadStage] = useState(0); // 0=not started, 1-2=extraction, 3-5=analysis
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [stageText, setStageText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const rotationTimerRef = useRef<number | null>(null);
  const analysisStartRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const allowUnloadRef = useRef(false);
  const hasOCRRetriedRef = useRef(false);
  
  // Dev mode state (persisted in localStorage)
  const [devMode, setDevMode] = useState(false);
  const [bypassRateLimits, setBypassRateLimits] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Error simulation states (dev mode only)
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [simulateBotFail, setSimulateBotFail] = useState(false);
  const [simulateUploadFail, setSimulateUploadFail] = useState(false);
  const [simulate404Polling, setSimulate404Polling] = useState(false);
  
  // Auth modal
  const { openSignIn, openSignUp, showAuthModal, closeModal, authMode } = useAuthModal();

  // Track if user had an error (for "Try Again" button text)
  const [hadUploadError, setHadUploadError] = useState(false);

  // Force Turnstile re-render after errors (increment to trigger useEffect)
  const [turnstileRenderKey, setTurnstileRenderKey] = useState(0);

  // SAFETY NET: Clear localStorage immediately when ANY error is set
  // This prevents "Resuming..." state from appearing after user refreshes
  useEffect(() => {
    if (error) {
      localStorage.removeItem('zombify_guest_active_upload');
    }
  }, [error]);

  // Reset upload zone to retry state (called on ANY error)
  // Keeps the file so user can retry without re-selecting
  const resetForRetry = (errorMessage: string) => {
    // Reset upload state (keep file and preview!)
    setUploading(false);
    setUploadStage(0);
    setUploadProgress(0);
    setStageText('');

    // Clear localStorage
    localStorage.removeItem('zombify_guest_active_upload');

    // Reset turnstile widget so user can re-verify
    // IMPORTANT: Always remove and re-render (reset() is unreliable)
    setTurnstileToken(null);
    const turnstile = (window as any).turnstile;
    if (turnstile && widgetIdRef.current) {
      try {
        turnstile.remove(widgetIdRef.current);
      } catch (e) {
        console.log('[Turnstile] Remove failed:', e);
      }
    }
    widgetIdRef.current = null;
    // Increment render key to force useEffect to re-run and create new widget
    setTurnstileRenderKey(k => k + 1);

    // Clear any active abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear timers
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Set the error message and mark that an error occurred
    setError(errorMessage);
    setHadUploadError(true);
  };

  // Load dev mode state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBypass = localStorage.getItem('dev_bypass_rate_limits') === 'true';
      setBypassRateLimits(savedBypass);
      // Show dev panel in development OR on staging hostname
      const isStaging = window.location.hostname.includes('staging');
      setShowDevPanel(process.env.NODE_ENV === 'development' || isStaging);
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
            // Reset widget so user can retry without page refresh
            setTimeout(() => {
              const t = (window as any).turnstile;
              if (t && widgetIdRef.current) {
                try { t.reset(widgetIdRef.current); } catch {}
              }
            }, 100);
            setError('Verification failed. Please try again.');
          },
          'timeout-callback': () => {
            console.error('[Turnstile] Timeout callback triggered');
            setTurnstileToken(null);
            // Reset widget so user can retry without page refresh
            setTimeout(() => {
              const t = (window as any).turnstile;
              if (t && widgetIdRef.current) {
                try { t.reset(widgetIdRef.current); } catch {}
              }
            }, 100);
            setError('Verification timed out. Please try again.');
          }
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('Turnstile render error:', err);
        setError('Verification failed to load. Please try again.');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [file, turnstileReady, turnstileClicked, turnstileRenderKey]);

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
  
  // Warn before unload if uploading (from start, not just stage 3+)
  useEffect(() => {
    if (!uploading) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Allow programmatic redirects (completion/resume) without showing the native prompt
      if (allowUnloadRef.current) return;
      e.preventDefault();
      e.returnValue = 'Your upload is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading]);
  
  // Cleanup on unmount: abort any in-progress uploads
  useEffect(() => {
    return () => {
      console.log('[GuestUpload] Component unmounting');
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
  // Check for active upload on mount and resume
  useEffect(() => {
    const savedState = localStorage.getItem('zombify_guest_active_upload');
    if (!savedState) return;
    
    try {
      const state = JSON.parse(savedState);
      const ageMinutes = (Date.now() - state.timestamp) / 1000 / 60;
      
      // If upload takes longer than 5 minutes, assume it failed
      if (ageMinutes >= 5) {
        console.log('⚠️ Guest upload timeout (>5 min), clearing...');
        localStorage.removeItem('zombify_guest_active_upload');
        return;
      }
      
      console.log('🔄 Resuming upload...', state);
      
      // Restore file preview
      if (state.filePreview) {
        setPreviewUrl(state.filePreview);
      }
      
      // Show reconnecting UI
      setUploading(true);
      setUploadStage(5);
      setUploadProgress(70);
      setStageText('Resuming analysis...');
      
      let failureCount = 0;
      let notFoundCount = 0;
      const MAX_FAILURES = 5;
      const MAX_NOT_FOUND = 30; // 30 polls × 5 seconds = 2.5 minutes of 404s

      // Start polling for completion
      const pollUpload = async () => {
        try {
          console.log('📊 Polling for upload completion...', state.uploadId);
          const res = await fetch(`${APP_URL}/api/feedback/${state.uploadId}`, {
            credentials: 'include'
          });

          if (res.ok) {
            failureCount = 0; // Reset on success
            notFoundCount = 0; // Reset 404 count on success
            const data = await res.json();
            console.log('📊 Poll response:', { hasAnalysis: !!data.analysis });
            if (data.analysis) {
              // Analysis complete!
              console.log('✅ Guest upload complete, redirecting...');
              localStorage.removeItem('zombify_guest_active_upload');
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              // Redirect with guestSession param for client-side cookie setting
              const guestSessionId = localStorage.getItem('z_guest_session_id') || state.guestSessionId;
              allowUnloadRef.current = true;
              setUploading(false);

              const redirectUrl = new URL(`${APP_URL}/feedback/${state.uploadId}`);
              if (guestSessionId) {
                redirectUrl.searchParams.set('guestSession', guestSessionId);
              }
              window.location.href = redirectUrl.toString();
            }
          } else if (res.status === 404) {
            // Record not created yet – count separately from hard failures
            notFoundCount++;
            console.log(`📊 Poll: feedback not found yet (404), attempt ${notFoundCount}/${MAX_NOT_FOUND}`);
          } else {
            console.log('📊 Poll failed:', res.status);
            failureCount++;
          }
        } catch (err) {
          console.error('Polling error:', err);
          failureCount++;
        }

        // Give up after too many 404s (upload never existed)
        if (notFoundCount >= MAX_NOT_FOUND) {
          console.error('❌ Upload not found after 2.5 minutes, giving up');
          localStorage.removeItem('zombify_guest_active_upload');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setUploading(false);
          setUploadStage(0);
          setUploadProgress(0);
          setStageText('');
          setError('Upload not found. Please try again.');
          return;
        }

        // Give up after too many hard failures
        if (failureCount >= MAX_FAILURES) {
          console.error('❌ Too many polling failures, giving up');
          localStorage.removeItem('zombify_guest_active_upload');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setUploading(false);
          setUploadStage(0);
          setUploadProgress(0);
          setStageText('');
          setError('Upload appears to have failed. Please try again.');
        }
      };
      
      // Poll immediately, then every 5 seconds (short-lived, minimal DB cost)
      pollUpload();
      pollingIntervalRef.current = window.setInterval(pollUpload, 5000) as any;
      
    } catch (err) {
      console.error('Error resuming upload:', err);
      localStorage.removeItem('zombify_guest_active_upload');
    }
  }, []);

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

  // Get display message based on stage (matching app)
  const getOverlayMessage = () => {
    return stageText || 'Processing...';
  };

  // Map stage text to user-friendly messages (matching app)
  const mapStageText = (s: string) => {
    const lower = (s || '').toLowerCase();
    if (lower.includes('color')) return 'Extracting colours…';
    if (lower.includes('text') || lower.includes('ocr')) return 'Extracting text…';
    if (lower.includes('contrast')) return 'Analyzing contrast…';
    if (lower.includes('spacing')) return 'Measuring spacing…';
    return 'Extracting text and colours…';
  };

  const displayProgress = uploadProgress; // Use uploadProgress directly, it's already calculated correctly

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
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // Generate upload ID immediately (server will use this)
    const uploadId = crypto.randomUUID();
    
    // Any new upload should protect against accidental tab closes until we explicitly allow unload
    allowUnloadRef.current = false;
    // Reset extraction-phase helpers
    hasOCRRetriedRef.current = false;
    setUploading(true);
    setError(null);
    setUploadStage(0);
    setUploadProgress(0);
    
    // Save file info + uploadId immediately for reconnection
    localStorage.setItem('zombify_guest_active_upload', JSON.stringify({
      uploadId: uploadId,
      timestamp: Date.now(),
      fileName: file.name,
      filePreview: previewUrl
    }));

    try {
      // STAGE 0: Grace period (3 seconds to cancel)
      setStageText('Starting analysis...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (controller.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      // STAGE 1-2: Text extraction (colors + OCR)
      setUploadStage(1);
      setStageText('Initializing extraction…');
      
      const extractor = new BrowserExtractor();
      const extractedData = await extractor.extractAll(
        file,
        (stage, progress) => {
          const s = String(stage).toLowerCase();
          const pct = Math.max(0, Math.min(100, Math.round(progress)));

          // Colors: 0–10
          if (s.includes('color')) {
            setUploadStage(1);
            const mapped = Math.round((pct / 100) * 10);
            setUploadProgress(prev => Math.max(prev, mapped));
            setStageText('Extracting colours…');
            return;
          }

          // OCR passes:
          // - First pass: 10–20, label "Extracting text…"
          // - Second pass (retry): 20–40, label "Refining text…"
          setUploadStage(2);

          if (!hasOCRRetriedRef.current) {
            // First OCR attempt: 10–20
            const mapped = 10 + Math.round((pct / 100) * 10);
            setUploadProgress(prev => Math.max(prev, mapped));
            setStageText(`Extracting text… (${pct}%)`);
            // Once first run hits 100%, flip the flag so any further OCR progress is "refining"
            if (pct >= 100) {
              hasOCRRetriedRef.current = true;
            }
          } else {
            // Second / refining pass: 20–40
            const mapped = 20 + Math.round((pct / 100) * 20);
            setUploadProgress(prev => Math.max(prev, mapped));
            setStageText(`Refining text… (${pct}%)`);
          }
        },
        controller.signal
      );
      
      if (controller.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
    // STAGE 3-5: Upload and analysis
    setUploadStage(3);
    // Don't reset progress visually; continue from extraction (~40%)
    setStageText('Uploading to server…');

    // DEV MODE: Simulate errors for testing
    if (process.env.NODE_ENV === 'development') {
      if (simulateTimeout) {
        console.log('🧪 DEV: Simulating timeout error');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Short delay for realism
        resetForRetry('Analysis timed out — AI is busy. Please try again.');
        setSimulateTimeout(false); // Reset toggle after triggering
        return;
      }
      if (simulateBotFail) {
        console.log('🧪 DEV: Simulating bot verification failure');
        await new Promise(resolve => setTimeout(resolve, 1000));
        resetForRetry('Bot verification failed. Please verify again and retry.');
        setSimulateBotFail(false);
        return;
      }
      if (simulateUploadFail) {
        console.log('🧪 DEV: Simulating upload failure');
        await new Promise(resolve => setTimeout(resolve, 1500));
        resetForRetry('Upload failed. Please try again.');
        setSimulateUploadFail(false);
        return;
      }
      if (simulate404Polling) {
        console.log('🧪 DEV: Simulating 404 polling (fake resume state)');
        // Create a fake resume state with non-existent ID
        const fakeUploadId = 'fake-' + crypto.randomUUID();
        localStorage.setItem('zombify_guest_active_upload', JSON.stringify({
          uploadId: fakeUploadId,
          timestamp: Date.now(),
          filePreview: previewUrl,
          guestSessionId: localStorage.getItem('guest_session_id')
        }));
        setSimulate404Polling(false);
        // Trigger resume by reloading
        window.location.reload();
        return;
      }
    }

      const guestSessionId = localStorage.getItem('guest_session_id');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id', uploadId); // Pass client-generated ID to server
      formData.append('is_guest', 'true');
      formData.append('guest_session_id', guestSessionId || '');
      formData.append('turnstile_token', turnstileToken);
      formData.append('extractedData', JSON.stringify(extractedData));
      if (bypassRateLimits) {
        formData.append('dev_bypass_rate_limits', 'true');
      }

      // Use XHR for upload progress with rotating text
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${APP_URL}/api/upload`);
        // Don't use credentials in production (CORS wildcard not allowed with credentials)
        // For dev/staging, we handle guest ownership via URL param and client-side cookie
        xhr.responseType = 'json';
        // Set 180-second timeout - fail fast on client side instead of waiting forever
        xhr.timeout = 180000;
        let analysisTickerStarted = false;
        
        // Wire up abort signal BEFORE starting upload
        const onAbort = () => {
          console.log('[XHR] Abort signal received, aborting request');
          xhr.abort();
          if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = null;
          }
        };
        controller.signal.addEventListener('abort', onAbort, { once: true });
        
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            // Continue global progress smoothly from extraction (~40%) into upload (~40–60)
            const base = 40;
            const span = 20; // 40–60
            const mapped = base + Math.round((pct / 100) * span);
            setStageText(pct < 5 ? 'Preparing image…' : 'Uploading to server…');
            setUploadProgress((prev) => Math.max(prev, mapped));
            if (pct >= 100 && !analysisTickerStarted) {
              analysisTickerStarted = true;
              // Enter long-running analysis phase:
              // - Pin progress ~65% for the first minute after upload completes
              // - Jump to ~85% for the second minute
              // - Only go to 100% when the server responds successfully
              setUploadStage(4);
              setUploadProgress((prev) => Math.max(prev, 65));
              setStageText('Generating recommendations…');
              analysisStartRef.current = Date.now();

              const phrases = [
                'Parsing interface…',
                'Identifying elements that “felt right at the time”…',
                'Squinting at pixels like a tired designer…',
                'Calculating GRIP signal…',
                'Inspecting alignment crime scenes…',
                'Measuring…',
                'Ranking UI sins…',
                'Noting every pixel you thought nobody would notice…',
                'Compiling evidence stack…',
                'Cross-referencing visual anomalies…',
                'Aggregating insights… slowly but surely.',
                'Prioritizing fixes…',
                'Reading text like a human…',
                'Mapping OCR fragments to patterns…',
                'Summarizing the damage…',
                'Stabilizing visual hallucinations…',
                'Tracking attention leaks…',
                'Checking for sneaky dark patterns…',
                'Detecting cognitive bottlenecks…',
                'Gently judging spacing decisions…',
                'Trying to make sense of this…'
              ];
              let i = 0;
              rotationTimerRef.current = window.setInterval(() => {
                i = (i + 1) % phrases.length;
                setStageText(phrases[i]);

                const start = analysisStartRef.current ?? Date.now();
                const elapsed = Date.now() - start;

                if (elapsed < 60_000) {
                  // First minute after upload: hold around 65%
                  setUploadProgress((prev) => Math.max(prev, 65));
                } else if (elapsed < 120_000) {
                  // Second minute: jump and hold around 85%
                  setUploadStage(5);
                  setUploadProgress((prev) => Math.max(prev, 85));
                } else {
                  // After 2 minutes: gently creep up but never reach 100% by time alone
                  setUploadProgress((prev) => Math.min(95, Math.max(prev, 85)));
                }
              }, 5000);
            }
          }
        };
        
        xhr.onload = () => {
          controller.signal.removeEventListener('abort', onAbort);
          if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = null;
          }
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(JSON.stringify(xhr.response), {
              status: xhr.status,
              headers: { 'Content-Type': 'application/json' }
            }));
          } else {
            resolve(new Response(JSON.stringify(xhr.response), {
              status: xhr.status,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        };
        
        xhr.onerror = () => {
          controller.signal.removeEventListener('abort', onAbort);
          if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = null;
          }
          reject(new Error('Network error'));
        };

        xhr.ontimeout = () => {
          controller.signal.removeEventListener('abort', onAbort);
          if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = null;
          }
          reject(new Error('Analysis timed out — hit retry and we\'ll check if it finished.'));
        };

        xhr.onabort = () => {
          controller.signal.removeEventListener('abort', onAbort);
          if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = null;
          }
          console.log('[XHR] Request aborted successfully');
          reject(new DOMException('Aborted', 'AbortError'));
        };
        
        xhr.send(formData);
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'RATE_LIMIT_EXCEEDED' && data.remainingTime) {
          const cooldownEnd = Date.now() + (data.remainingTime * 1000);
          localStorage.setItem('guest_upload_cooldown', cooldownEnd.toString());
          setCooldownSeconds(data.remainingTime);
          resetForRetry(data.error || 'Rate limit exceeded. Please try again later.');
        } else if (data.code === 'MONTHLY_LIMIT_EXCEEDED') {
          setCooldownSeconds(999999);
          resetForRetry('');  // No error message - UI shows signup prompt
        } else {
          resetForRetry(data.error || 'Upload failed. Please try again.');
        }
        return;
      }

      if (data.feedbackId) {
        // Mark visual progress as complete just before redirect
        setUploadStage(6);
        setUploadProgress(100);
        setStageText('Complete!');
        // Store guest session ID
        if (data.guestSessionId) {
          localStorage.setItem('z_guest_session_id', data.guestSessionId);
        }
        
        // Clear upload state - redirecting to feedback page
        localStorage.removeItem('zombify_guest_active_upload');
        
        // Redirect with guestSession param for client-side cookie setting
        const guestSessionId = localStorage.getItem('z_guest_session_id') || data.guestSessionId;
        allowUnloadRef.current = true;
        setUploading(false);
        
        const redirectUrl = new URL(`${APP_URL}/feedback/${data.feedbackId}`);
        if (guestSessionId) {
          redirectUrl.searchParams.set('guestSession', guestSessionId);
        }
        window.location.href = redirectUrl.toString();
      } else {
        resetForRetry('Upload succeeded but no feedback ID returned.');
      }
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      if (err.name === 'AbortError') {
        // User cancelled - reset state but don't show error
        console.log('Upload cancelled by user');
        setUploading(false);
        setUploadStage(0);
        setUploadProgress(0);
        setStageText('');
        setError(null);
        localStorage.removeItem('zombify_guest_active_upload');
        // Reset turnstile so they can try again
        setTurnstileToken(null);
        const turnstile = (window as any).turnstile;
        if (turnstile && widgetIdRef.current) {
          try { turnstile.reset(widgetIdRef.current); } catch {}
        }
      } else {
        resetForRetry(`Upload failed: ${err.message}`);
      }
    } finally {
      abortControllerRef.current = null;
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    }
  };

  const isDisabled = cooldownSeconds > 0;

  return (
    <>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />
      
      {/* Dev Mode Toggle - Visible in development and staging */}
      {showDevPanel && (
        <div className="fixed top-4 left-4 z-[9999] bg-yellow-100 border-2 border-yellow-400 p-3 shadow-lg rounded max-w-xs">
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
              <div className="text-[10px] font-bold text-gray-700 mb-2">ERROR SIMULATION:</div>

              {/* Simulate Timeout */}
              <button
                onClick={() => setSimulateTimeout(!simulateTimeout)}
                className={`block w-full px-2 py-1.5 text-white text-xs transition-colors rounded text-left ${simulateTimeout ? 'bg-orange-600' : 'bg-orange-400 hover:bg-orange-500'}`}
              >
                {simulateTimeout ? '🔥 ARMED' : '⏱️'} Timeout Error
              </button>

              {/* Simulate Bot Fail */}
              <button
                onClick={() => setSimulateBotFail(!simulateBotFail)}
                className={`block w-full px-2 py-1.5 text-white text-xs transition-colors rounded text-left ${simulateBotFail ? 'bg-orange-600' : 'bg-orange-400 hover:bg-orange-500'}`}
              >
                {simulateBotFail ? '🔥 ARMED' : '🤖'} Bot Verification Fail
              </button>

              {/* Simulate Upload Fail */}
              <button
                onClick={() => setSimulateUploadFail(!simulateUploadFail)}
                className={`block w-full px-2 py-1.5 text-white text-xs transition-colors rounded text-left ${simulateUploadFail ? 'bg-orange-600' : 'bg-orange-400 hover:bg-orange-500'}`}
              >
                {simulateUploadFail ? '🔥 ARMED' : '💥'} Upload Fail
              </button>

              {/* Simulate 404 Polling */}
              <button
                onClick={() => setSimulate404Polling(!simulate404Polling)}
                className={`block w-full px-2 py-1.5 text-white text-xs transition-colors rounded text-left ${simulate404Polling ? 'bg-orange-600' : 'bg-orange-400 hover:bg-orange-500'}`}
              >
                {simulate404Polling ? '🔥 ARMED' : '🔄'} 404 Polling Loop
              </button>

              <div className="text-[10px] font-bold text-gray-700 mt-3 mb-2">RATE LIMIT TESTING:</div>

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
            ${cooldownSeconds > 0 ? 'cursor-default' : (isDisabled && !uploading) ? 'cursor-not-allowed opacity-60' : uploading ? 'cursor-default' : 'cursor-pointer group'}
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

          <div className="space-y-4 relative z-20 w-full">
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
                    Login
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignUp();
                    }}
                    className="font-mono text-sm tracking-wide px-4 py-2 bg-black border border-black text-white hover:bg-black/90 transition-all"
                  >
                    Sign up
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
                  {getOverlayMessage()}
                </div>
                <div className="w-3/4 max-w-sm mx-auto">
                  <div className="flex gap-1 items-center">
                        {Array.from({ length: 20 }).map((_, i) => {
                          const filledSegments = Math.floor((displayProgress / 100) * 20);
                          const isFilled = i < filledSegments;
                          const isFlashing = i === filledSegments && filledSegments < 20;
                          return (
                            <div
                              key={i}
                              className={`h-2 flex-1 ${isFilled ? 'bg-black' : 'bg-[#c4c1b8]'} ${isFlashing ? 'flash-fill' : ''}`}
                            />
                          );
                        })}
                  </div>
                </div>
                
                {uploadStage < 3 && (
                  <ButtonBig
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🛑 CANCEL clicked, aborting upload');
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                      }
                      if (rotationTimerRef.current) {
                        clearInterval(rotationTimerRef.current);
                        rotationTimerRef.current = null;
                      }
                      localStorage.removeItem('zombify_guest_active_upload');
                      setUploading(false);
                      setUploadStage(0);
                      setUploadProgress(0);
                      setStageText('');
                      // DON'T remove file/preview/turnstile - keep them so user can retry
                    }}
                    variant="black"
                    stroke="thick"
                  >
                    Cancel
                  </ButtonBig>
                )}
                
                {uploadStage >= 3 && (
                  <AnalyzeButton
                    disabled
                    variant="black"
                    stroke="thick"
                    isAnalyzing={true}
                    idleText="Analyze"
                    analyzingText="Analyzing"
                  />
                )}
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
                              Remove
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
                    Verify I'm human
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
                      setHadUploadError(false); // Reset error state on new attempt
                      setError(null);
                      handleUpload();
                    }}
                    variant="black"
                    stroke="thick"
                  >
                    {hadUploadError ? 'Try Again' : 'Analyze'}
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
