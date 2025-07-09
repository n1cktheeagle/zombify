'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { AuthButton } from '@/components/AuthButton'

interface MainHeaderProps {
  variant?: 'landing' | 'app'
}

export function MainHeader({ variant = 'app' }: MainHeaderProps) {
  const { user } = useAuth()

  // Determine logo destination based on user auth status
  const logoHref = user ? '/dashboard' : '/'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#f5f1e6] border-b border-black/10">
      {/* Logo */}
      <Link 
        href={logoHref} 
        className="text-2xl font-bold tracking-tight text-black font-mono hover:opacity-80 transition-opacity"
      >
        ZOMBIFY
      </Link>
      
      {/* Auth Component */}
      <AuthButton />
    </nav>
  )
}