'use client';

import { useEffect, useMemo, useRef, useState } from 'react'

interface GlitchArtProps {
  children: string
  className?: string
  intensity?: 'low' | 'medium' | 'high'
  // Optional normalized mask rectangle [0,1] to restrict scrambling area
  mask?: { rowStart: number; rowEnd: number; colStart: number; colEnd: number }
  // Optional number of small random "melt spots" per tick (more subtle, scattered)
  randomSpots?: number
  // Normalized size for each spot (fractions of rows/cols)
  spotSize?: { row: number; col: number }
}

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export default function GlitchArt({ children, className = '', intensity = 'low', mask, randomSpots = 0, spotSize = { row: 0.1, col: 0.08 } }: GlitchArtProps) {
  const original = String(children)
  const [display, setDisplay] = useState<string>(original)
  const [glitching, setGlitching] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // Replacement character palette (no positional movement)
  const chars = useMemo(() => Array.from('@#%&WM$*+=-:;,.!'), [])
  const durationMs = intensity === 'low' ? 420 : intensity === 'medium' ? 650 : 900
  const stepMs = 28

  useEffect(() => {
    const timer = setInterval(() => run(), 3500 + Math.random() * 3500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const run = () => {
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
      // Melt-style distortion within mask: vertical drips + horizontal offsets (localized), outside mask untouched
      const srcLines = original.split('\n')
      const outLines = srcLines.map((ln) => ln.split(''))
      const totalRows = srcLines.length

      // Determine per-row masked column ranges
      const norm = (v: number) => Math.max(0, Math.min(1, v))
      const rs = mask ? Math.floor(norm(mask.rowStart) * totalRows) : 0
      const re = mask ? Math.floor(norm(mask.rowEnd) * totalRows) : totalRows - 1

      const applySpot = (rs2: number, re2: number, cs2Getter: (row: number) => number, ce2Getter: (row: number) => number) => {
        for (let r = rs2; r <= re2; r++) {
          const cols = srcLines[r].length
          const cs2 = Math.max(0, Math.min(cols - 1, cs2Getter(r)))
          const ce2 = Math.max(cs2, Math.min(cols - 1, ce2Getter(r)))
          if (ce2 < cs2 || cols === 0) continue

          const width = ce2 - cs2 + 1
          const dripColsCount = Math.max(1, Math.floor(width * (intensity === 'low' ? 0.04 : intensity === 'medium' ? 0.07 : 0.12)))
          const dripCols = new Set<number>()
          while (dripCols.size < dripColsCount) dripCols.add(cs2 + Math.floor(Math.random() * width))

          const maxDrip = intensity === 'low' ? 2 : intensity === 'medium' ? 3 : 5
          const dripDepth = Math.max(1, Math.floor(maxDrip * progress * progress))
          dripCols.forEach((c) => {
            const srcRow = Math.max(rs, r - dripDepth)
            const ch = srcLines[srcRow]?.[c]
            if (ch && ch !== ' ') outLines[r][c] = ch
          })

          const dxMax = intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3
          const dir = Math.random() < 0.5 ? -1 : 1
          const dx = Math.min(dxMax, Math.max(1, Math.round(dxMax * Math.sin(progress * Math.PI)))) * dir
          for (let c = cs2; c <= ce2; c++) {
            const fromC = Math.min(ce2, Math.max(cs2, c - dx))
            const ch = outLines[r][fromC]
            if (ch && ch !== ' ') outLines[r][c] = ch
          }

          const noiseRatio = intensity === 'low' ? 0.01 : intensity === 'medium' ? 0.02 : 0.03
          const noiseCount = Math.max(1, Math.floor(width * noiseRatio))
          for (let i = 0; i < noiseCount; i++) {
            const c = cs2 + Math.floor(Math.random() * Math.max(1, width))
            const ch = outLines[r][c]
            if (ch && ch !== ' ') outLines[r][c] = pickRandom(chars)
          }
        }
      }

      if (randomSpots > 0) {
        // Allowed area from global mask or whole art
        const allowedRS = rs
        const allowedRE = re
        const spots = Math.max(1, randomSpots)
        for (let s = 0; s < spots; s++) {
          const centerR = Math.floor(allowedRS + Math.random() * Math.max(1, allowedRE - allowedRS + 1))
          const rowsSpan = Math.max(1, Math.floor(totalRows * spotSize.row))
          const spotRS = Math.max(allowedRS, centerR - Math.floor(rowsSpan / 2))
          const spotRE = Math.min(allowedRE, spotRS + rowsSpan)
          // Choose a center column relative to the center row length
          const baseCols = srcLines[centerR].length
          const allowedCS = mask ? Math.floor(norm(mask.colStart) * baseCols) : 0
          const allowedCE = mask ? Math.floor(norm(mask.colEnd) * baseCols) : baseCols - 1
          const centerC = Math.max(allowedCS, Math.min(allowedCE, allowedCS + Math.floor(Math.random() * Math.max(1, allowedCE - allowedCS + 1))))
          const colsSpan = Math.max(1, Math.floor(baseCols * spotSize.col))
          for (let rr = spotRS; rr <= spotRE; rr++) {
            const rowCols = srcLines[rr].length
            const csAllowed = mask ? Math.floor(norm(mask.colStart) * rowCols) : 0
            const ceAllowed = mask ? Math.floor(norm(mask.colEnd) * rowCols) : rowCols - 1
            const spotCS = Math.max(csAllowed, Math.min(ceAllowed, centerC - Math.floor(colsSpan / 2)))
            const spotCE = Math.min(ceAllowed, spotCS + colsSpan)
            applySpot(rr, rr, () => spotCS, () => spotCE)
          }
        }
      } else {
        // Legacy behavior: apply across whole masked band
        applySpot(rs, re, (row) => (mask ? Math.floor(norm(mask.colStart) * srcLines[row].length) : 0), (row) => (mask ? Math.floor(norm(mask.colEnd) * srcLines[row].length) : srcLines[row].length - 1))
      }

      const next = outLines.map((arr) => arr.join('')).join('\n')
      setDisplay(next)
      rafRef.current = requestAnimationFrame(() => { setTimeout(() => tick(), stepMs) })
    }
    tick()
  }

  return (
    <pre className={className}>{display}</pre>
  )
}


