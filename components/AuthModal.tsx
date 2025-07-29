'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithGoogle, signInWithDiscord, signUp, signIn, resetPasswordWithCooldown, getResetCooldownStatus, resendConfirmation } from '@/lib/auth'

interface AuthModalProps {
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export function AuthModal({ onClose, initialMode = 'signin' }: AuthModalProps) {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [verificationStep, setVerificationStep] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        console.log('🔍 [UI] Starting signup process...')
        const result = await signUp(email, password, fullName)
        
        if (result.error) {
          console.log('🚨 [UI] Signup error:', result.error.message)
          setError(result.error.message)
        } else if (result.data?.user) {
          console.log('✅ [UI] Signup successful:', { 
            hasUser: !!result.data.user,
            emailConfirmed: !!result.data.user.email_confirmed_at,
            needsVerification: !result.data.user.email_confirmed_at
          })
          
          // Check if email verification is needed
          if (!result.data.user.email_confirmed_at) {
            setVerificationStep(true)
            setError(null)
          } else {
            // Account created and verified immediately
            alert('✅ Account created successfully!')
            onClose()
            router.push('/dashboard')
          }
        } else {
          console.log('⚠️ [UI] Unexpected signup result - likely needs verification')
          setVerificationStep(true)
        }
      } else {
        console.log('🔍 [UI] Starting signin process...')
        const result = await signIn(email, password)
        
        if (result.error) {
          console.log('🚨 [UI] Signin error:', result.error.message)
          setError(result.error.message)
        } else {
          console.log('✅ [UI] Signin successful')
          onClose()
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      console.error('❌ [UI] Auth error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cooldownStatus = getResetCooldownStatus(forgotPasswordEmail)
    if (!cooldownStatus.canReset) {
      setError(cooldownStatus.message!)
      setLoading(false)
      return
    }

    try {
      const result = await resetPasswordWithCooldown(forgotPasswordEmail, 'landing')
      
      if (result.success) {
        setForgotPasswordSent(true)
      } else if (result.onCooldown) {
        setError(result.error || 'Please wait before requesting another reset')
      } else if (result.isOAuth) {
        setError(result.error || 'This account uses Google or Discord sign-in')
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 [UI] Resending verification email...')
      const result = await resendConfirmation(email)
      
      if (result.error) {
        setError(result.error.message)
      } else {
        setError(null)
        // Show success message briefly
        const successDiv = document.createElement('div')
        successDiv.className = 'text-green-600 text-sm font-mono bg-green-50 p-3 border-2 border-green-200 mb-4'
        successDiv.textContent = '✅ Verification email sent! Check your inbox.'
        
        const form = document.querySelector('.verification-form')
        if (form) {
          form.insertBefore(successDiv, form.firstChild)
          setTimeout(() => successDiv.remove(), 3000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // Redirect will happen automatically
    } catch (err: any) {
      setError(`Google sign-in failed: ${err.message}`)
      setLoading(false)
    }
  }

  const handleDiscordSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithDiscord()
      if (error) throw error
      // Redirect will happen automatically
    } catch (err: any) {
      setError(`Discord sign-in failed: ${err.message}`)
      setLoading(false)
    }
  }

  // Reset all states when switching modes
  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setShowForgotPassword(false)
    setForgotPasswordSent(false)
    setVerificationStep(false)
  }

  // 🔥 FIXED: Properly functional back to login button
  const backToSignIn = () => {
    setShowForgotPassword(false)
    setForgotPasswordSent(false)
    setVerificationStep(false)
    setError(null)
    setForgotPasswordEmail('')
    setIsSignUp(false) // Ensure we're in sign-in mode
  }

  const getCooldownInfo = () => {
    if (!forgotPasswordEmail) return null
    
    const cooldownStatus = getResetCooldownStatus(forgotPasswordEmail)
    if (!cooldownStatus.canReset) {
      return {
        onCooldown: true,
        message: cooldownStatus.message
      }
    }
    
    return { onCooldown: false }
  }

  const cooldownInfo = getCooldownInfo()

  // 🔥 ENHANCED: Email Verification Step with resend functionality
  if (verificationStep) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none max-w-md w-full mx-4 font-mono">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-mono font-bold">
              Check Your Email
            </h2>
            <button
              onClick={onClose}
              className="text-2xl hover:text-gray-600 font-mono leading-none"
            >
              ×
            </button>
          </div>

          <div className="verification-form text-center space-y-4">
            <div className="text-green-600 text-sm font-mono bg-green-50 p-4 border-2 border-green-200">
              <div className="mb-2">✅ Account Created Successfully!</div>
              <div>We&apos;ve sent a verification email to:</div>
              <div className="font-bold">{email}</div>
            </div>
            
            <div className="text-sm text-gray-600 font-mono space-y-2">
              <p>Click the verification link in your email to activate your account.</p>
              <p><strong>Important:</strong> Check your spam folder if you don&apos;t see the email within a few minutes.</p>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-mono bg-red-50 p-3 border-2 border-red-200">
                {error}
              </div>
            )}

            <div className="pt-4 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-blue-600 text-white font-mono px-6 py-3 border-2 border-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'SENDING...' : 'RESEND VERIFICATION EMAIL'}
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-black text-white font-mono px-6 py-3 border-2 border-black hover:bg-gray-800 transition-colors"
              >
                GOT IT
              </button>
              
              <button
                onClick={backToSignIn}
                className="text-sm text-gray-600 hover:text-black font-mono underline"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none max-w-md w-full mx-4 font-mono">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-mono font-bold">
              Reset Password
            </h2>
            <button
              onClick={onClose}
              className="text-2xl hover:text-gray-600 font-mono leading-none"
            >
              ×
            </button>
          </div>

          {forgotPasswordSent ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-sm font-mono bg-green-50 p-4 border-2 border-green-200">
                ✅ Password reset email sent! Check your inbox and click the link to reset your password.
              </div>
              <button
                onClick={backToSignIn}
                className="text-sm text-gray-600 hover:text-black font-mono underline"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="text-sm text-gray-600 font-mono mb-4">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                  <br /><br />
                  <strong>Note:</strong> This only works for accounts created with email/password. If you signed up with Google or Discord, please use those buttons on the main login screen.
                </div>

                <div>
                  <label className="block text-sm font-mono mb-2 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full p-3 border-2 border-black bg-white font-mono focus:outline-none focus:border-gray-600"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {cooldownInfo?.onCooldown && (
                  <div className="text-yellow-600 text-sm font-mono bg-yellow-50 p-3 border-2 border-yellow-200">
                    <p className="font-medium">⏳ Reset Cooldown Active</p>
                    <p>{cooldownInfo.message}</p>
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm font-mono bg-red-50 p-3 border-2 border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cooldownInfo?.onCooldown}
                  className="w-full bg-black text-white font-mono px-6 py-3 border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'SENDING...' : cooldownInfo?.onCooldown ? 'RESET ON COOLDOWN' : 'SEND RESET EMAIL'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={backToSignIn}
                  className="text-sm text-gray-600 hover:text-black font-mono underline"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Main Auth Modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none max-w-md w-full mx-4 font-mono">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-mono font-bold">
            {isSignUp ? 'Create Account' : 'Login'}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:text-gray-600 font-mono leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Social Sign In Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-black font-mono px-6 py-3 border-2 border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Loading...' : `Continue with Google`}
            </button>

            <button
              type="button"
              onClick={handleDiscordSignIn}
              disabled={loading}
              className="w-full bg-[#5865F2] text-white font-mono px-6 py-3 border-2 border-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
              </svg>
              {loading ? 'Loading...' : `Continue with Discord`}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#f5f1e6] text-gray-500 font-mono">or</span>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-mono mb-2 font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border-2 border-black bg-white font-mono focus:outline-none focus:border-gray-600"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-mono mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white font-mono focus:outline-none focus:border-gray-600"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-2 font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white font-mono focus:outline-none focus:border-gray-600"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          {/* Forgot Password Link - Only show on signin */}
          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  if (email) setForgotPasswordEmail(email)
                }}
                className="text-sm text-gray-600 hover:text-black font-mono underline"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm font-mono bg-red-50 p-3 border-2 border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-mono px-6 py-3 border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : (isSignUp ? 'CREATE ACCOUNT' : 'LOGIN')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            className="text-sm text-gray-600 hover:text-black font-mono underline"
          >
            {isSignUp 
              ? 'Already have an account? Login' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="text-xs text-gray-500 font-mono space-y-1">
            <div>FREE: 3 feedback reports/month</div>
            <div>PRO: Unlimited reports + advanced features</div>
          </div>
        </div>
      </div>
    </div>
  )
}