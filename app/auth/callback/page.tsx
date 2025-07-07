'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, checkEmailAuthType } from '@/lib/auth'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) {
      console.log('⚠️ Callback already processed, skipping')
      return
    }

    const handleCallback = async () => {
      try {
        hasProcessed.current = true
        console.log('🔗 Auth callback triggered!')
        
        const code = searchParams.get('code')
        const type = searchParams.get('type')
        const oauthProvider = searchParams.get('oauth_provider')
        
        console.log('📝 Code present:', !!code)
        console.log('📝 Auth type:', type)
        console.log('📝 OAuth provider:', oauthProvider)

        if (code) {
          console.log('🔄 Exchanging code for session...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ Auth error:', error)
            window.location.href = `/?error=auth_failed&details=${encodeURIComponent(error.message || 'Unknown error')}`
            return
          }

          console.log('✅ Auth successful!', data.user?.email)
          
          // NEW: OAuth Security Check for account conflicts
          if (oauthProvider && data.user?.email) {
            console.log('🔍 Running OAuth security check...')
            
            try {
              const authType = await checkEmailAuthType(data.user.email)
              console.log('🔍 Existing auth type for', data.user.email, ':', authType)
              
              if (authType === 'email') {
                console.log('🚨 BLOCKING: Email/password account exists for this email')
                
                // Sign out the OAuth session immediately
                await supabase.auth.signOut()
                
                // Clear any cached data
                localStorage.removeItem('zombify_user_cache')
                
                // Redirect with error
                window.location.href = `/?auth_error=email_conflict&provider=${oauthProvider}`
                return
              }
              
              console.log('✅ OAuth security check passed')
            } catch (securityError) {
              console.error('❌ OAuth security check failed:', securityError)
              // If security check fails, err on the side of caution
              await supabase.auth.signOut()
              localStorage.removeItem('zombify_user_cache')
              window.location.href = `/?auth_error=security_check_failed&provider=${oauthProvider}`
              return
            }
          }
          
          // Cache user data
          localStorage.setItem('zombify_user_cache', JSON.stringify({
            user: data.user,
            timestamp: Date.now()
          }))
          
          if (type === 'email') {
            console.log('📧 Email verification successful')
            window.location.href = '/?verified=true'
          } else {
            console.log('🔄 OAuth successful, redirecting to dashboard')
            window.location.href = '/dashboard'
          }
          
        } else {
          console.log('❌ No code found, redirecting home')
          window.location.href = '/'
        }
      } catch (error) {
        console.error('❌ Callback error:', error)
        window.location.href = `/?error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
      }
    }

    const timer = setTimeout(handleCallback, 100)
    
    const emergencyTimer = setTimeout(() => {
      console.log('🚨 Emergency redirect triggered')
      window.location.href = '/'
    }, 5000) // Increased timeout for security checks
    
    return () => {
      clearTimeout(timer)
      clearTimeout(emergencyTimer)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
      <div className="font-mono text-gray-600 text-center">
        <div className="text-2xl mb-4">🔐</div>
        <p className="text-lg mb-2">Processing authentication...</p>
        <p className="text-sm opacity-60">Completing sign-in flow and running security checks...</p>
        
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