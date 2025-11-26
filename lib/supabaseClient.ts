import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Get or create a SINGLE shared Supabase browser client.
 * Creating multiple instances breaks PKCE storage.
 */
export function getSupabaseClient() {
  if (client) {
    return client
  }
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}

