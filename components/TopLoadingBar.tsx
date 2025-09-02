'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ProgressController {
  start: () => void;
  complete: () => void;
  reset: () => void;
}

/**
 * TopLoadingBar
 * A thin 6px progress bar that appears fixed at the very top of the viewport
 * during route transitions. It keeps the current page visible while the bar
 * animates; once the navigation settles, it quickly completes and fades out.
 */
export default function TopLoadingBar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const incrementTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const lastPathRef = useRef<string | null>(null);

  const controller = useMemo<ProgressController>(() => {
    const clearTimers = () => {
      if (incrementTimerRef.current) {
        window.clearInterval(incrementTimerRef.current);
        incrementTimerRef.current = null;
      }
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };

    return {
      start: () => {
        clearTimers();
        setIsVisible(true);
        setOpacity(1);
        setProgress(8);

        // Smoothly increment up to ~90% while loading
        incrementTimerRef.current = window.setInterval(() => {
          setProgress((p) => {
            const next = p + Math.max(0.5, (90 - p) * 0.03);
            return Math.min(next, 90);
          });
        }, 120);
      },
      complete: () => {
        // Finish the bar and fade out after a short delay
        if (incrementTimerRef.current) {
          window.clearInterval(incrementTimerRef.current);
          incrementTimerRef.current = null;
        }
        setProgress(100);
        settleTimerRef.current = window.setTimeout(() => {
          setOpacity(0);
          // Allow fade-out animation to complete before hiding
          settleTimerRef.current = window.setTimeout(() => {
            setIsVisible(false);
            setProgress(0);
          }, 250);
        }, 150);
      },
      reset: () => {
        clearTimers();
        setIsVisible(false);
        setOpacity(0);
        setProgress(0);
      }
    };
  }, []);

  // Trigger on pathname changes
  useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname || '';
      return;
    }

    // Ignore if the path didn't actually change
    if (pathname === lastPathRef.current) return;

    // Start progress on navigation start
    controller.start();

    // Heuristic: consider navigation complete on next browser frame + a small delay.
    // This avoids blank states and keeps current page visible during transition.
    // If the destination does additional data fetching, the visual polish still holds.
    const afterFrame = requestAnimationFrame(() => {
      // Minimum visible duration to avoid flicker on very fast navigations
      settleTimerRef.current = window.setTimeout(() => {
        controller.complete();
        lastPathRef.current = pathname || '';
      }, 400);
    });

    return () => cancelAnimationFrame(afterFrame);
  }, [pathname, controller]);

  // Cleanup on unmount
  useEffect(() => {
    return () => controller.reset();
  }, [controller]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 6,
        zIndex: 1000,
        opacity,
        transition: 'opacity 180ms ease-out'
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #16a34a, #16a34a)',
          boxShadow: '0 0 8px rgba(22,163,74,0.35)',
          transition: 'width 180ms ease-out'
        }}
      />
    </div>
  );
}


