/**
 * Unified tracking utility for PostHog analytics
 */

import posthog from 'posthog-js'

/**
 * Track an event with PostHog
 * Falls back gracefully if PostHog is not initialized
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    
    posthog.capture(eventName, properties)
  } catch (error) {
    // Silently fail to avoid disrupting user experience
    console.debug('Tracking error:', error)
  }
}

/**
 * Sharing-related tracking events
 */
export const trackSharedView = {
  /** Track when a user views a shared comparison */
  comparison(comparisonId: string, viewerType: 'owner' | 'logged_in' | 'anonymous') {
    trackEvent('comparison_shared_view', {
      comparison_id: comparisonId,
      viewer_type: viewerType,
    })
  },
  
  /** Track when a user views a shared single analysis */
  analysis(analysisId: string, viewerType: 'owner' | 'logged_in' | 'anonymous') {
    trackEvent('analysis_shared_view', {
      analysis_id: analysisId,
      viewer_type: viewerType,
    })
  },
}

/**
 * Track when a share link is copied
 */
export function trackShareLinkCopied(
  type: 'comparison' | 'analysis',
  id: string,
  slug?: string
) {
  const eventName = type === 'comparison' 
    ? 'comparison_share_link_copied' 
    : 'analysis_share_link_copied'
  
  trackEvent(eventName, {
    [`${type}_id`]: id,
    slug,
  })
}

/**
 * Track when a user signs up from a shared view
 */
export function trackSignupFromShared(
  source: 'comparison' | 'analysis',
  id: string,
  slug?: string
) {
  const eventName = source === 'comparison'
    ? 'signup_from_shared_comparison'
    : 'signup_from_shared_analysis'
  
  trackEvent(eventName, {
    [`${source}_id`]: id,
    slug,
  })
}

