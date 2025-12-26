'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import ButtonBig from '@/components/ui/ButtonBig'
import { supabase, signInWithGoogle, signInWithDiscord, signUp, signIn, resetPasswordWithCooldown, getResetCooldownStatus, resendConfirmation } from '@/lib/auth'
import { trackSignupFromShared } from '@/lib/tracking'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { APP_URL } from '@/lib/config'

// Force rebuild: v2

interface AuthModalProps {
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  notice?: string
  inline?: boolean
  dismissible?: boolean
}

export function AuthModal({ onClose, initialMode = 'signin', notice, inline = false, dismissible = true }: AuthModalProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Check if component is mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Close on ESC key when dismissible
  useEffect(() => {
    if (!dismissible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    try { window.addEventListener('keydown', onKeyDown) } catch {}
    return () => { try { window.removeEventListener('keydown', onKeyDown) } catch {} }
  }, [dismissible, onClose])
  const getReturnTo = () => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const rt = sp.get('returnTo')
      if (rt && /^\//.test(rt)) return rt
    } catch {}
    return null
  }

  // Track signup source for analytics
  const trackSignupSource = () => {
    try {
      const returnTo = getReturnTo()
      if (!returnTo) return

      // Check if signup is from a shared comparison
      const comparisonMatch = returnTo.match(/\/r\/c\/([a-zA-Z0-9_-]+)/)
      if (comparisonMatch) {
        trackSignupFromShared('comparison', comparisonMatch[1], comparisonMatch[1])
        return
      }

      // Check if signup is from a shared single analysis
      const analysisMatch = returnTo.match(/\/r\/([a-zA-Z0-9_-]+)/)
      if (analysisMatch) {
        trackSignupFromShared('analysis', analysisMatch[1], analysisMatch[1])
        return
      }
    } catch (error) {
      console.debug('Tracking error:', error)
    }
  }
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
  const [emailInUseStep, setEmailInUseStep] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [marketingOptOut, setMarketingOptOut] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        console.log('🔍 [UI] Starting signup process...')
        // NEW: Get guest session ID from localStorage for migration
        const guestSessionId = localStorage.getItem('guest_session_id') || undefined
        const result = await signUp(email, password, fullName, marketingOptOut, guestSessionId)
        
        if (result.error) {
          console.log('🚨 [UI] Signup error:', result.error.message)
          // Check if it's an "email already exists" error
          if (result.error.message.toLowerCase().includes('already exists') ||
              result.error.message.toLowerCase().includes('already registered')) {
            setEmailInUseStep(true)
            setError(null)
          } else {
            setError(result.error.message)
          }
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
            // Track signup even if verification is pending
            trackSignupSource()
          } else {
            // Account created and verified immediately (rare - usually needs email verification)
            trackSignupSource()
            alert('✅ Account created successfully!')

            // Get session to transfer to app domain
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
              console.error('❌ [UI] Failed to get session after signup:', sessionError)
              setError('Signup succeeded but session retrieval failed')
              return
            }

            console.log('🔑 [UI] Got session after signup, transferring to app domain...')
            onClose()

            // Redirect to app's callback with session tokens for cross-domain transfer
            const rt = getReturnTo()
            const callbackUrl = `${APP_URL}/auth/callback?access_token=${session.access_token}&refresh_token=${session.refresh_token}`
            const finalUrl = rt && rt !== '/dashboard' ? `${callbackUrl}&returnTo=${encodeURIComponent(rt)}` : callbackUrl

            window.location.href = finalUrl
          }
        } else {
          console.log('⚠️ [UI] Unexpected signup result - likely needs verification')
          setVerificationStep(true)
          trackSignupSource()
        }
      } else {
        console.log('🔍 [UI] Starting signin process...')
        const result = await signIn(email, password)

        if (result.error) {
          console.log('🚨 [UI] Signin error:', result.error.message)
          setError(result.error.message)
        } else {
          console.log('✅ [UI] Signin successful, getting session for cross-domain transfer...')

          // Get session to transfer to app domain
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError || !session) {
            console.error('❌ [UI] Failed to get session:', sessionError)
            setError('Authentication succeeded but session retrieval failed')
            return
          }

          console.log('🔑 [UI] Got session, transferring to app domain...')
          onClose()

          // Redirect to app's callback with session tokens for cross-domain transfer
          const rt = getReturnTo()
          const callbackUrl = `${APP_URL}/auth/callback?access_token=${session.access_token}&refresh_token=${session.refresh_token}`
          const finalUrl = rt && rt !== '/dashboard' ? `${callbackUrl}&returnTo=${encodeURIComponent(rt)}` : callbackUrl

          window.location.href = finalUrl
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
        successDiv.className = 'text-green-600 text-sm font-heading bg-green-50 p-3 border-2 border-green-200 mb-4'
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
      // Track signup/signin from shared view if applicable
      if (isSignUp) trackSignupSource()
      
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
      // Track signup/signin from shared view if applicable
      if (isSignUp) trackSignupSource()
      
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

  // Email already in use step
  if (emailInUseStep) {
    const content = (
      <div className={inline ? 'min-h-[70vh] flex items-center justify-center' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'} onClick={dismissible ? onClose : undefined}>
        <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none w-[28rem] max-w-[28rem] mx-4 font-heading" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold">
              Email Already Registered
            </h2>
            {dismissible && (
              <button
                onClick={onClose}
                className="text-2xl hover:text-gray-600 font-heading leading-none"
              >
                ×
              </button>
            )}
          </div>

          <div className="verification-form text-center space-y-4">
            <div className="text-amber-700 text-sm font-heading bg-amber-50 p-4 border-2 border-amber-200">
              <div className="mb-2 font-bold">
                An account with this email already exists
              </div>
              <div className="font-bold">{email}</div>
            </div>

            <div className="text-sm text-gray-600 font-heading space-y-2">
              <p>Please sign in with your existing account, or use a different email address to create a new account.</p>
            </div>

            <div className="pt-4 space-y-3">
              <ButtonBig variant="black" fullWidth onClick={() => {
                setEmailInUseStep(false)
                setIsSignUp(false)
              }}>
                Sign In Instead
              </ButtonBig>

              <ButtonBig
                variant="ghost"
                fullWidth
                onClick={() => {
                  setEmailInUseStep(false)
                  setEmail('')
                }}
              >
                Try Different Email
              </ButtonBig>
            </div>
          </div>

          {/* reCAPTCHA Notice */}
          <div className="mt-6 text-center text-[10px] text-gray-500 leading-tight">
            This site is protected by reCAPTCHA and the Google{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#816928] hover:opacity-80 underline"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#816928] hover:opacity-80 underline"
            >
              Terms of Service
            </a>{' '}
            apply.
          </div>
        </div>
      </div>
    )

    if (inline) return content
    if (!mounted) return null
    return createPortal(content, document.body)
  }

  // 🔥 ENHANCED: Email Verification Step with resend functionality
  if (verificationStep) {
    const content = (
      <div className={inline ? 'min-h-[70vh] flex items-center justify-center' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'} onClick={dismissible ? onClose : undefined}>
        <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none w-[28rem] max-w-[28rem] mx-4 font-heading" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold">
              Check Your Email
            </h2>
            {dismissible && (
              <button
                onClick={onClose}
                className="text-2xl hover:text-gray-600 font-heading leading-none"
              >
                ×
              </button>
            )}
          </div>

          <div className="verification-form text-center space-y-4">
            <div className="text-green-600 text-sm font-heading bg-green-50 p-4 border-2 border-green-200">
              <div className="mb-2 font-bold flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Tick02Icon} size={20} />
                Account Created Successfully!
              </div>
              <div>We&apos;ve sent a verification email to:</div>
              <div className="font-bold">{email}</div>
            </div>
            
            <div className="text-sm text-gray-600 font-heading space-y-2">
              <p>Click the verification link in your email to activate your account.</p>
              <p><strong>Important:</strong> Check your spam folder if you don&apos;t see the email within a few minutes.</p>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-heading bg-red-50 p-3 border-2 border-red-200">
                {error}
              </div>
            )}

            <div className="pt-4 space-y-3">
              <ButtonBig variant="black" fullWidth onClick={() => {
                setVerificationStep(false)
                setIsSignUp(false)
              }}>
                Back to Login
              </ButtonBig>

              <ButtonBig 
                variant="ghost" 
                fullWidth 
                onClick={handleResendVerification}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend verification email'}
              </ButtonBig>
            </div>
          </div>

          {/* reCAPTCHA Notice */}
          <div className="mt-6 text-center text-[10px] text-gray-500 leading-tight">
            This site is protected by reCAPTCHA and the Google{' '}
            <a 
              href="https://policies.google.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#816928] hover:opacity-80 underline"
            >
              Privacy Policy
            </a>
            {' '}and{' '}
            <a 
              href="https://policies.google.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#816928] hover:opacity-80 underline"
            >
              Terms of Service
            </a>
            {' '}apply.
          </div>

          {/* Copyright and Links */}
          <div className="mt-3 text-center text-[10px] text-gray-500">
            © Zombify 2025 ·{' '}
            <a 
              href="/terms" 
              className="text-gray-600 hover:text-black underline"
            >
              Terms
            </a>
            {' '}·{' '}
            <a 
              href="/privacy" 
              className="text-gray-600 hover:text-black underline"
            >
              Privacy
            </a>
            {' '}·{' '}
            <a 
              href="/cookies" 
              className="text-gray-600 hover:text-black underline"
            >
              Cookies
            </a>
            {' '}·{' '}
            <a 
              href="/ai-disclaimer" 
              className="text-gray-600 hover:text-black underline"
            >
              AI Disclaimer
            </a>
          </div>
        </div>
      </div>
    )
    return inline || !mounted ? content : createPortal(content, document.body)
  }

  // Forgot Password View
  if (showForgotPassword) {
    const content = (
      <div className={inline ? 'min-h-[70vh] flex items-center justify-center' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'} onClick={dismissible ? onClose : undefined}>
        <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none w-[28rem] max-w-[28rem] mx-4 font-heading" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold">
              Reset Password
            </h2>
            {dismissible && (
              <button
                onClick={onClose}
                className="text-2xl hover:text-gray-600 font-heading leading-none"
              >
                ×
              </button>
            )}
          </div>

          {forgotPasswordSent ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-sm font-heading bg-green-50 p-4 border-2 border-green-200">
                ✅ Password reset email sent! Check your inbox and click the link to reset your password.
              </div>
              <button
                onClick={backToSignIn}
                className="text-sm text-gray-600 hover:text-black font-heading underline"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="text-sm text-gray-600 font-heading mb-4">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                  <br /><br />
                  <strong>Note:</strong> This only works for accounts created with email/password. If you signed up with Google or Discord, please use those buttons on the main login screen.
                </div>

                <div>
                  <label className="block text-sm font-heading mb-2 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full p-3 border-2 border-black bg-white font-heading focus:outline-none focus:border-gray-600"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {cooldownInfo?.onCooldown && (
                  <div className="text-yellow-600 text-sm font-heading bg-yellow-50 p-3 border-2 border-yellow-200">
                    <p className="font-medium">⏳ Reset Cooldown Active</p>
                    <p>{cooldownInfo.message}</p>
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm font-heading bg-red-50 p-3 border-2 border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cooldownInfo?.onCooldown}
                  className="w-full bg-black text-white font-heading px-6 py-3 border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'SENDING...' : cooldownInfo?.onCooldown ? 'RESET ON COOLDOWN' : 'SEND RESET EMAIL'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={backToSignIn}
                  className="text-sm text-gray-600 hover:text-black font-heading underline"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/* reCAPTCHA Notice */}
          <div className="mt-6 text-center text-[10px] text-gray-500 leading-tight">
            This site is protected by reCAPTCHA and the Google{' '}
            <a 
              href="https://policies.google.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#816928] hover:opacity-80 underline"
            >
              Privacy Policy
            </a>
            {' '}and{' '}
            <a 
              href="https://policies.google.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#816928] hover:opacity-80 underline"
            >
              Terms of Service
            </a>
            {' '}apply.
          </div>

          {/* Copyright and Links */}
          <div className="mt-3 text-center text-[10px] text-gray-500">
            © Zombify 2025 ·{' '}
            <a 
              href="/terms" 
              className="text-gray-600 hover:text-black underline"
            >
              Terms
            </a>
            {' '}·{' '}
            <a 
              href="/privacy" 
              className="text-gray-600 hover:text-black underline"
            >
              Privacy
            </a>
            {' '}·{' '}
            <a 
              href="/cookies" 
              className="text-gray-600 hover:text-black underline"
            >
              Cookies
            </a>
            {' '}·{' '}
            <a 
              href="/ai-disclaimer" 
              className="text-gray-600 hover:text-black underline"
            >
              AI Disclaimer
            </a>
          </div>
        </div>
      </div>
    )
    return inline || !mounted ? content : createPortal(content, document.body)
  }

  // Main Auth Modal
  const modalContent = (
      <div className={inline ? 'min-h-[70vh] flex items-center justify-center' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'} onClick={dismissible ? onClose : undefined}>
      <div className="bg-[#f5f1e6] border-2 border-black p-8 rounded-none w-[28rem] max-w-[28rem] mx-4 font-heading" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold">
            {isSignUp ? 'Create Account' : 'Login'}
          </h2>
          {dismissible && (
            <button
              onClick={onClose}
              className="text-2xl hover:text-gray-600 font-heading leading-none"
            >
              ×
            </button>
          )}
        </div>

        {notice && (
          <div className="text-sm text-gray-700 font-heading mb-4">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Social Sign In Buttons */}
          <div className="space-y-3">
            <ButtonBig
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="white"
              fullWidth
              weight="normal"
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
            >
              {loading ? 'Loading...' : `Continue with Google`}
            </ButtonBig>

            <ButtonBig
              type="button"
              onClick={handleDiscordSignIn}
              disabled={loading}
              variant="discord"
              fullWidth
              weight="normal"
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01-.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01-.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
              }
            >
              {loading ? 'Loading...' : `Continue with Discord`}
            </ButtonBig>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#f5f1e6] text-gray-500 font-heading">or</span>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-heading mb-2 font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border-2 border-black bg-white font-heading focus:outline-none focus:border-gray-600"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-heading mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white font-heading focus:outline-none focus:border-gray-600"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-heading mb-2 font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-12 border-2 border-black bg-white font-heading focus:outline-none focus:border-gray-600"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm font-heading bg-red-50 p-3 border-2 border-red-200">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="marketing-opt-out"
                checked={marketingOptOut}
                onChange={(e) => setMarketingOptOut(e.target.checked)}
                className="mt-1 w-4 h-4 border-2 border-black bg-white cursor-pointer"
              />
              <label htmlFor="marketing-opt-out" className="text-xs text-black/70 font-heading cursor-pointer">
                I prefer not to receive promotional emails, special offers, or product updates. (You'll still receive essential account-related communications.)
              </label>
            </div>
          )}

          <ButtonBig type="submit" disabled={loading} variant="black" fullWidth weight="normal">
            {loading ? 'Loading...' : (isSignUp ? 'Create account' : 'Login')}
          </ButtonBig>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            className="text-sm text-gray-600 hover:text-black font-heading underline"
          >
            {isSignUp 
              ? 'Already have an account? Login' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {/* Forgot Password Link - moved under switch, only on signin */}
        {!isSignUp && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true)
                if (email) setForgotPasswordEmail(email)
              }}
            className="text-sm text-gray-600 hover:text-black font-heading underline"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* reCAPTCHA Notice */}
        <div className="mt-6 text-center text-[10px] text-gray-500 leading-tight">
          This site is protected by reCAPTCHA and the Google{' '}
          <a 
            href="https://policies.google.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#816928] hover:opacity-80 underline"
          >
            Privacy Policy
          </a>
          {' '}and{' '}
          <a 
            href="https://policies.google.com/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#816928] hover:opacity-80 underline"
          >
            Terms of Service
          </a>
          {' '}apply.
        </div>

        {/* Copyright and Links */}
        <div className="mt-3 text-center text-[10px] text-gray-500">
          © Zombify 2025 ·{' '}
          <a 
            href="/terms" 
            className="text-gray-600 hover:text-black underline"
          >
            Terms
          </a>
          {' '}·{' '}
          <a 
            href="/privacy" 
            className="text-gray-600 hover:text-black underline"
          >
            Privacy
          </a>
          {' '}·{' '}
          <a 
            href="/cookies" 
            className="text-gray-600 hover:text-black underline"
          >
            Cookies
          </a>
          {' '}·{' '}
          <a 
            href="/ai-disclaimer" 
            className="text-gray-600 hover:text-black underline"
          >
            AI Disclaimer
          </a>
        </div>
      </div>
    </div>
  )
  
  return inline || !mounted ? modalContent : createPortal(modalContent, document.body)
}