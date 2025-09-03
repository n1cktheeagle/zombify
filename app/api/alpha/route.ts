import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

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
    const { email, consent, source } = await req.json().catch(() => ({}))

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    if (consent !== true) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 })
    }

    const ip = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || ''
    const client = getClient()

    // Soft rate limit: 5 per minute per IP
    const sinceIso = new Date(Date.now() - 60 * 1000).toISOString()
    const { count, error: countError } = await client
      .from('alpha_signups')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', sinceIso)

    if (countError) {
      console.error('Rate limit check failed:', countError)
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Too many signups from this IP. Please try again later.' }, { status: 429 })
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
      console.error('Insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to record signup' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Alpha signup error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


