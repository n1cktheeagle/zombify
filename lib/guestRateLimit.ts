// lib/guestRateLimit.ts - Server-side guest protection
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

interface GuestUploadRecord {
  id: string
  fingerprint_hash: string
  ip_address: string
  user_agent: string
  uploaded_at: string
  expires_at: string
}

// Generate device fingerprint from request headers
function generateFingerprint(request: Request): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  
  // Create a fingerprint from multiple browser characteristics
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

// Get client IP (works with Vercel, Netlify, etc.)
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

export async function checkGuestUploadLimit(request: Request): Promise<{
  allowed: boolean
  remainingTime?: number
  reason?: string
}> {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is authenticated, allow upload (handle limits elsewhere)
  if (session?.user) {
    return { allowed: true }
  }
  
  const fingerprint = generateFingerprint(request)
  const ipAddress = getClientIP(request)
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  try {
    // Check for recent uploads from this fingerprint OR IP
    const { data: recentUploads, error } = await supabase
      .from('guest_uploads')
      .select('*')
      .or(`fingerprint_hash.eq.${fingerprint},ip_address.eq.${ipAddress}`)
      .gte('uploaded_at', oneDayAgo.toISOString())
      .order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('Error checking guest uploads:', error)
      // On error, be permissive but log it
      return { allowed: true }
    }
    
    if (recentUploads && recentUploads.length > 0) {
      const lastUpload = recentUploads[0]
      const uploadTime = new Date(lastUpload.uploaded_at)
      const timeUntilNext = uploadTime.getTime() + (24 * 60 * 60 * 1000) - now.getTime()
      
      if (timeUntilNext > 0) {
        return {
          allowed: false,
          remainingTime: Math.ceil(timeUntilNext / 1000), // seconds
          reason: 'Guest limit: 1 upload per 24 hours'
        }
      }
    }
    
    return { allowed: true }
    
  } catch (error) {
    console.error('Guest rate limit check failed:', error)
    // On error, allow upload but log the issue
    return { allowed: true }
  }
}

export async function recordGuestUpload(request: Request, uploadId: string): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  // Only record for guest uploads
  if (session?.user) return
  
  const fingerprint = generateFingerprint(request)
  const ipAddress = getClientIP(request)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  try {
    await supabase
      .from('guest_uploads')
      .insert({
        id: uploadId,
        fingerprint_hash: fingerprint,
        ip_address: ipAddress,
        user_agent: request.headers.get('user-agent') || '',
        uploaded_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
  } catch (error) {
    console.error('Failed to record guest upload:', error)
    // Don't fail the upload if recording fails
  }
}

// SQL to create the guest_uploads table
export const GUEST_UPLOADS_TABLE_SQL = `
-- Create guest_uploads table for rate limiting
CREATE TABLE IF NOT EXISTS public.guest_uploads (
  id uuid PRIMARY KEY,
  fingerprint_hash text NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  uploaded_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_uploads_fingerprint ON guest_uploads(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_guest_uploads_ip ON guest_uploads(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_uploads_uploaded_at ON guest_uploads(uploaded_at);

-- Enable RLS
ALTER TABLE public.guest_uploads ENABLE ROW LEVEL SECURITY;

-- Create policy (only server can read/write)
CREATE POLICY "Service role can manage guest uploads" ON guest_uploads
  FOR ALL USING (auth.role() = 'service_role');
`;