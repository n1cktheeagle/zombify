// lib/utm.ts
const KEYS = ["source", "medium", "campaign", "content", "term", "referrer"] as const
type Key = typeof KEYS[number]
export type Attribution = Partial<Record<Key, string>>

const LS_KEY = "zombify:attr"
const LS_TS = "zombify:attr:ts"
const TTL_MS = 90 * 24 * 60 * 60 * 1000

function q(k: string) {
  return new URLSearchParams(window.location.search).get(k) || undefined
}

export function captureAttrFromPage() {
  if (typeof window === "undefined") return

  const incoming: Attribution = {
    source: q("utm_source") || q("source"),
    medium: q("utm_medium") || q("medium"),
    campaign: q("utm_campaign") || q("campaign"),
    content: q("utm_content") || q("content"),
    term: q("utm_term") || q("term"),
    referrer: q("referrer") || q("ref") || (document.referrer || undefined),
  }

  Object.keys(incoming).forEach(k => {
    const v = (incoming as any)[k]
    if (!v || !String(v).trim()) delete (incoming as any)[k]
  })

  if (Object.keys(incoming).length === 0) return

  const existing = getAttr()
  const merged: Attribution = { ...existing, ...incoming }
  localStorage.setItem(LS_KEY, JSON.stringify(merged))
  localStorage.setItem(LS_TS, String(Date.now()))
}

export function getAttr(): Attribution {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const ts = Number(localStorage.getItem(LS_TS) || "0")
    if (Number.isFinite(ts) && Date.now() - ts > TTL_MS) {
      localStorage.removeItem(LS_KEY)
      localStorage.removeItem(LS_TS)
      return {}
    }
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function getAttrForInsert(): {
  source: string | null
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  referrer: string | null
} {
  const a = getAttr()
  return {
    source: a.source ?? null,
    medium: a.medium ?? null,
    campaign: a.campaign ?? null,
    content: a.content ?? null,
    term: a.term ?? null,
    referrer: a.referrer ?? null,
  }
}


