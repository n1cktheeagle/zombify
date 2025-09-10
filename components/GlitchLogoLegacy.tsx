'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface GlitchLogoProps {
  onClick?: () => void;
  className?: string;
}

const translations = [
  'ZOMBIFY',     // Original
  'ゾンビファイ',    // Japanese
  'ЗОМБИФАЙ',    // Russian
  'ZOMBIFICAR',  // Spanish/Portuguese
  'ZOMBIFIER',   // French
  'ZOMBIFIZIEREN', // German
  'ZOMBIFIERA',  // Swedish
  '僵尸化',       // Chinese (Simplified)
  '殭屍化',       // Chinese (Traditional)
  'ЗОМБИ',       // Bulgarian
  'ՄԱՀԱՑՈՒ',     // Armenian
  'زومبي',       // Arabic
  'वॉकिंग',      // Hindi
  'ЗОМБИРАЈ',    // Serbian
  'МЕРТВИЙ',     // Ukrainian
  'UKUZOMBIFY',  // Xhosa
  'ZOMBIFISEER', // Afrikaans
  '좀비파이',      // Korean
  'ซอมบิไฟ',     // Thai
];

export default function GlitchLogoLegacy({ onClick, className = '' }: GlitchLogoProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [currentText, setCurrentText] = useState('ZOMBIFY');
  const [glitchInterval, setGlitchInterval] = useState<NodeJS.Timeout | null>(null);

  const startGlitch = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    let glitchCount = 0;
    const maxGlitches = 8;
    let finalTranslation = 'ZOMBIFY';
    const interval = setInterval(() => {
      if (glitchCount < maxGlitches) {
        const randomTranslation = translations[Math.floor(Math.random() * translations.length)];
        setCurrentText(randomTranslation);
        finalTranslation = randomTranslation;
        glitchCount++;
      } else {
        setCurrentText(finalTranslation);
        setIsGlitching(false);
        clearInterval(interval);
        setGlitchInterval(null);
      }
    }, 120);
    setGlitchInterval(interval);
  };

  const stopGlitch = () => {
    if (glitchInterval) {
      clearInterval(glitchInterval);
      setGlitchInterval(null);
    }
    setIsGlitching(false);
  };

  useEffect(() => {
    return () => {
      if (glitchInterval) {
        clearInterval(glitchInterval);
      }
    };
  }, [glitchInterval]);

  return (
    <div 
      className={`logo-glitch ${isGlitching ? 'glitch-active' : ''} flex items-center gap-2 cursor-pointer transition-all duration-200 shrink-0 whitespace-nowrap ${className}`}
      onClick={onClick}
      onMouseEnter={startGlitch}
      onMouseLeave={stopGlitch}
    >
      <div className="relative">
        <Image 
          src="/logo.png" 
          alt="Logo" 
          width={28} 
          height={28} 
          className={`object-contain transition-all duration-100 ${
            isGlitching ? 'blur-[0.5px] brightness-110 contrast-125' : ''
          }`}
        />
        {isGlitching && (
          <>
            <div className="absolute inset-0 opacity-30">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={28} 
                height={28} 
                className="object-contain filter hue-rotate-180 translate-x-[1px] translate-y-[1px]"
              />
            </div>
            <div className="absolute inset-0 opacity-20">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={28} 
                height={28} 
                className="object-contain filter sepia translate-x-[-1px] translate-y-[-1px]"
              />
            </div>
          </>
        )}
      </div>
      <div className="relative overflow-hidden">
        <div 
          className={`text-lg font-bold tracking-tight text-black transition-all duration-100 ${
            isGlitching 
              ? 'filter blur-[0.5px] text-shadow-sm animate-pulse' 
              : 'hover:opacity-80'
          }`}
          style={{
            textShadow: isGlitching ? '1px 1px 2px rgba(255,0,0,0.3), -1px -1px 2px rgba(0,255,255,0.3)' : 'none',
            letterSpacing: isGlitching ? '0.1em' : 'normal'
          }}
        >
          {currentText}
        </div>
        {isGlitching && (
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute w-full h-[1px] bg-red-500 opacity-50"
              style={{ top: `${Math.random() * 100}%`, animation: 'glitch-line 0.1s linear infinite' }}
            />
            <div 
              className="absolute w-full h-[1px] bg-cyan-500 opacity-50"
              style={{ top: `${Math.random() * 100}%`, animation: 'glitch-line 0.15s linear infinite reverse' }}
            />
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes glitch-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}


