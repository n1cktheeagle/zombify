'use client'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { AuthModal } from './AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="font-mono text-gray-600">Loading...</div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return (
      <>
        {fallback || (
          <div className="zombify-card text-center">
            <h2 className="text-xl font-mono mb-4">Sign in required</h2>
            <p className="font-mono text-gray-600 mb-6">
              You need to sign in to access this feature.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="zombify-primary-button"
            >
              Sign In
            </button>
          </div>
        )}
        
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </>
    )
  }

  return <>{children}</>
}