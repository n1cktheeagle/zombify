'use client'
import React, { useState, useEffect, createContext, useContext } from 'react'
import type { User } from '@supabase/auth-helpers-nextjs'
import { supabase, getUserProfile } from '@/lib/auth'

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
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<any>
  signInWithEmail: (email: string, password: string) => Promise<any>
  resendEmailConfirmation: (email: string) => Promise<any>
  resetPassword: (email: string) => Promise<any>
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

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔐 Starting simple auth initialization...')
        
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
          } catch (profileError) {
            console.warn('Profile loading failed (non-critical):', profileError)
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
          console.log('🏁 Simple auth initialization complete')
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
            .catch(error => {
              console.warn('Profile loading failed during auth change:', error)
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
      } catch (error) {
        console.error('Error refreshing profile:', error)
      }
    }
  }

  const signUpWithEmailWrapper = async (email: string, password: string, fullName?: string) => {
    const { signUpWithEmail } = await import('@/lib/auth')
    return signUpWithEmail(email, password, fullName)
  }

  const signInWithEmailWrapper = async (email: string, password: string) => {
    const { signInWithEmail } = await import('@/lib/auth')
    return signInWithEmail(email, password)
  }

  const resendEmailConfirmationWrapper = async (email: string) => {
    const { resendEmailConfirmation } = await import('@/lib/auth')
    return resendEmailConfirmation(email)
  }

  const resetPasswordWrapper = async (email: string) => {
    const { resetPassword } = await import('@/lib/auth')
    return resetPassword(email)
  }

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    initialized,
    signOut: handleSignOut,
    refreshProfile,
    signUpWithEmail: signUpWithEmailWrapper,
    signInWithEmail: signInWithEmailWrapper,
    resendEmailConfirmation: resendEmailConfirmationWrapper,
    resetPassword: resetPasswordWrapper
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