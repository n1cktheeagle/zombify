/**
 * Centralized environment configuration for Landing Site
 * Single source of truth for all environment-dependent URLs and settings
 */

type Environment = 'development' | 'staging' | 'production';

function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV;
  
  if (env === 'production' && process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    return 'staging';
  }
  
  if (env === 'production') return 'production';
  return 'development';
}

export const ENV = getEnvironment();

/**
 * App URL (main application)
 * - Development: http://localhost:3000
 * - Staging: https://your-staging-app.vercel.app
 * - Production: https://app.zombify.ai
 */
export const APP_URL = 
  ENV === 'production' 
    ? 'https://app.zombify.ai'
    : ENV === 'staging'
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://zombify-app-staging.vercel.app'
    : 'http://localhost:3000';

/**
 * Landing page URL (this site)
 * - Development: http://localhost:3001
 * - Staging: https://your-staging-site.vercel.app
 * - Production: https://zombify.ai
 */
export const LANDING_URL = 
  ENV === 'production'
    ? 'https://zombify.ai'
    : ENV === 'staging'
    ? process.env.NEXT_PUBLIC_LANDING_URL || 'https://zombify-site-staging.vercel.app'
    : 'http://localhost:3001';

/**
 * Current origin (dynamically determined)
 */
export const getOrigin = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return LANDING_URL;
};

/**
 * Helper to check if running locally
 */
export const isLocalhost = (): boolean => {
  if (typeof window === 'undefined') return ENV === 'development';
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

/**
 * Support email
 */
export const SUPPORT_EMAIL = 'hi@zombify.ai';

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  aiDisclaimer: '/ai-disclaimer',
};

console.log('🌍 Landing Site Config:', {
  ENV,
  APP_URL,
  LANDING_URL,
});

