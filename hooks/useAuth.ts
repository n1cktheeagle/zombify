'use client'
import React, { useState, useEffect, createContext, useContext } from 'react'
import type { User } from '@supabase/auth-helpers-nextjs'
import { 
  supabase, 
  getUserProfile, 
  signUp, 
  signIn, 
  resendConfirmation, 
  resetPassword,
  resetPasswordWithCooldown,
  getUserProviders,
  isOAuthUser
} from '@/lib/auth'

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

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Simplified auth functions
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  resendConfirmation: (email: string) => Promise<any>
  resetPassword: (email: string, source?: 'landing' | 'settings') => Promise<any>
  resetPasswordWithCooldown: (email: string, source?: 'landing' | 'settings') => Promise<any>
  // Account info functions
  getUserProviders: () => Promise<string[]>
  isOAuthUser: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // 🔥 ENHANCED: Better deleted user detection
  const isDeletedUserError = (error: any): boolean => {
    const errorMessage = error?.message?.toLowerCase() || ''
    const errorCode = error?.code
    const errorStatus = error?.status || error?.statusCode
    
    return (
      // JWT/Auth errors
      errorMessage.includes('jwt') || 
      errorCode === 'INVALID_JWT' ||
      errorMessage.includes('invalid jwt') ||
      
      // Database/Profile errors  
      errorCode === 'PGRST116' ||
      errorMessage.includes('0 rows') ||
      errorMessage.includes('no rows') ||
      errorMessage.includes('multiple (or no) rows returned') ||
      
      // 🔥 NEW: HTTP status errors
      errorStatus === 403 || // Forbidden
      errorStatus === 406 || // Not Acceptable  
      errorStatus === 401 || // Unauthorized
      
      // 🔥 NEW: Common deleted user error patterns
      errorMessage.includes('not found') ||
      errorMessage.includes('user does not exist') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('not acceptable')
    )
  }

  // 🔥 ENHANCED: Better cleanup with auth verification
  const handleDeletedUser = async (userId: string, context: string) => {
    console.log(`🚨 Detected deleted user in ${context}, cleaning up session...`)
    
    try {
      // 🔥 FIRST: Verify auth is actually invalid
      const { data: authCheck, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authCheck.user) {
        console.log('✅ Confirmed: Auth verification failed - user actually deleted')
      } else {
        console.log('⚠️ Auth is still valid - this might be a temporary error')
        // If auth is still valid, maybe it's just a profile issue, not deletion
        // Still proceed with cleanup but log the discrepancy
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local state
      setUser(null)
      setProfile(null)
      
      // Clear any cached data
      localStorage.removeItem('zombify_user_cache')
      
      console.log('✅ Deleted user cleanup complete')
      
      // 🔥 FORCE REDIRECT: Navigate to landing page with message
      if (typeof window !== 'undefined') {
        console.log('🔄 Forcing redirect to landing page...')
        window.location.href = '/?auth_message=session_expired'
      }
      
    } catch (error) {
      console.error('❌ Error during deleted user cleanup:', error)
      
      // 🔥 FORCE REDIRECT even if signout fails
      if (typeof window !== 'undefined') {
        console.log('🔄 Forcing redirect despite cleanup error...')
        window.location.href = '/?auth_message=session_expired'
      }
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔐 Starting auth initialization...')
        
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        console.log('📋 Session result:', session ? `Found user: ${session.user?.email}` : 'No session')

        if (session?.user) {
          setUser(session.user)
          
          try {
            const userProfile = await getUserProfile(session.user.id)
            if (mounted) {
              setProfile(userProfile)
            }
            
            // 🔥 ENHANCED: Better null profile handling
            if (!userProfile && mounted) {
              console.log('🔍 Profile is null after successful fetch - checking auth validity...')
              
              // Double-check auth status
              const { data: authCheck, error: authError } = await supabase.auth.getUser()
              
              if (authError || !authCheck.user) {
                console.log('🚨 Auth verification failed - user deleted from auth system')
                await handleDeletedUser(session.user.id, 'auth_verification')
                return
              } else {
                console.log('✅ Auth is valid but no profile - this is normal for new OAuth users')
              }
            }
            
          } catch (profileError: any) {
            console.warn('Profile loading failed during initialization:', profileError)
            
            // 🔥 ENHANCED: Use improved deleted user detection
            if (isDeletedUserError(profileError)) {
              console.log('🚨 Detected deleted user during initialization:', {
                code: profileError?.code,
                status: profileError?.status,
                message: profileError?.message
              })
              await handleDeletedUser(session.user.id, 'initialization')
              return // Exit early to prevent further processing
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
          console.log('🏁 Auth initialization complete')
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')
        
        if (!mounted) return

        setUser(session?.user ?? null)

        if (mounted) {
          setLoading(false)
          setInitialized(true)
          console.log('🏁 Auth state listener set initialized=true')
        }

        if (session?.user) {
          getUserProfile(session.user.id)
            .then(userProfile => {
              if (mounted) {
                setProfile(userProfile)
                console.log('✅ Profile loaded successfully')
              }
            })
            .catch((error: any) => {
              console.warn('Profile loading failed during auth change:', error)
              
              // 🔥 ENHANCED: Use improved deleted user detection
              if (isDeletedUserError(error)) {
                console.log('🚨 Detected deleted user during auth state change:', {
                  code: error?.code,
                  status: error?.status,
                  message: error?.message
                })
                handleDeletedUser(session.user.id, 'auth_state_change')
              }
            })
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      
      localStorage.removeItem('zombify_user_cache')
      
      window.location.href = '/'
    } catch (error) {
      console.error('❌ Error signing out:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
      } catch (error: any) {
        console.error('Error refreshing profile:', error)
        
        // 🔥 ENHANCED: Use improved deleted user detection
        if (isDeletedUserError(error)) {
          console.log('🚨 Detected deleted user during profile refresh:', {
            code: error?.code,
            status: error?.status,
            message: error?.message
          })
          await handleDeletedUser(user.id, 'refresh_profile')
        }
      }
    }
  }

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    initialized,
    signOut: handleSignOut,
    refreshProfile,
    // Simplified auth functions
    signUp,
    signIn,
    resendConfirmation,
    resetPassword,
    resetPasswordWithCooldown,
    // Account info functions
    getUserProviders,
    isOAuthUser
  }

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}