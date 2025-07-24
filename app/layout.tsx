import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from '@/hooks/useAuth'
import { UploadProvider } from '@/contexts/UploadContext'
import { AppLayout } from '@/components/AppLayout'

export const metadata: Metadata = {
  title: "Zombify - UX Feedback Tool",
  description: "Get undead-level UX feedback for your designs",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <UploadProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </UploadProvider>
        </AuthProvider>
      </body>
    </html>
  )
}