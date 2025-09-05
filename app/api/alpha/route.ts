import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY

const isDev = process.env.NODE_ENV !== 'production'
let __alpha_get_cache: { ts: number; body: { count: number } } | null = null
const devLog = (...args: any[]) => {
  if (isDev && process.env.LOG_ALPHA === '1') {
    console.debug('[alpha]', ...args)
  }
}

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    throw new Error('Supabase server credentials are not configured')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  if (xff) return xff.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

function isValidEmail(email: string): boolean {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const email: string = (body?.email || '').trim().toLowerCase()
    const consent = body?.consent
    const source = body?.source
    const turnstileToken = body?.turnstileToken
    const website = body?.website

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    if (consent !== true) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 })
    }

    // Honeypot FIRST
    if (website && String(website).trim().length > 0) {
      // honeypot tripped – treat as error
      console.error('alpha signup:', { stage: 'honeypot' })
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const ip = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || ''
    const client = getClient()

    // Idempotent: short-circuit if this email already exists
    try {
      const { data: existing, error: existErr } = await client
        .from('alpha_signups')
        .select('id, created_at')
        .eq('email', email)
        .limit(1)
        .maybeSingle()
      if (existErr) devLog('exist-check error', existErr)
      if (existing) {
        return NextResponse.json({ ok: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } })
      }
    } catch (err) {
      devLog('exist-check thrown', err)
    }

    // Per-IP limits first (10 in 10 minutes) and soft 5/minute
    const sinceIso = new Date(Date.now() - 60 * 1000).toISOString()
    const { count, error: countError } = await client
      .from('alpha_signups')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', sinceIso)

    if (countError) {
      console.error('alpha signup:', { stage: 'rate-limit-initial', error: countError })
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Too many signups from this IP. Please try again later.' }, { status: 429 })
    }

    // Stricter per-IP window (10 minutes, max 10)
    const tenMinIso = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count: ipWindowCount, error: ipWindowErr } = await client
      .from('alpha_signups')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', tenMinIso)
    if (ipWindowErr) {
      console.error('alpha signup:', { stage: 'rate-limit-ip-10m', error: ipWindowErr })
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    if ((ipWindowCount || 0) >= 10) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
    }

    // Per-email cooldown (1 hour)
    const oneHourIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: emailRecentCount, error: emailRecentErr } = await client
      .from('alpha_signups')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', oneHourIso)
    if (emailRecentErr) {
      console.error('alpha signup:', { stage: 'rate-limit-email', error: emailRecentErr })
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    if ((emailRecentCount || 0) > 0) {
      // Idempotent-friendly success
      return NextResponse.json({ ok: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } })
    }

    // Verify Turnstile after cheap checks and rate limiting
    try {
      if (!TURNSTILE_SECRET_KEY) throw new Error('Missing TURNSTILE_SECRET_KEY')
      const params = new URLSearchParams()
      params.append('secret', TURNSTILE_SECRET_KEY)
      params.append('response', String(turnstileToken || ''))
      if (ip && ip !== 'unknown') params.append('remoteip', ip)

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      const verifyData: any = await verifyRes.json().catch(() => ({}))
      if (!verifyRes.ok || !verifyData?.success) {
        console.error('alpha signup:', { stage: 'turnstile', error: verifyData })
        return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 })
      }
    } catch (err) {
      console.error('alpha signup:', { stage: 'turnstile', error: err })
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 })
    }

    const insertPayload = {
      email,
      consent: true,
      source: typeof source === 'string' && source ? source : 'zombify-landing',
      ip,
      user_agent: userAgent,
    }

    const { error: insertError } = await client
      .from('alpha_signups')
      .insert(insertPayload)

    if (insertError) {
      // If unique violation, treat as idempotent success
      const code = (insertError as any)?.code || (insertError as any)?.details || ''
      if (String(code).includes('23505')) {
        return NextResponse.json({ ok: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } })
      }
      console.error('alpha signup:', { stage: 'insert', error: insertError })
      return NextResponse.json({ error: 'Failed to record signup' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    console.error('alpha signup:', { stage: 'unexpected', error: err })
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (isDev && __alpha_get_cache && Date.now() - __alpha_get_cache.ts < 5000) {
      return NextResponse.json(__alpha_get_cache.body, { headers: { 'Cache-Control': 'no-store' } })
    }

    const client = getClient()
    const { count, error } = await client
      .from('alpha_signups')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('alpha GET count failed:', error)
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const body = { count: count || 0 }
    if (isDev) __alpha_get_cache = { ts: Date.now(), body }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    console.error('alpha GET unexpected:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


