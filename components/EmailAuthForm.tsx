'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface EmailAuthFormProps {
  mode: 'signin' | 'signup'
  onClose: () => void
}

export default function EmailAuthForm({ mode, onClose }: EmailAuthFormProps) {
  const { signUpWithEmail, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password)
        if (error) throw error
        setMessage('✅ Check your email for the verification link!')
      } else {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setError('Please verify your email first. Check your inbox!')
          } else {
            throw error
          }
        } else {
          onClose()
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={6}
        />
        
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
        
        {message && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
            </div>
          ) : (
            mode === 'signup' ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>
    </div>
  )
}
