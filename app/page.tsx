import type { Metadata } from 'next'

// Reuse the existing client landing page implementation
export { default } from './landing/page'

export const metadata: Metadata = {
  title: 'Zombify — Booting Zombify',
  description:
    'Ensure your UI works for modern-day zombies. Join the waitlist for Zombify.',
  alternates: { canonical: '/' },
}
