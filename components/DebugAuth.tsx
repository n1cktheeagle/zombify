'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/auth'

export default function DebugAuth() {
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUserInfo({
            email: user.email,
            providers: user.identities?.map(i => i.provider) || [],
            identities: user.identities,
            created_at: user.created_at,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
          })
        }
      } catch (error) {
        console.error('Debug error:', error)
      }
    }
    
    checkUser()
  }, [])

  if (!userInfo) return <div>Loading debug info...</div>

  return (
    <div className="bg-gray-100 p-4 rounded border">
      <h3 className="font-bold mb-2">🔍 Debug: Your Account Info</h3>
      
      <div className="space-y-2 text-sm font-mono">
        <div><strong>Email:</strong> {userInfo.email}</div>
        <div><strong>Providers:</strong> {JSON.stringify(userInfo.providers)}</div>
        <div><strong>Created:</strong> {userInfo.created_at}</div>
      </div>
      
      <details className="mt-4">
        <summary className="cursor-pointer font-medium">Show Full Identity Data</summary>
        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(userInfo.identities, null, 2)}
        </pre>
      </details>
    </div>
  )
}