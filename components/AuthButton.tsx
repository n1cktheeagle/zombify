'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'

export function AuthButton() {
  const { user, profile, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const openModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAccountSettings = () => {
    setShowDropdown(false)
    router.push('/settings')
  }

  const handleSignOut = async () => {
    setShowDropdown(false)
    await signOut()
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* User Info Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          onMouseEnter={() => setShowDropdown(true)}
          className="flex items-center gap-3 text-sm font-mono tracking-wide px-4 py-2 border-2 border-black/20 text-black hover:border-black/40 hover:bg-black/5 transition-all rounded"
        >
          <div className="text-left">
            <div className="font-mono text-black">
              {profile?.full_name || user.email}
            </div>
            <div className="text-xs text-gray-600">
              {profile?.plan_type === 'pro' ? '⭐ PRO' : `${profile?.feedback_count || 0}/${profile?.monthly_limit || 3} uploads`}
            </div>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div 
            className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black/20 rounded shadow-lg z-50"
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="py-2">
              <button
                onClick={handleAccountSettings}
                className="w-full text-left px-4 py-2 text-sm font-mono text-black hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Account Settings
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm font-mono text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
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