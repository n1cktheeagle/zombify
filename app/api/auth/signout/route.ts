import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { LANDING_URL } from '@/lib/config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get('redirect') || LANDING_URL

  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  // Handle both relative and absolute URLs
  let redirectUrl: URL
  try {
    if (redirectTo.startsWith('http://') || redirectTo.startsWith('https://')) {
      redirectUrl = new URL(redirectTo)
    } else {
      redirectUrl = new URL(redirectTo, request.url)
    }
  } catch {
    redirectUrl = new URL(LANDING_URL)
  }

  const response = NextResponse.redirect(redirectUrl)

  // Create Supabase client to properly sign out (revokes tokens server-side)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )

  // Sign out via Supabase (revokes refresh token)
  await supabase.auth.signOut()

  // Also manually clear ALL Supabase cookies
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
  }

  return response
}
