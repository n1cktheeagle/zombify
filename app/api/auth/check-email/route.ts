import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!

/**
 * Check if an email is already registered
 * Used during signup to prevent fake "verification sent" messages
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    // Check profiles table for existing email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[CHECK EMAIL] Error:', error)
      // Don't expose internal errors - just say email is available
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: !!profile })
  } catch (error) {
    console.error('[CHECK EMAIL] Unexpected error:', error)
    return NextResponse.json({ exists: false })
  }
}
