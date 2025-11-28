'use client';

import * as React from 'react';

export interface EncryptedTextProps {
  text: string;
  className?: string;
  revealDelayMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
}

const DEFAULT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?';

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const [revealedCount, setRevealedCount] = React.useState(0);
  const [displayChars, setDisplayChars] = React.useState<string[]>([]);

  React.useEffect(() => {
    const chars = text.split('');
    setRevealedCount(0);
    setDisplayChars(
      chars.map((ch) => (ch === ' ' ? ' ' : charset[Math.floor(Math.random() * charset.length)]))
    );

    if (!text) return;

    let revealTimer: number | undefined;
    let flipTimer: number | undefined;

    // Reveal one real character at a time
    revealTimer = window.setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          if (revealTimer) window.clearInterval(revealTimer);
          return prev;
        }
        const next = prev + 1;
        setDisplayChars((current) => {
          const updated = [...current];
          updated[next - 1] = text[next - 1];
          return updated;
        });
        return next;
      });
    }, revealDelayMs) as unknown as number;

    // Continuously flip unrevealed characters
    flipTimer = window.setInterval(() => {
      setDisplayChars((current) => {
        return current.map((ch, idx) => {
          if (idx < revealedCount || text[idx] === ' ') return text[idx];
          return charset[Math.floor(Math.random() * charset.length)];
        });
      });
    }, flipDelayMs) as unknown as number;

    return () => {
      if (revealTimer) window.clearInterval(revealTimer);
      if (flipTimer) window.clearInterval(flipTimer);
    };
    // Intentionally only depend on text/charset/timings; revealedCount is used inside updater
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, charset, revealDelayMs, flipDelayMs]);

  return (
    <span className={className}>
      {displayChars.map((ch, idx) => {
        const isRevealed = idx < revealedCount || text[idx] === ' ';
        return (
          <span
            key={idx}
            className={isRevealed ? revealedClassName : encryptedClassName}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}


