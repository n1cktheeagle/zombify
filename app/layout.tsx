import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/react'
import AttrCapture from '@/components/AttrCapture'

export const metadata: Metadata = {
  title: "Zombify - UX Feedback Tool",
  description: "Get undead-level UX feedback for your designs",
  generator: 'v0.dev'
}

const landingOnly = process.env.NEXT_PUBLIC_LAUNCH_MODE === 'landing-only'
const RootProviders = landingOnly ? null : dynamic(() => import('@/components/RootProviders'))

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
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AttrCapture />
        {landingOnly ? (
          children
        ) : (
          // Load heavy providers only for full app mode
          // @ts-expect-error dynamic component type
          <RootProviders>{children}</RootProviders>
        )}
        {/* Vercel Web Analytics (prod only) */}
        <Analytics />
      </body>
    </html>
  )
}