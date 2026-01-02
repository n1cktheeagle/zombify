/**
 * Centralized environment configuration for Landing Site
 * Single source of truth for all environment-dependent URLs and settings
 */

type Environment = 'development' | 'staging' | 'production';

function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV;
  
  // Explicit staging check first
  if (env === 'staging') return 'staging';
  
  if (env === 'production' && process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    return 'staging';
  }
  
  if (env === 'production') return 'production';
  return 'development';
}

export const ENV = getEnvironment();

/**
 * Helper to get URL from Vercel's auto-set VERCEL_URL
 * VERCEL_URL is automatically set by Vercel (without protocol)
 */
function getVercelUrl(): string | undefined {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return undefined;
}

/**
 * Helper to derive app URL from landing URL
 * Replaces 'zombify-site' with 'zombify-app' in the URL
 */
function deriveAppUrl(landingUrl: string): string {
  return landingUrl.replace('zombify-site', 'zombify-app');
}

/**
 * Landing page URL (this site)
 * - Development: http://localhost:3001
 * - Staging/Preview: Auto-detected from VERCEL_URL, or explicit env var
 * - Production: https://zombify.ai
 */
export const LANDING_URL =
  ENV === 'production'
    ? 'https://zombify.ai'
    : ENV === 'development'
    ? 'http://localhost:3001'
    : process.env.NEXT_PUBLIC_LANDING_URL || getVercelUrl() || 'https://zombify-site-git-staging-ashernicholas-6278s-projects.vercel.app';

/**
 * App URL (main application)
 * - Development: http://localhost:3000
 * - Staging/Preview: Auto-detected from VERCEL_URL (derived), or explicit env var
 * - Production: https://app.zombify.ai
 */
export const APP_URL =
  ENV === 'production'
    ? 'https://app.zombify.ai'
    : ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL || (getVercelUrl() ? deriveAppUrl(getVercelUrl()!) : 'https://zombify-app-git-staging-ashernicholas-6278s-projects.vercel.app');

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

// Only log in non-production environments
if (ENV !== 'production') {
  console.log('🌍 Landing Site Config:', {
    ENV,
    APP_URL,
    LANDING_URL,
  });
}

