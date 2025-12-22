'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/auth'
import { APP_URL, LANDING_URL } from '@/lib/config'

function CallbackHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    let processed = false

    const handleCallback = async () => {
      if (processed) return
      processed = true

      console.log('🔗 LANDING CALLBACK: Processing OAuth callback...')

      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const error_description = searchParams.get('error_description')
      const returnTo = searchParams.get('returnTo')

      console.log('🔍 LANDING CALLBACK: Parameters:', {
        hasCode: !!code,
        error,
        error_description,
        returnTo
      })

      // Handle OAuth errors
      if (error) {
        console.error('❌ LANDING CALLBACK: OAuth error:', error, error_description)
        window.location.href = `${LANDING_URL}/?error=oauth_failed`
        return
      }

      // Handle OAuth code exchange
      if (code) {
        console.log('🔄 LANDING CALLBACK: Exchanging code for session...')

        try {
          // Exchange code for session ON LANDING DOMAIN (where PKCE verifier exists)
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('❌ LANDING CALLBACK: Code exchange error:', exchangeError)

            // Try to get existing session as fallback
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData.session) {
              console.log('✅ LANDING CALLBACK: Found existing session, transferring...')
              const session = sessionData.session
              const callbackUrl = `${APP_URL}/auth/callback?access_token=${session.access_token}&refresh_token=${session.refresh_token}`
              const finalUrl = returnTo ? `${callbackUrl}&returnTo=${encodeURIComponent(returnTo)}` : callbackUrl
              window.location.href = finalUrl
              return
            }

            window.location.href = `${LANDING_URL}/?error=auth_failed`
            return
          }

          if (data.session) {
            console.log('✅ LANDING CALLBACK: OAuth successful! Transferring session to app...')

            // Transfer session tokens to app domain
            const session = data.session
            const callbackUrl = `${APP_URL}/auth/callback?access_token=${session.access_token}&refresh_token=${session.refresh_token}`
            const finalUrl = returnTo ? `${callbackUrl}&returnTo=${encodeURIComponent(returnTo)}` : callbackUrl

            console.log('🚀 LANDING CALLBACK: Redirecting to app with tokens...')
            window.location.href = finalUrl
          } else {
            console.error('❌ LANDING CALLBACK: No session after exchange')
            window.location.href = `${LANDING_URL}/?error=auth_failed`
          }

        } catch (err) {
          console.error('❌ LANDING CALLBACK: Exception:', err)

          // Final fallback - check for existing session
          try {
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData.session) {
              console.log('✅ LANDING CALLBACK: Found session in fallback, transferring...')
              const session = sessionData.session
              const callbackUrl = `${APP_URL}/auth/callback?access_token=${session.access_token}&refresh_token=${session.refresh_token}`
              const finalUrl = returnTo ? `${callbackUrl}&returnTo=${encodeURIComponent(returnTo)}` : callbackUrl
              window.location.href = finalUrl
              return
            }
          } catch {}

          window.location.href = `${LANDING_URL}/?error=auth_failed`
        }

      } else {
        console.log('❌ LANDING CALLBACK: No code parameter')
        window.location.href = LANDING_URL
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
      <div className="font-mono text-gray-600 text-center">
        <div className="text-2xl mb-4">🔐</div>
        <p className="text-lg mb-2">Processing authentication...</p>
        <p className="text-sm opacity-60">Please wait while we sign you in...</p>

        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="font-mono text-gray-600 text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p className="text-lg mb-2">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
