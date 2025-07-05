'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AuthNotifications() {
  const searchParams = useSearchParams()
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    const verified = searchParams.get('verified')
    const error = searchParams.get('error')

    if (verified === 'true') {
      setNotification({
        type: 'success',
        message: '🎉 Email verified successfully! You can now access your dashboard.'
      })
      
      setTimeout(() => setNotification(null), 5000)
      window.history.replaceState({}, '', '/')
    } else if (error) {
      setNotification({
        type: 'error',
        message: '❌ Authentication failed. Please try again.'
      })
      
      setTimeout(() => setNotification(null), 8000)
      window.history.replaceState({}, '', '/')
    }
  }, [searchParams])

  if (!notification) return null

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg ${
      notification.type === 'success' 
        ? 'bg-green-50 border border-green-200 text-green-800' 
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
        <button
          onClick={() => setNotification(null)}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  )
}