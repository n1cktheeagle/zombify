'use client';

import Image from 'next/image'
import GlitchText from '@/components/GlitchText'
import React, { useEffect, useState } from 'react'

interface GlitchLogoProps {
  onClick?: () => void
  className?: string
}

const translations = [
  'ZOMBIFY',
  'ゾンビファイ',
  'ЗОМБИФАЙ',
  'ZOMBIFICAR',
  'ZOMBIFIER',
  'ZOMBIFIZIEREN',
  'ZOMBIFIERA',
  '僵尸化',
  '殭屍化',
  'ЗОМБИ',
  'ՄԱՀԱՑՈՒ',
  'زومبي',
  'वॉकिंग',
  'ЗОМБИРАЈ',
  'МЕРТВИЙ',
  'UKUZOMBIFY',
  'ZOMBIFISEER',
  '좀비파이',
  'ซอมบิไฟ',
]

export default function GlitchLogo({ onClick, className = '' }: GlitchLogoProps) {
  const [isGlitching, setIsGlitching] = useState(false)
  const [currentText, setCurrentText] = useState('ZOMBIFY')
  const [glitchInterval, setGlitchInterval] = useState<NodeJS.Timeout | null>(null)

  const startGlitch = () => {
    if (isGlitching) return
    setIsGlitching(true)
    let glitchCount = 0
    const maxGlitches = 8
    let finalTranslation = 'ZOMBIFY'
    const interval = setInterval(() => {
      if (glitchCount < maxGlitches) {
        const randomTranslation = translations[Math.floor(Math.random() * translations.length)]
        setCurrentText(randomTranslation)
        finalTranslation = randomTranslation
        glitchCount++
      } else {
        setCurrentText(finalTranslation)
        setIsGlitching(false)
        clearInterval(interval)
        setGlitchInterval(null)
        // persist last translation (no auto-revert)
      }
    }, 120)
    setGlitchInterval(interval)
  }

  const stopGlitch = () => {
    if (glitchInterval) {
      clearInterval(glitchInterval)
      setGlitchInterval(null)
    }
    setIsGlitching(false)
  }

  useEffect(() => {
    return () => {
      if (glitchInterval) clearInterval(glitchInterval)
    }
  }, [glitchInterval])

  return (
    <div
      className={`logo-glitch ${isGlitching ? 'glitch-active' : ''} flex items-center gap-2 cursor-pointer transition-all duration-200 shrink-0 whitespace-nowrap ${className}`}
      onClick={onClick}
      onMouseEnter={startGlitch}
      onMouseLeave={stopGlitch}
    >
      <div className="relative">
        <Image src="/logo.png" alt="Logo" width={28} height={28} className={`object-contain ${isGlitching ? 'brightness-110 contrast-125' : ''}`} />
        {/* Scanline overlays to make translations obvious */}
        {isGlitching && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-full h-[1px] bg-red-500/50" style={{ top: `${Math.random() * 100}%`, animation: 'gl-line 0.12s linear infinite' }} />
            <div className="absolute w-full h-[1px] bg-cyan-500/50" style={{ bottom: `${Math.random() * 100}%`, animation: 'gl-line 0.16s linear infinite reverse' }} />
          </div>
        )}
      </div>
      {/* Only scramble on hover to avoid masking translation idle state */}
      <GlitchText intensity="low" trigger="hover" className={`text-lg font-bold tracking-tight text-black ${isGlitching ? 'animate-pulse' : ''}`}>
        {currentText}
      </GlitchText>
      <style jsx>{`
        @keyframes gl-line { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  )
}