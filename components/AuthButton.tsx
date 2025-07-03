'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'

export function AuthButton() {
  const { user, profile, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const openModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="font-mono text-black">
            {profile?.full_name || user.email}
          </div>
          <div className="text-xs text-gray-600">
            {profile?.plan_type === 'pro' ? '⭐ PRO' : `${profile?.feedback_count || 0}/${profile?.monthly_limit || 3} uploads`}
          </div>
        </div>
        <button
          onClick={signOut}
          className="text-sm font-mono tracking-wide px-4 py-2 border-2 border-black/20 text-black hover:border-black/40 hover:bg-black/5 transition-all"
        >
          SIGN OUT
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => openModal('signin')}
          className="text-sm font-mono tracking-wide text-black opacity-70 hover:opacity-100 transition-opacity"
        >
          LOGIN
        </button>
        <button
          onClick={() => openModal('signup')}
          className="text-sm font-mono tracking-wide px-4 py-2 border-2 border-black/20 text-black hover:border-black/40 hover:bg-black/5 transition-all"
        >
          SIGN UP
        </button>
      </div>
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          initialMode={authMode}
        />
      )}
    </>
  )
}