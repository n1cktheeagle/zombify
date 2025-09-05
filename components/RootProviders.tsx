'use client'

import React from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import { UploadProvider } from '@/contexts/UploadContext'
import { AppLayout } from '@/components/AppLayout'

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UploadProvider>
        <AppLayout>{children}</AppLayout>
      </UploadProvider>
    </AuthProvider>
  )
}
