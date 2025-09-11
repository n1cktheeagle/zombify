'use client';

import { useEffect, useMemo, useRef, useState } from 'react'

type GlitchIntensity = 'low' | 'medium' | 'high'
type GlitchTrigger = 'hover' | 'continuous' | 'mount'

interface GlitchTextProps {
  children: string
  className?: string
  intensity?: GlitchIntensity
  trigger?: GlitchTrigger
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function GlitchText({
  children,
  className = '',
  intensity = 'low',
  trigger = 'continuous',
}: GlitchTextProps) {
  const original = String(children)
  const [display, setDisplay] = useState<string>(original)
  const [glitching, setGlitching] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const scrambleChars = useMemo(() => {
    return Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*@?/=+~')
  }, [])

  const durationMs = intensity === 'low' ? 350 : intensity === 'medium' ? 550 : 850
  const stepMs = 30

  useEffect(() => {
    if (trigger === 'mount') runGlitchOnce()
    if (trigger === 'continuous') {
      const timer = setInterval(() => runGlitchOnce(), 3000 + Math.random() * 4000)
      return () => clearInterval(timer)
    }
    return undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, intensity])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const runGlitchOnce = () => {
    if (glitching) return
    setGlitching(true)
    startTimeRef.current = performance.now()
    const tick = () => {
      const now = performance.now()
      const elapsed = now - startTimeRef.current
      if (elapsed >= durationMs) {
        setDisplay(original)
        setGlitching(false)
        rafRef.current = null
        return
      }
      const progress = elapsed / durationMs
      const scrambleCount = Math.max(1, Math.floor((original.length * (intensity === 'low' ? 0.08 : intensity === 'medium' ? 0.14 : 0.22)) * (0.5 + Math.sin(progress * Math.PI))))
      const indices = new Set<number>()
      while (indices.size < scrambleCount) {
        const i = Math.floor(Math.random() * original.length)
        if (original[i] !== ' ') indices.add(i)
      }
      const next = original
        .split('')
        .map((ch, idx) => (indices.has(idx) ? pickRandom(scrambleChars) : ch))
        .join('')
      setDisplay(next)
      rafRef.current = requestAnimationFrame(() => {
        // slow down updates a bit
        setTimeout(() => tick(), stepMs)
      })
    }
    tick()
  }

  const onHover = () => {
    if (trigger === 'hover') runGlitchOnce()
  }

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={onHover}
      style={{ willChange: 'contents', transition: 'filter 120ms ease' }}
    >
      {display}
    </span>
  )
}


