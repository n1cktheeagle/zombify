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
      
      const code = searchParams.get('code')
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      
      console.log('📝 SIMPLE CALLBACK: Parameters:', { code: !!code, token_hash: !!token_hash, type })

      if (code) {
        console.log('🔄 SIMPLE CALLBACK: Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('❌ SIMPLE CALLBACK: Auth error:', error)
          router.push('/?error=auth_failed')
          return
        }

        console.log('✅ SIMPLE CALLBACK: OAuth successful!', data.user?.email)
        
        // 🚨 CRITICAL: OAuth Security Check for account conflicts
        if (data.user?.email) {
          console.log('🔍 SIMPLE CALLBACK: Running OAuth security check...')
          
          // Check if this email already has an email/password account
          const { data: { user } } = await supabase.auth.getUser()
          const providers = user?.identities?.map(identity => identity.provider) || []
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
        }
        
        router.push('/dashboard?oauth=true')
        
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
        <p className="text-lg mb-2">SIMPLE CALLBACK: Processing authentication...</p>
        <p className="text-sm opacity-60">Testing callback functionality...</p>
        
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