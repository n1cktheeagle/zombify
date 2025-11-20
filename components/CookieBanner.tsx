'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
    setIsLoaded(true);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', 'all');
    setIsVisible(false);
    // Enable all tracking
    enableTracking(true);
  };

  const handleNecessaryOnly = () => {
    localStorage.setItem('cookie_consent', 'necessary');
    setIsVisible(false);
    // Disable optional tracking
    enableTracking(false);
  };

  const enableTracking = (enable: boolean) => {
    // PostHog tracking
    if (typeof window !== 'undefined' && (window as any).posthog) {
      if (enable) {
        (window as any).posthog.opt_in_capturing();
      } else {
        (window as any).posthog.opt_out_capturing();
      }
    }

    // Store preference for zombify-app to read
    localStorage.setItem('tracking_enabled', enable ? 'true' : 'false');
  };

  // Don't render until we've checked localStorage (prevents flash)
  if (!isLoaded || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm animate-in slide-in-from-right">
      {/* Toast-style Cookie Banner */}
      <div className="bg-white border-4 border-black p-6 shadow-lg font-mono">
        <h2 className="text-base font-bold mb-2 text-left">Cookie Preferences</h2>
        <p className="text-sm text-black/70 mb-4 text-left leading-relaxed">
          Zombify uses necessary cookies for authentication and core functionality. Optional analytics and attribution cookies help us improve the product.
        </p>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-black/90 transition-colors font-medium text-sm w-full"
          >
            ACCEPT ALL
          </button>
          <button
            onClick={handleNecessaryOnly}
            className="px-4 py-2 border-2 border-black bg-white text-black hover:bg-black/5 transition-colors font-medium text-sm w-full"
          >
            NECESSARY ONLY
          </button>
          <Link
            href="/cookies"
            className="px-4 py-2 text-center text-sm text-black/60 hover:text-black transition-colors underline"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

