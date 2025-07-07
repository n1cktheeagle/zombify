'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle, signInWithDiscord } from '@/lib/auth'

interface EmailAuthFormProps {
  mode: 'signin' | 'signup'
  onClose: () => void
}

export default function EmailAuthForm({ mode, onClose }: EmailAuthFormProps) {
  const { signUp, signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'discord' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        console.log('🔍 Creating new account with email/password')
        const result = await signUp(email, password)
        
        if (result.error) {
          // Handle our specific error messages from secure signUp function
          if (result.error.message.includes('already exists using Google or Discord')) {
            setError('This email is already registered with Google or Discord. Please use those sign-in buttons above.')
          } else if (result.error.message.includes('already exists')) {
            setError('An account with this email already exists. Please sign in instead.')
          } else {
            setError(result.error.message)
          }
        } else {
          setMessage('✅ Account created! Check your email for the verification link.')
        }
      } else {
        const result = await signIn(email, password)
        
        if (result.error) {
          if (result.error.message.includes('Email not confirmed')) {
            setError('Please verify your email first. Check your inbox!')
          } else if (result.error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. If you signed up with Google or Discord, use those buttons below.')
          } else {
            setError('Sign in failed. Please check your credentials.')
          }
        } else {
          onClose()
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'discord') => {
    setOauthLoading(provider)
    setError('')
    
    try {
      const signInFunction = provider === 'google' ? signInWithGoogle : signInWithDiscord
      const { error } = await signInFunction()
      
      if (error) throw error
      
      // OAuth redirect will handle the rest
    } catch (err: any) {
      setError(`Failed to sign in with ${provider}: ${err.message}`)
      setOauthLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* OAuth Buttons First */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading || !!oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {oauthLoading === 'google' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Connecting with Google...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        
        <button
          onClick={() => handleOAuthSignIn('discord')}
          disabled={loading || !!oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#5865F2] text-white rounded-md hover:bg-[#4752C4] disabled:opacity-50 transition-colors"
        >
          {oauthLoading === 'discord' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Connecting with Discord...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
              </svg>
              Continue with Discord
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={8}
        />
        
        <button
          type="submit"
          disabled={loading || !!oauthLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
            </div>
          ) : (
            mode === 'signup' ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {message && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
          {message}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        {mode === 'signup' ? (
          <>
            By creating an account, you can use either OAuth or email/password to sign in.
            <br />
            Choose your preferred method above.
          </>
        ) : (
          <>
            Use the same method you used to create your account.
            <br />
            Email/password and OAuth accounts are separate.
          </>
        )}
      </div>
    </div>
  )
}