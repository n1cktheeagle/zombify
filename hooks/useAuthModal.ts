'use client'
import { useState } from 'react'

export function useAuthModal() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const openSignIn = () => {
    setAuthMode('signin')
    setShowAuthModal(true)
  }

  const openSignUp = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const closeModal = () => {
    setShowAuthModal(false)
  }

  return {
    showAuthModal,
    authMode,
    openSignIn,
    openSignUp,
    closeModal
  }
}