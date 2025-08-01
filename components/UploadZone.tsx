'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useAuthModal } from '@/hooks/useAuthModal';
import { AuthModal } from '@/components/AuthModal';

interface UploadZoneProps {
  onFileSelect?: (file: File) => void;
  onZombify?: (file: File) => Promise<void>;
  isLoggedIn?: boolean;
  disabled?: boolean;
  showCooldown?: boolean;
  cooldownSeconds?: number;
}

export default function UploadZone({ 
  onFileSelect, 
  onZombify, 
  isLoggedIn = false, 
  disabled = false,
  showCooldown = false,
  cooldownSeconds = 86400 // 24 hours default
}: UploadZoneProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const [animatedText, setAnimatedText] = useState('Feed Zombify');
  const [typingText, setTypingText] = useState('Feed Zombify');
  const [isTyping, setIsTyping] = useState(false);
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  const { showAuthModal, authMode, openSignIn, openSignUp, closeModal } = useAuthModal();

  // Define computed values first
  const isDisabledComputed = disabled || cooldownTime > 0 || (!isLoggedIn && showCooldown);
  const shouldShowCooldownComputed = showCooldown && cooldownTime > 0;

  // Typewriter effect function
  const typeText = (text: string, callback?: () => void) => {
    // Clear any existing interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }
    
    setIsTyping(true);
    setTypingText('');
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setTypingText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        typewriterIntervalRef.current = null;
        setIsTyping(false);
        if (callback) callback();
      }
    }, 80);
    
    typewriterIntervalRef.current = interval;
  };

  // Text animation effect with looping and typewriter
  useEffect(() => {
    // Clear all timers when dependencies change
    animationTimersRef.current.forEach(timer => clearTimeout(timer));
    animationTimersRef.current = [];
    
    if (!uploadedFile && !isDisabledComputed && !showAuthMessage && !shouldShowCooldownComputed) {
      const runTextAnimation = () => {
        const timer1 = setTimeout(() => {
          typeText('...hello?');
        }, 7500);

        const timer2 = setTimeout(() => {
          typeText("c'mon feed me");
        }, 15000);

        const timer3 = setTimeout(() => {
          typeText('are you alive?...');
        }, 22500);

        const timer4 = setTimeout(() => {
          typeText('Feed Zombify', () => {
            // Restart the loop after typing is complete
            const loopTimer = setTimeout(runTextAnimation, 100);
            animationTimersRef.current.push(loopTimer);
          });
        }, 30000);

        animationTimersRef.current = [timer1, timer2, timer3, timer4];
      };

      runTextAnimation();
    } else {
      // Clear any running typewriter effect
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
      setTypingText('Feed Zombify');
      setIsTyping(false);
    }
    
    return () => {
      // Cleanup on unmount
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, [uploadedFile, isDisabledComputed, showAuthMessage, shouldShowCooldownComputed]);

  // Cooldown timer effect
  useEffect(() => {
    if (showCooldown && cooldownSeconds > 0) {
      setCooldownTime(cooldownSeconds);
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
  }, [showCooldown, cooldownSeconds]);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    // Check if user is logged in for multiple uploads
    if (!isLoggedIn && showCooldown) {
      setShowAuthMessage(true);
      setTimeout(() => setShowAuthMessage(false), 3000);
      return;
    }
    
    setUploadedFile(file);
    setError('');
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError('');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Show auth message for guest users
    if (!isLoggedIn && showCooldown) {
      setShowAuthMessage(true);
      setTimeout(() => setShowAuthMessage(false), 3000);
      return;
    }
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoggedIn && showCooldown) {
      setShowAuthMessage(true);
      return;
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setShowAuthMessage(false);
  };

  const handleZombify = async () => {
    if (!uploadedFile || !onZombify) return;

    setIsAnalyzing(true);
    setError('');

    try {
      await onZombify(uploadedFile);
    } catch (err) {
      console.error('Zombify error:', err);
      setError('Analysis failed - try again');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format cooldown time display
  const formatCooldownTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };


  return (
    <>
      <div className="w-full">
        <div
          className={`
            relative overflow-hidden
            border-2 border-dashed rounded-lg p-8 text-center
            transition-all duration-300 scanline-effect
            ${isDisabledComputed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}
            ${!isDisabledComputed && !showAuthMessage && !shouldShowCooldownComputed ? 'border-black/50 bg-black/5' : 'border-black/20'}
            ${uploadedFile ? 'border-black/40 bg-black/5' : ''}
            ${showAuthMessage ? 'border-red-400 bg-red-50' : ''}
            ${shouldShowCooldownComputed ? 'border-orange-400 bg-orange-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (isDisabledComputed) return;
            document.getElementById('file-input')?.click();
          }}
          onMouseEnter={() => {
            if (!isLoggedIn && showCooldown) {
              setShowAuthMessage(true);
            }
          }}
          onMouseLeave={() => {
            if (!isDragOver) {
              setShowAuthMessage(false);
            }
          }}
        >


          <input 
            id="file-input" 
            type="file" 
            accept="image/*" 
            onChange={handleFileInput} 
            className="hidden" 
            disabled={isDisabledComputed}
          />

          <div className="space-y-4 relative z-10">
            {/* Cooldown Timer */}
            {shouldShowCooldownComputed && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2 font-mono">
                  {formatCooldownTime(cooldownTime)}
                </div>
                <p className="text-sm text-orange-700 font-mono">
                  24 HOUR COOLDOWN ACTIVE
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Sign up for 3 uploads per month • Pro for unlimited
                </p>
              </div>
            )}

            {/* Auth Message */}
            {showAuthMessage && (
              <div className="text-center">
                <p className="text-red-600 font-medium mb-3 font-mono">
                  Create an account to zombify more designs
                </p>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignIn();
                    }}
                    className="text-sm font-mono tracking-wide px-4 py-2 border border-red-400 text-red-600 hover:bg-red-50 transition-all"
                  >
                    LOGIN
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignUp();
                    }}
                    className="text-sm font-mono tracking-wide px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-all"
                  >
                    SIGN UP FREE
                  </button>
                </div>
              </div>
            )}

            {/* File Preview or Default State */}
            {!shouldShowCooldownComputed && !showAuthMessage && (
              <>
                {uploadedFile ? (
                  <>
                    {/* Image Preview with Remove Button */}
                    <div className="relative mx-auto">
                      <div className="w-24 h-24 mx-auto border-2 border-black/40 rounded-lg overflow-hidden bg-black/5 relative group">
                        {previewUrl && (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Remove Button Overlay */}
                        {!isDisabledComputed && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
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
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs opacity-60">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)}MB • Ready for analysis
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-12 h-12 mx-auto border-2 border-black/20 rounded-lg flex items-center justify-center transition-colors ${!isDisabledComputed ? 'group-hover:border-black/40' : ''}`}>
                      <Upload className={`w-6 h-6 opacity-60 transition-opacity ${!isDisabledComputed ? 'group-hover:opacity-80' : ''}`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-medium">
                        {isDisabledComputed ? 'Upload disabled' : typingText}
                        {isTyping && <span className="inline-block w-[2px] h-[1em] bg-current ml-[1px] animate-blink align-middle"></span>}
                      </p>
                      <p className="text-sm opacity-60">
                        {isDisabledComputed ? 'Account required for more uploads' : 'or click to browse • PNG, JPG, or any UI screenshot'}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        {uploadedFile && onZombify && !shouldShowCooldown && !showAuthMessage && (
          <div className="mt-6 text-center space-y-4">
            <button
              onClick={handleZombify}
              disabled={isAnalyzing || isDisabled}
              className={`zombify-primary-button px-8 py-3 text-lg font-bold tracking-wide transition-all duration-200 ${isAnalyzing || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAnalyzing ? 'ANALYZING...' : 'ZOMBIFY'}
            </button>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>
        )}

      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={closeModal} 
          initialMode={authMode}
        />
      )}
    </>
  );
}