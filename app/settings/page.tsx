'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase, getUserProviders, isOAuthUser, resetPasswordWithCooldown, getResetCooldownStatus } from '@/lib/auth'
import { MainHeader } from '@/components/MainHeader'
import DebugAuth from '@/components/DebugAuth'

export default function AccountSettings() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  const [providers, setProviders] = useState<string[]>([])
  const [isOAuth, setIsOAuth] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (user) {
      loadAccountInfo()
    }
  }, [user, loading])

  useEffect(() => {
    // Check for password reset success parameter
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('password_reset') === 'success') {
      setResetSuccess(true)
      setTimeout(() => setResetSuccess(false), 5000)
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const loadAccountInfo = async () => {
    try {
      const userProviders = await getUserProviders()
      const oauthUser = await isOAuthUser()
      
      setProviders(userProviders)
      setIsOAuth(oauthUser)
      
      console.log('🔍 Account info loaded:', { userProviders, oauthUser })
    } catch (error) {
      console.error('Error loading account info:', error)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    
    // Check cooldown before attempting reset
    const cooldownStatus = getResetCooldownStatus(user.email)
    if (!cooldownStatus.canReset) {
      setResetError(cooldownStatus.message!)
      return
    }
    
    setResetLoading(true)
    setResetError('')
    setResetMessage('')
    
    try {
      const result = await resetPasswordWithCooldown(user.email, 'settings')
      
      if (result.success) {
        setResetMessage('✅ Password reset email sent! Check your inbox and click the link to reset your password.')
      } else if (result.onCooldown) {
        setResetError(result.error || 'Please wait before requesting another reset')
      } else if (result.isOAuth) {
        setResetError(result.error || 'This account uses OAuth sign-in')
      } else {
        setResetError(result.error || 'Failed to send reset email')
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email')
    } finally {
      setResetLoading(false)
    }
  }

  // Get cooldown info for UI display
  const getCooldownInfo = () => {
    if (!user?.email) return null
    
    const cooldownStatus = getResetCooldownStatus(user.email)
    if (!cooldownStatus.canReset) {
      return {
        onCooldown: true,
        message: cooldownStatus.message
      }
    }
    
    return { onCooldown: false }
  }

  const cooldownInfo = getCooldownInfo()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center">
        <div className="text-black font-mono">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-black font-mono">
      <MainHeader variant="app" />
      
      <div className="pt-20 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">ACCOUNT SETTINGS</h1>
            <p className="text-lg opacity-70">Manage your account and preferences</p>
          </div>

          {/* Temporary Debug Component */}
<DebugAuth />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Account Info */}
            <div className="bg-white border border-black/20 rounded p-6">
              <h2 className="text-2xl font-bold mb-6">ACCOUNT INFO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold opacity-70 uppercase">Email</label>
                  <div className="text-lg">{user.email}</div>
                </div>
                
                <div>
                  <label className="text-sm font-bold opacity-70 uppercase">Plan</label>
                  <div className="text-lg capitalize">
                    {profile?.plan_type || 'Free'}
                    {profile?.plan_type === 'pro' && <span className="text-purple-600 ml-2">⭐</span>}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-bold opacity-70 uppercase">Monthly Usage</label>
                  <div className="text-lg">
                    {profile?.feedback_count || 0} / {profile?.monthly_limit || 3} uploads
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication Methods */}
            <div className="bg-white border border-black/20 rounded p-6">
              <h2 className="text-2xl font-bold mb-6">AUTHENTICATION</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold opacity-70 uppercase mb-2 block">
                    Sign-in Methods
                  </label>
                  <div className="space-y-2">
                    {providers.map(provider => (
                      <div key={provider} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {provider === 'google' && '🔵'}
                          {provider === 'discord' && '🟣'}
                          {provider === 'email' && '📧'}
                        </div>
                        <span className="capitalize font-medium">{provider}</span>
                        <span className="ml-auto text-green-600 text-sm">✓ Active</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Different UI based on account type */}
                {isOAuth ? (
                  // OAuth Account - No password management
                  <div className="border border-blue-200 bg-blue-50 rounded p-4">
                    <h3 className="font-bold mb-2 text-blue-800">Social Sign-in Account</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Your account uses {providers.filter(p => p !== 'email').join(' and ')} for authentication. 
                      No password is needed - just click the social sign-in buttons to log in.
                    </p>
                    <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded border">
                      <strong>Note:</strong> Password reset is not available for social accounts. 
                      If you're having trouble logging in, try clearing your browser cache or use a different browser.
                    </div>
                  </div>
                ) : (
                  // Email/Password Account - Password management available
                  <div className="border border-green-200 bg-green-50 rounded p-4">
                    <h3 className="font-bold mb-2 text-green-800">Email/Password Account</h3>
                    <p className="text-sm text-green-700 mb-4">
                      Your account uses email and password authentication. You can reset your password if needed.
                    </p>

                    {resetSuccess && (
                      <div className="mb-4 p-3 border border-green-400 bg-green-100 text-green-800 rounded text-sm">
                        ✅ Password reset successful! Your password has been updated.
                      </div>
                    )}

                    {/* Cooldown warning */}
                    {cooldownInfo?.onCooldown && (
                      <div className="mb-4 text-yellow-600 text-sm bg-yellow-50 p-3 border border-yellow-200 rounded">
                        <p className="font-medium">⏳ Reset Cooldown Active</p>
                        <p>{cooldownInfo.message}</p>
                      </div>
                    )}

                    {resetMessage && (
                      <div className="mb-4 p-3 border border-green-400 bg-green-100 text-green-800 rounded text-sm">
                        {resetMessage}
                      </div>
                    )}

                    {resetError && (
                      <div className="mb-4 p-3 border border-red-400 bg-red-100 text-red-800 rounded text-sm">
                        {resetError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        To change your password, we'll send a secure reset link to your email address.
                      </p>
                      
                      <button
                        onClick={handlePasswordReset}
                        disabled={resetLoading || cooldownInfo?.onCooldown}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
                      >
                        {resetLoading ? 'Sending Reset Email...' : cooldownInfo?.onCooldown ? 'Reset On Cooldown' : 'Send Password Reset Email'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="mt-8 bg-white border border-black/20 rounded p-6">
            <h2 className="text-2xl font-bold mb-6">ACCOUNT ACTIONS</h2>
            
            <div className="space-y-4">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}