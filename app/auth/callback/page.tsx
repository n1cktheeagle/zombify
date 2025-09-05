export const dynamic = "force-dynamic"
export const revalidate = 0

if (process.env.NEXT_PUBLIC_LAUNCH_MODE === "landing-only") {
  export default function Placeholder() { return null }
}

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/auth'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let processed = false

    const handleCallback = async () => {
      if (processed) {
        console.log('🔄 SIMPLE CALLBACK: Already processed, skipping...')
        return
      }
      processed = true

      console.log('🔗 SIMPLE CALLBACK: Auth callback triggered!')
      
      // Get all possible callback parameters
      const code = searchParams.get('code')
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const error = searchParams.get('error')
      const error_description = searchParams.get('error_description')
      
      console.log('📝 SIMPLE CALLBACK: Parameters:', { 
        code: !!code, 
        token_hash: !!token_hash, 
        type, 
        error,
        error_description 
      })

      // Handle OAuth errors first
      if (error) {
        console.error('❌ SIMPLE CALLBACK: OAuth error:', error, error_description)
        router.push('/?error=oauth_failed')
        return
      }

      // Handle OAuth code exchange
      if (code) {
        console.log('🔄 SIMPLE CALLBACK: Exchanging code for session...')
        
        try {
          // 🔥 ENHANCED: PKCE-enabled code exchange with multiple fallbacks
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('❌ SIMPLE CALLBACK: Session exchange error:', exchangeError)
            
            // 🔥 FALLBACK 1: Check current session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            if (sessionData.session?.user && !sessionError) {
              console.log('✅ SIMPLE CALLBACK: User signed in via session, proceeding...')
              router.push('/dashboard?oauth=true')
              return
            }
            
            // 🔥 FALLBACK 2: Direct user check
            const { data: userData, error: userError } = await supabase.auth.getUser()
            if (userData.user && !userError) {
              console.log('✅ SIMPLE CALLBACK: User signed in despite error, proceeding...')
              router.push('/dashboard?oauth=true')
              return
            }
            
            // 🔥 FALLBACK 3: Check if user already authenticated (from cache/localStorage)
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              if (refreshData.session?.user && !refreshError) {
                console.log('✅ SIMPLE CALLBACK: User authenticated via refresh, proceeding...')
                router.push('/dashboard?oauth=true')
                return
              }
            } catch (refreshErr) {
              console.log('🔄 SIMPLE CALLBACK: Refresh check failed, that\'s okay')
            }
            
            router.push('/?error=auth_failed')
            return
          }

          if (data.user) {
            console.log('✅ SIMPLE CALLBACK: OAuth successful!', data.user.email)
            
            // 🚨 CRITICAL: OAuth Security Check for account conflicts
            const providers = data.user.identities?.map((identity: any) => identity.provider) || []
            const hasEmailAuth = providers.includes('email')
            const hasOAuth = providers.includes('google') || providers.includes('discord')
            
            console.log('🔍 SIMPLE CALLBACK: Auth providers:', { providers, hasEmailAuth, hasOAuth })
            
            if (hasEmailAuth && hasOAuth) {
              console.log('🚨 SIMPLE CALLBACK: BLOCKING - Account has both email and OAuth!')
              
              // Sign out the mixed account immediately
              await supabase.auth.signOut()
              localStorage.removeItem('zombify_user_cache')
              
              router.push('/?auth_error=account_conflict&message=This email already has a password account. Please sign in with email/password instead.')
              return
            }
            
            router.push('/dashboard?oauth=true')
          } else {
            console.log('❌ SIMPLE CALLBACK: No user data after exchange')
            router.push('/?error=auth_failed')
          }
          
        } catch (err) {
          console.error('❌ SIMPLE CALLBACK: Exception during OAuth processing:', err)
          
          // 🔥 FINAL FALLBACK: Enhanced user existence check
          try {
            // Try session first
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData.session?.user) {
              console.log('✅ SIMPLE CALLBACK: User exists in session despite exception')
              router.push('/dashboard?oauth=true')
              return
            }
            
            // Try direct user check
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
              console.log('✅ SIMPLE CALLBACK: User exists despite exception')
              router.push('/dashboard?oauth=true')
              return
            }
            
            // Try refresh as last resort
            const { data: refreshData } = await supabase.auth.refreshSession()
            if (refreshData.session?.user) {
              console.log('✅ SIMPLE CALLBACK: User authenticated via final refresh')
              router.push('/dashboard?oauth=true')
              return
            }
          } catch (e) {
            console.error('Failed all user status checks:', e)
          }
          
          router.push('/?error=auth_failed')
        }
        
      } else if (token_hash) {
        console.log('🔄 SIMPLE CALLBACK: Processing token hash...')
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'signup'
        })
        
        if (error) {
          console.error('❌ SIMPLE CALLBACK: Token verification error:', error)
          // Check if user is already signed in despite the error
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            console.log('✅ SIMPLE CALLBACK: User already authenticated, proceeding...')
            router.push('/dashboard?verified=true')
            return
          }
          router.push('/?error=verification_failed')
          return
        }

        console.log('✅ SIMPLE CALLBACK: Email verification successful!', data.user?.email)
        router.push('/dashboard?verified=true')
        
      } else {
        console.log('❌ SIMPLE CALLBACK: No code or token found')
        
        // 🔥 NEW: Check if user is already authenticated despite missing parameters
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            console.log('✅ SIMPLE CALLBACK: User already authenticated, redirecting...')
            router.push('/dashboard')
            return
          }
        } catch (e) {
          console.log('🔄 SIMPLE CALLBACK: User check failed')
        }
        
        router.push('/')
      }
    }

    const timer = setTimeout(handleCallback, 100)
    return () => clearTimeout(timer)
  }, [searchParams, router])

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
          <p className="text-lg mb-2">Loading callback...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}