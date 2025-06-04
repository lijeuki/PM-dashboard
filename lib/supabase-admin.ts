import { createClient } from "@supabase/supabase-js"

// This file should ONLY be imported in server components or API routes
// Never import this in client components

// Create a Supabase client with the service role key for admin operations
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing from environment variables")
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing from environment variables")
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase admin client:", error)
    throw new Error("Failed to initialize Supabase admin client")
  }
}
