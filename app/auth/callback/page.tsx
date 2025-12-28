'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/auth'
import { APP_URL, LANDING_URL } from '@/lib/config'

function CallbackHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Use sessionStorage to prevent double-processing (survives Strict Mode)
    const callbackKey = `_landing_callback_processed_${window.location.search.substring(0, 100)}`
    if (sessionStorage.getItem(callbackKey)) {
      console.log('🔄 LANDING CALLBACK: Already processed (sessionStorage), skipping...')
      // Check if we already have a session and redirect to app
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('✅ LANDING CALLBACK: Session exists, transferring to app...')
          const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`
          window.location.href = callbackUrl
        } else {
          // No session and already processed - clear the key and reload to retry
          console.log('⚠️ LANDING CALLBACK: No session but marked processed, clearing and retrying...')
          sessionStorage.removeItem(callbackKey)
          window.location.reload()
        }
      })
      return
    }
    sessionStorage.setItem(callbackKey, 'true')

    const handleCallback = async () => {
      console.log('🔗 LANDING CALLBACK: Processing auth callback...')

      // Parse hash fragment too (Supabase sometimes sends tokens in hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))

      const code = searchParams.get('code')
      const token_hash = searchParams.get('token_hash') || hashParams.get('token_hash')
      const type = searchParams.get('type') || hashParams.get('type')
      const error = searchParams.get('error') || hashParams.get('error')
      const error_description = searchParams.get('error_description') || hashParams.get('error_description')
      const returnTo = searchParams.get('returnTo')
      const verifyEmail = searchParams.get('verify_email')

      console.log('🔍 LANDING CALLBACK: Parameters:', {
        hasCode: !!code,
        hasTokenHash: !!token_hash,
        type,
        error,
        error_description,
        returnTo,
        verifyEmail
      })

      // Handle OAuth errors
      if (error) {
        console.error('❌ LANDING CALLBACK: Auth error:', error, error_description)
        window.location.href = `${LANDING_URL}/?error=auth_failed`
        return
      }

      // Handle email verification (token_hash flow)
      if (token_hash) {
        console.log('🔄 LANDING CALLBACK: Verifying email with token_hash...')

        try {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup'
          })

          if (verifyError) {
            console.error('❌ LANDING CALLBACK: Email verification error:', verifyError)

            // Check if already verified/logged in - use getSession() pattern
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (session && !sessionError) {
              console.log('✅ LANDING CALLBACK: Already have session, transferring to app...')
              // URL-encode tokens to prevent URL parsing issues
              const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&verified=true`
              window.location.href = callbackUrl
              return
            }

            window.location.href = `${LANDING_URL}/?error=verification_failed`
            return
          }

          if (data.session) {
            console.log('✅ LANDING CALLBACK: Email verified! Getting session from storage...')

            // Match the manual login pattern: get session from storage after verification
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
              console.error('❌ LANDING CALLBACK: Failed to get session from storage:', sessionError)
              window.location.href = `${LANDING_URL}/?error=verification_failed`
              return
            }

            console.log('✅ LANDING CALLBACK: Got session from storage, transferring to app...')
            // URL-encode tokens to prevent URL parsing issues
            const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&verified=true`
            window.location.href = callbackUrl
          } else {
            console.error('❌ LANDING CALLBACK: No session after verification')
            window.location.href = `${LANDING_URL}/?error=verification_failed`
          }

        } catch (err) {
          console.error('❌ LANDING CALLBACK: Verification exception:', err)
          window.location.href = `${LANDING_URL}/?error=verification_failed`
        }

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
              const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`
              const finalUrl = returnTo ? `${callbackUrl}&returnTo=${encodeURIComponent(returnTo)}` : callbackUrl
              window.location.href = finalUrl
              return
            }

            window.location.href = `${LANDING_URL}/?error=auth_failed`
            return
          }

          if (data.session) {
            console.log('✅ LANDING CALLBACK: OAuth successful! Transferring session to app...')

            // Transfer session tokens to app domain (URL-encoded)
            const session = data.session
            const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`
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
              const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`
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
