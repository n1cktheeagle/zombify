'use client';

import { useEffect, useMemo, useRef, useState } from 'react'

interface GlitchTranslateProps {
  baseText?: string
  className?: string
  intensity?: 'low' | 'medium' | 'high'
}

// Mirrors the languages used in GlitchLogo
const TRANSLATIONS = [
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

function pickRandomOther<T>(arr: T[], not: T): T {
  const pool = arr.filter((x) => x !== not)
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function GlitchTranslate({
  baseText = 'Zombify',
  className = '',
  intensity = 'low',
}: GlitchTranslateProps) {
  const [display, setDisplay] = useState<string>(baseText)
  const [target, setTarget] = useState<string>(() => pickRandomOther(TRANSLATIONS, 'ZOMBIFY'))
  const [glitching, setGlitching] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const revertTimerRef = useRef<number | null>(null)

  const scrambleChars = useMemo(() => Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*@?/=+~'), [])
  const durationMs = intensity === 'low' ? 380 : intensity === 'medium' ? 600 : 900
  const stepMs = 28

  useEffect(() => {
    const timer = setInterval(() => runGlitchTranslate(), 4000 + Math.random() * 4000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, target])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (revertTimerRef.current) window.clearTimeout(revertTimerRef.current)
    }
  }, [])

  const runGlitchTranslate = () => {
    if (glitching) return
    setGlitching(true)
    startTimeRef.current = performance.now()
    const from = display
    const to = target
    const maxLen = Math.max(from.length, to.length)
    const tick = () => {
      const now = performance.now()
      const elapsed = now - startTimeRef.current
      if (elapsed >= durationMs) {
        setDisplay(to)
        setGlitching(false)
        rafRef.current = null
        // schedule automatic revert back to Zombify after 0.5s
        if (revertTimerRef.current) window.clearTimeout(revertTimerRef.current)
        revertTimerRef.current = window.setTimeout(() => {
          setDisplay(baseText)
          // choose a new target for the next cycle
          setTarget(pickRandomOther(TRANSLATIONS, 'ZOMBIFY'))
        }, 500) as unknown as number
        return
      }
      const progress = elapsed / durationMs
      const scrambleRatio = (intensity === 'low' ? 0.12 : intensity === 'medium' ? 0.2 : 0.3) * (0.5 + Math.sin(progress * Math.PI))
      const scrambleCount = Math.max(1, Math.floor(maxLen * scrambleRatio))
      const indices = new Set<number>()
      while (indices.size < scrambleCount) indices.add(Math.floor(Math.random() * maxLen))
      const next = Array.from({ length: maxLen }).map((_, i) => {
        if (indices.has(i)) return scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
        // cross-fade characters: first half prefers from, second half prefers to
        if (progress < 0.5) return from[i] ?? ' '
        return to[i] ?? ' '
      }).join('')
      setDisplay(next)
      rafRef.current = requestAnimationFrame(() => { setTimeout(() => tick(), stepMs) })
    }
    tick()
  }

  return (
    <span className={`inline-block ${className}`} style={{ willChange: 'contents' }}>{display}</span>
  )
}


