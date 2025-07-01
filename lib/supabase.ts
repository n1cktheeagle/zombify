import { createClient } from '@supabase/supabase-js'

// Simple client for server-side usage (API routes)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// For pages that need auth context later
export const createSupabaseServerClient = () => {
  return supabase
}