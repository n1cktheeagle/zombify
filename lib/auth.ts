import { getSupabaseClient } from './supabaseClient'
import { User } from '@supabase/supabase-js'
import { APP_URL, LANDING_URL } from './config'

export const supabase = getSupabaseClient()

export type AuthUser = User | null

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  plan_type: 'free' | 'pro'
  feedback_count: number
  monthly_limit: number
  created_at: string
  updated_at: string
  subscription_ends_at?: string | null
  lemon_squeezy_subscription_id?: string | null
}

// Password validation function
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  return { isValid: true }
}

// 🔥 SIMPLE: Basic check that only catches obvious cases
export async function checkEmailAuthType(email: string): Promise<'email' | 'oauth' | 'none'> {
  try {
    console.log('🔍 [DETECTION] Simple check for:', email)
    
    // Only check recent signup marker - don't do any API calls
    const recentSignupKey = `recent_signup_${email}`
    const recentSignup = localStorage.getItem(recentSignupKey)
    
    if (recentSignup) {
      const signupTime = parseInt(recentSignup)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      
      if (signupTime > fiveMinutesAgo) {
        console.log('✅ [DETECTION] Recent signup marker found')
        return 'email'
      } else {
        // Clean up old marker
        localStorage.removeItem(recentSignupKey)
      }
    }
    
    // Default to unknown - let Supabase handle it
    console.log('✅ [DETECTION] No recent signup, defaulting to none')
    return 'none'
    
  } catch (error) {
    console.error('❌ [DETECTION] Error:', error)
    return 'none'
  }
}

// Check if user is OAuth-only (Google/Discord)
export async function isOAuthUser(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false
    
    const providers = user.identities?.map(identity => identity.provider) || []
    const hasOAuth = providers.includes('google') || providers.includes('discord')
    const hasEmail = providers.includes('email')
    
    console.log('🔍 User auth check:', { providers, hasOAuth, hasEmail })
    
    return hasOAuth && !hasEmail
  } catch (error) {
    console.error('Error checking if OAuth user:', error)
    return false
  }
}

// SECURE: Reset password - only used when user explicitly requests it
export async function resetPassword(email: string, source: 'landing' | 'settings' = 'landing') {
  const redirectUrl = source === 'settings' 
    ? `${APP_URL}/auth/password-reset?source=settings`
    : `${APP_URL}/auth/password-reset?source=landing`;
    
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  })
  
  // Let the error bubble up - don't try to interpret it
  return { error }
}

// 🔥 SIMPLIFIED: Only block on definitive account existence, allow deleted accounts to re-register
export async function signUp(
  email: string, 
  password: string, 
  fullName?: string, 
  marketingOptOut?: boolean,
  guestSessionId?: string // NEW: Guest session ID for migration
) {
  console.log('🔍 [SIGNUP] Starting signup for:', email, 'Guest session:', guestSessionId)
  
  const passwordCheck = validatePassword(password)
  if (!passwordCheck.isValid) {
    return { data: null, error: new Error(passwordCheck.error!) }
  }

  // Check if email already exists in database (prevents fake "verification sent" messages)
  console.log('🔍 [SIGNUP] Checking if email already exists...')
  try {
    const checkResponse = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    })

    if (checkResponse.ok) {
      const { exists } = await checkResponse.json()
      if (exists) {
        console.log('🚨 [SIGNUP] BLOCKING - Email already registered')
        return {
          data: null,
          error: new Error('An account with this email already exists. Please sign in instead.')
        }
      }
    }
  } catch (checkError) {
    console.log('🔍 [SIGNUP] Email check failed, proceeding:', checkError)
    // Continue with signup if check fails - Supabase will catch duplicates
  }

  console.log('✅ [SIGNUP] Email available, proceeding to Supabase signup')
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
        marketing_opt_out: marketingOptOut || false,
      },
      // Include email in URL so we can check verification status in any browser
      emailRedirectTo: `${APP_URL}/auth/callback?type=signup&verify_email=${encodeURIComponent(email)}`
    },
  })
  
  if (error) {
    console.log('❌ [SIGNUP] Supabase error:', error.message)
    
    // Handle Supabase's specific error messages
    if (error.message.includes('already registered') || 
        error.message.includes('already exists') ||
        error.message.includes('already been taken') ||
        error.message.includes('User already registered')) {
      return {
        data: null,
        error: new Error('An account with this email already exists. Please sign in instead.')
      }
    }
    
    // Pass through other errors as-is
    return { data, error }
  }
  
  // Mark successful signups 
  if (data?.user) {
    const recentSignupKey = `recent_signup_${email}`
    localStorage.setItem(recentSignupKey, Date.now().toString())
    console.log('✅ [SIGNUP] Success - marked recent signup')
    
    // 🎯 Create pending guest claim
    // Store email + guest_identifier for claiming after email verification
    try {
      // Check cookie AND localStorage (localStorage persists across verification flow)
      let guestId = null
      
      const guestCookie = document.cookie.split('; ').find(row => row.startsWith('z_guest_session_id='))
      if (guestCookie) {
        guestId = guestCookie.split('=')[1]
      }
      
      // Fallback to localStorage
      if (!guestId) {
        guestId = localStorage.getItem('z_guest_session_id')
      }
      
      if (guestId) {
        console.log('🔄 [SIGNUP] Creating pending claim for guest upload...')
        
        // Get app URL
        const appUrl = APP_URL
        
        // Create pending claim (will be executed on first login)
        const claimResponse = await fetch(`${appUrl}/api/guest/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mode: 'pending',
            guestIdentifier: guestId
          })
        })
        
        if (claimResponse.ok) {
          console.log('✅ [SIGNUP] Pending claim created (will be claimed on login)')
          // Clear guest identifiers and cooldown since we've created the claim
          localStorage.removeItem('z_guest_session_id')
          localStorage.removeItem('guest_upload_cooldown')
        } else {
          console.error('❌ [SIGNUP] Failed to create pending claim:', await claimResponse.text())
        }
      }
    } catch (claimError) {
      console.error('❌ [SIGNUP] Pending claim exception:', claimError)
      // Don't fail signup if claiming fails
    }
  }
  
  console.log('🔍 [SIGNUP] Result:', { 
    hasData: !!data, 
    hasUser: !!data?.user,
    needsConfirmation: data?.user && !data.user.email_confirmed_at
  })
  
  return { data, error }
}

// SECURE: Enhanced signin
export async function signIn(email: string, password: string) {
  console.log('🔍 [SIGNIN] Starting signin process...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.log('🚨 [SIGNIN] Error:', error.message)
    
    if (error.message.includes('Email not confirmed') || 
        error.message.includes('email not verified')) {
      return { 
        data: null, 
        error: new Error('Please verify your email first. Check your inbox for the verification link!') 
      }
    }
    
    if (error.message.includes('Invalid login credentials')) {
      return { 
        data: null, 
        error: new Error('Invalid email or password. If you signed up with Google or Discord, use those buttons above.') 
      }
    }
    
    return { data, error }
  }
  
  console.log('✅ [SIGNIN] Success')
  
  // Check for pending guest claim (from signup)
  try {
    console.log('🔄 [SIGNIN] Checking for pending guest claim...')
    
    const appUrl = APP_URL
    
    const claimResponse = await fetch(`${appUrl}/api/guest/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}) // Empty body = execute pending claim
    })
    
    if (claimResponse.ok) {
      const claimData = await claimResponse.json()
      if (claimData.claimed) {
        console.log('✅ [SIGNIN] Guest upload claimed and converted!')
      } else {
        console.log('ℹ️ [SIGNIN] No pending claim found')
      }
    }
  } catch (claimError) {
    console.error('❌ [SIGNIN] Claim check failed:', claimError)
  }
  
  // Clear guest cookie, localStorage, and cooldown
  try {
    const guestCookie = document.cookie.split('; ').find(row => row.startsWith('z_guest_session_id='))
    if (guestCookie) {
      console.log('🔄 [SIGNIN] Clearing guest cookie')
      document.cookie = 'z_guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }
    localStorage.removeItem('z_guest_session_id')
    localStorage.removeItem('guest_upload_cooldown') // Clear cooldown
    console.log('✅ [SIGNIN] Cleared guest identifiers and cooldown')
  } catch (err) {
    console.log('ℹ️ [SIGNIN] Could not clear guest identifiers:', err)
  }
  
  return { data, error }
}

// Simple resend confirmation
export async function resendConfirmation(email: string) {
  console.log('🔍 [RESEND] Resending confirmation for:', email)

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      // Include email in URL so we can check verification status in any browser
      emailRedirectTo: `${APP_URL}/auth/callback?type=signup&verify_email=${encodeURIComponent(email)}`
    }
  })
  
  if (error) {
    console.log('❌ [RESEND] Error:', error.message)
    
    if (error.message.includes('already confirmed') || 
        error.message.includes('already verified')) {
      return {
        error: new Error('This email is already verified. Please try signing in instead.')
      }
    }
    
    if (error.message.includes('not found') || 
        error.message.includes('does not exist')) {
      return {
        error: new Error('No account found with this email. Please sign up first.')
      }
    }
  }
  
  return { error }
}

// Cooldown system (unchanged)
const RESET_COOLDOWN_MINUTES = 60
const COOLDOWN_STORAGE_KEY = 'zombify_reset_cooldowns'

interface ResetCooldown {
  email: string
  timestamp: number
  expiresAt: number
}

function getStoredCooldowns(): ResetCooldown[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY)
    if (!stored) return []
    
    const cooldowns: ResetCooldown[] = JSON.parse(stored)
    const now = Date.now()
    const activeCooldowns = cooldowns.filter(cd => cd.expiresAt > now)
    
    if (activeCooldowns.length !== cooldowns.length) {
      localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(activeCooldowns))
    }
    
    return activeCooldowns
  } catch (error) {
    console.error('Error reading reset cooldowns:', error)
    return []
  }
}

function storeCooldown(email: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const cooldowns = getStoredCooldowns()
    const now = Date.now()
    const expiresAt = now + (RESET_COOLDOWN_MINUTES * 60 * 1000)
    
    const filteredCooldowns = cooldowns.filter(cd => cd.email.toLowerCase() !== email.toLowerCase())
    
    const newCooldown: ResetCooldown = {
      email: email.toLowerCase(),
      timestamp: now,
      expiresAt
    }
    
    filteredCooldowns.push(newCooldown)
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(filteredCooldowns))
  } catch (error) {
    console.error('Error storing reset cooldown:', error)
  }
}

export function isEmailOnResetCooldown(email: string): { onCooldown: boolean; minutesRemaining: number } {
  if (!email) return { onCooldown: false, minutesRemaining: 0 }
  
  const cooldowns = getStoredCooldowns()
  const cooldown = cooldowns.find(cd => cd.email.toLowerCase() === email.toLowerCase())
  
  if (!cooldown) {
    return { onCooldown: false, minutesRemaining: 0 }
  }
  
  const now = Date.now()
  if (cooldown.expiresAt <= now) {
    return { onCooldown: false, minutesRemaining: 0 }
  }
  
  const minutesRemaining = Math.ceil((cooldown.expiresAt - now) / (60 * 1000))
  return { onCooldown: true, minutesRemaining }
}

export function getResetCooldownStatus(email: string): { canReset: boolean; message?: string } {
  const { onCooldown, minutesRemaining } = isEmailOnResetCooldown(email)
  
  if (!onCooldown) {
    return { canReset: true }
  }
  
  const hours = Math.floor(minutesRemaining / 60)
  const mins = minutesRemaining % 60
  
  let timeMessage = ''
  if (hours > 0) {
    timeMessage = `${hours} hour${hours > 1 ? 's' : ''}`
    if (mins > 0) {
      timeMessage += ` and ${mins} minute${mins > 1 ? 's' : ''}`
    }
  } else {
    timeMessage = `${mins} minute${mins > 1 ? 's' : ''}`
  }
  
  return {
    canReset: false,
    message: `You can send a new password reset in ${timeMessage}`
  }
}

export async function resetPasswordWithCooldown(
  email: string, 
  source: 'landing' | 'settings' = 'landing'
): Promise<{ success: boolean; error?: string; onCooldown?: boolean; isOAuth?: boolean }> {
  const cooldownStatus = getResetCooldownStatus(email)
  if (!cooldownStatus.canReset) {
    return {
      success: false,
      error: cooldownStatus.message,
      onCooldown: true
    }
  }
  
  const result = await resetPassword(email, source)
  
  if (result.error) {
    return {
      success: false,
      error: result.error.message || 'Failed to send reset email'
    }
  }
  
  storeCooldown(email)
  return { success: true }
}

export function clearResetCooldown(email: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const cooldowns = getStoredCooldowns()
    const filteredCooldowns = cooldowns.filter(cd => cd.email.toLowerCase() !== email.toLowerCase())
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(filteredCooldowns))
  } catch (error) {
    console.error('Error clearing reset cooldown:', error)
  }
}

export async function getUserProviders(): Promise<string[]> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return []
    
    return user.identities?.map(identity => identity.provider) || []
  } catch (error) {
    console.error('Error getting user providers:', error)
    return []
  }
}

// OAuth functions - redirect to LANDING callback first (for PKCE), then transfer to APP
export async function signInWithGoogle() {
  console.log('🔍 Starting PKCE Google OAuth...')

  // Redirect to LANDING's callback (same domain where PKCE verifier is stored)
  // Landing callback will exchange code, then redirect to APP with session tokens
  let redirectUrl = `${LANDING_URL}/auth/callback`

  // Preserve returnTo parameter if present
  try {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo')
    if (returnTo) {
      redirectUrl = `${LANDING_URL}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
    }
  } catch {}

  console.log('🔗 OAuth redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  return { data, error }
}

export async function signInWithDiscord() {
  console.log('🔍 Starting PKCE Discord OAuth...')

  // Redirect to LANDING's callback (same domain where PKCE verifier is stored)
  // Landing callback will exchange code, then redirect to APP with session tokens
  let redirectUrl = `${LANDING_URL}/auth/callback`

  // Preserve returnTo parameter if present
  try {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo')
    if (returnTo) {
      redirectUrl = `${LANDING_URL}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
    }
  } catch {}

  console.log('🔗 OAuth redirect URL:', redirectUrl)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: redirectUrl,
      scopes: 'identify email'
    }
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  console.log('👤 Profile loaded:', { id: data?.id, plan_type: data?.plan_type, subscription_ends_at: data?.subscription_ends_at })
  
  return data
}

export async function canUserUpload(userId?: string): Promise<boolean> {
    return true;
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function incrementFeedbackCount(userId: string) {
  const { error } = await supabase.rpc('increment_feedback_count', {
    user_uuid: userId
  })
  
  if (error) {
    console.error('Error incrementing feedback count:', error)
  }
}

// REMOVED FUNCTIONS (no longer needed):
// - signUpWithDetection
// - signInWithDetection  
// - linkEmailPassword
// - changePassword
// - updatePasswordOAuthAccount
// - hasEmailAuth
// - hasPasswordLinked
// - hasOriginalEmailAuth
// - resetLinkedPassword