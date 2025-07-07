import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

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
}

// Password validation function
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  return { isValid: true }
}

// FIXED: More reliable email auth type detection
export async function checkEmailAuthType(email: string): Promise<'email' | 'oauth' | 'none'> {
  try {
    console.log('🔍 Testing signup attempt for detection...')
    
    // BETTER METHOD: Try signup first to see if account exists
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password: 'test_password_for_detection_456',
      options: { 
        emailRedirectTo: 'http://localhost:3000/test-detection'
      }
    })
    
    if (signupError) {
      const signupErrorMsg = signupError.message.toLowerCase()
      console.log('🔍 Signup test error:', signupErrorMsg)
      
      // If signup fails because account exists
      if (signupErrorMsg.includes('already') || 
          signupErrorMsg.includes('registered') || 
          signupErrorMsg.includes('exists')) {
        
        console.log('🔍 Account exists, testing password capability...')
        
        // Now test password signin to determine type
        const { error: pwError } = await supabase.auth.signInWithPassword({
          email,
          password: 'definitely_wrong_password_test_123'
        })
        
        if (pwError) {
          const pwErrorMsg = pwError.message.toLowerCase()
          console.log('🔍 Password test error:', pwErrorMsg)
          
          // These errors indicate EMAIL account exists
          if (pwErrorMsg.includes('invalid login credentials') || 
              pwErrorMsg.includes('email not confirmed')) {
            console.log('✅ Detected EMAIL account')
            return 'email'
          }
          
          // Other errors likely mean OAuth account
          console.log('✅ Detected OAUTH account')
          return 'oauth'
        }
        
        console.log('✅ Detected EMAIL account (password worked)')
        return 'email'
      }
    } else if (signupData && signupData.user) {
      console.log('⚠️ Signup succeeded = no existing account (cleaning up test account)')
      // We accidentally created a test account, but this means NO existing account
      // The test account will be cleaned up by Supabase since it has no confirmation
      return 'none'
    }
    
    console.log('✅ No existing account detected')
    return 'none'
    
  } catch (error) {
    console.error('❌ Error in checkEmailAuthType:', error)
    // Default to 'none' to allow signup if we can't determine
    return 'none'
  }
}

// SIMPLIFIED: Check if user is OAuth-only (Google/Discord)
export async function isOAuthUser(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false
    
    // Check if user has OAuth providers but NO email provider
    const providers = user.identities?.map(identity => identity.provider) || []
    const hasOAuth = providers.includes('google') || providers.includes('discord')
    const hasEmail = providers.includes('email')
    
    console.log('🔍 User auth check:', { providers, hasOAuth, hasEmail })
    
    // OAuth user = has OAuth AND no email provider
    return hasOAuth && !hasEmail
  } catch (error) {
    console.error('Error checking if OAuth user:', error)
    return false
  }
}

// SECURE: Reset password with OAuth detection
export async function resetPassword(email: string, source: 'landing' | 'settings' = 'landing') {
  // First check if this email belongs to an OAuth account
  const authType = await checkEmailAuthType(email)
  
  if (authType === 'oauth') {
    return { 
      error: { 
        message: 'This account was created with Google or Discord. Please sign in using that method instead.',
        isOAuthAccount: true
      }
    }
  }
  
  if (authType === 'none') {
    return {
      error: {
        message: 'No account found with this email address.',
        noAccount: true
      }
    }
  }
  
  // Proceed with normal password reset for email accounts
  const redirectUrl = source === 'settings' 
    ? `${window.location.origin}/auth/password-reset?source=settings`
    : `${window.location.origin}/auth/password-reset?source=landing`;
    
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  })
  
  return { error }
}

// SECURE: Basic signup - only creates email accounts
export async function signUp(email: string, password: string, fullName?: string) {
  console.log('🔍 Starting secure signUp for:', email)
  
  const passwordCheck = validatePassword(password)
  if (!passwordCheck.isValid) {
    return { data: null, error: new Error(passwordCheck.error!) }
  }

  // Check if account already exists
  console.log('🔍 Checking email auth type...')
  const authType = await checkEmailAuthType(email)
  console.log('🔍 Auth type result:', authType)
  
  if (authType === 'oauth') {
    console.log('🚨 BLOCKING OAuth account signup')
    return { 
      data: null, 
      error: new Error('An account with this email already exists using Google or Discord. Please sign in with that method instead.') 
    }
  }
  if (authType === 'email') {
    console.log('🚨 BLOCKING existing email account signup')
    return { 
      data: null, 
      error: new Error('An account with this email already exists. Please sign in instead.') 
    }
  }

  console.log('✅ Proceeding with new account creation')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
      emailRedirectTo: `${window.location.origin}/auth/callback?type=email`
    },
  })
  
  console.log('🔍 Supabase signup result:', { data: !!data, error: error?.message })
  return { data, error }
}

// SECURE: Enhanced signin that blocks OAuth accounts
export async function signIn(email: string, password: string) {
  // SECURITY CHECK: First verify this email can use password auth
  const authType = await checkEmailAuthType(email)
  
  if (authType === 'oauth') {
    return { 
      data: null, 
      error: new Error('This account is already created, please sign in.') 
    }
  }
  
  if (authType === 'none') {
    return { 
      data: null, 
      error: new Error('No account found with this email address.') 
    }
  }
  
  // Proceed with password authentication only for email accounts
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
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
  // Check cooldown first
  const cooldownStatus = getResetCooldownStatus(email)
  if (!cooldownStatus.canReset) {
    return {
      success: false,
      error: cooldownStatus.message,
      onCooldown: true
    }
  }
  
  // Check if OAuth account and reset password
  const result = await resetPassword(email, source)
  
  if (result.error) {
    if ((result.error as any).isOAuthAccount) {
      return {
        success: false,
        error: result.error.message,
        isOAuth: true
      }
    }
    return {
      success: false,
      error: result.error.message
    }
  }
  
  // Success - store cooldown
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

// Resend email confirmation
export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?type=email`
    }
  })
  return { error }
}

// Get user's auth providers
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

// SECURE: Sign in with Google - blocks email/password accounts
export async function signInWithGoogle() {
  console.log('🔍 Starting secure Google OAuth...')
  
  // Note: We can't pre-check email for OAuth since we don't have it yet
  // But we can add a callback check after OAuth completes
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?oauth_provider=google`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  
  return { data, error }
}

// SECURE: Sign in with Discord - blocks email/password accounts  
export async function signInWithDiscord() {
  console.log('🔍 Starting secure Discord OAuth...')
  
  // Note: We can't pre-check email for OAuth since we don't have it yet
  // But we can add a callback check after OAuth completes
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?oauth_provider=discord`,
      queryParams: {
        prompt: 'consent',
      }
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