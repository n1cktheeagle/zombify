'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/auth'
import { APP_URL, LANDING_URL } from '@/lib/config'

type CallbackStatus = 'loading' | 'expired'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [errorInfo, setErrorInfo] = useState<{ code?: string; description?: string } | null>(null)

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

      // Handle OAuth errors - show expired UI
      if (error) {
        console.error('❌ LANDING CALLBACK: Auth error:', error, error_description)
        setErrorInfo({ code: error, description: error_description || undefined })
        setStatus('expired')
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

            // Show expired UI instead of redirecting
            setErrorInfo({ code: verifyError.code || 'otp_expired', description: verifyError.message })
            setStatus('expired')
            return
          }

          if (data.session) {
            console.log('✅ LANDING CALLBACK: Email verified! Getting session from storage...')

            // Match the manual login pattern: get session from storage after verification
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
              console.error('❌ LANDING CALLBACK: Failed to get session from storage:', sessionError)
              setErrorInfo({ code: 'session_error', description: 'Failed to establish session after verification' })
              setStatus('expired')
              return
            }

            console.log('✅ LANDING CALLBACK: Got session from storage, transferring to app...')
            // URL-encode tokens to prevent URL parsing issues
            const callbackUrl = `${APP_URL}/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&verified=true`
            window.location.href = callbackUrl
          } else {
            console.error('❌ LANDING CALLBACK: No session after verification')
            setErrorInfo({ code: 'no_session', description: 'No session received after verification' })
            setStatus('expired')
          }

        } catch (err: any) {
          console.error('❌ LANDING CALLBACK: Verification exception:', err)
          setErrorInfo({ code: 'verification_exception', description: err?.message || 'Verification failed' })
          setStatus('expired')
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

            setErrorInfo({ code: 'code_exchange_failed', description: exchangeError?.message || 'OAuth failed' })
            setStatus('expired')
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
            setErrorInfo({ code: 'no_session', description: 'No session after OAuth exchange' })
            setStatus('expired')
          }

        } catch (err: any) {
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

          setErrorInfo({ code: 'auth_exception', description: err?.message || 'Authentication failed' })
          setStatus('expired')
        }

      } else {
        console.log('❌ LANDING CALLBACK: No code parameter')
        window.location.href = LANDING_URL
      }
    }

    handleCallback()
  }, [searchParams])

  // Expired/Invalid Link UI
  if (status === 'expired') {
    // Determine message based on error code
    const isOtpExpired = errorInfo?.code === 'otp_expired' || errorInfo?.code === 'access_denied'
    const isFlowExpired = errorInfo?.code === 'flow_state_expired'

    const title = 'This link has expired'
    const description = isFlowExpired
      ? 'Your authentication session timed out. Please try signing in again.'
      : 'This verification link has expired or has already been used.'

    return (
      <div className="min-h-screen bg-[#f5f1e6] text-black flex items-center justify-center">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="mb-3 text-xl font-semibold font-heading">{title}</div>
          <div className="text-black/60 mb-6 text-sm font-heading leading-relaxed">
            {description}
            <br /><br />
            <strong>Opened on a different device?</strong>
            <br />
            Please open the link on the same device and browser where you signed up.
            <br /><br />
            If you already verified your email, try logging in below.
          </div>
          <div className="mt-6 flex flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/login`}
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-heading text-sm font-medium border-2 border-black hover:bg-black/90 transition-colors min-w-[140px]"
            >
              Go to Login
            </a>
            <a
              href={LANDING_URL}
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-black font-heading text-sm font-medium border-2 border-black hover:bg-black/5 transition-colors min-w-[140px]"
            >
              Back to Home
            </a>
          </div>
          {errorInfo?.code && (
            <div className="mt-8 text-xs text-black/40 font-mono">
              Error: {errorInfo.code}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state
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
