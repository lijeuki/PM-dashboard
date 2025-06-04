import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Check if keys are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing")
}

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on your Supabase schema
export interface Project {
  id: string
  name: string
  department: string | null
  status: string
  budget: number
  spent: number
  burn_rate: number
  mandays_allocated: number
  mandays_consumed: number
  start_date: string | null
  end_date: string | null
  description: string | null
  created_at: string
}

export interface MandayRecord {
  id: number
  project_id: string
  role: string
  month: string
  year: string
  total_hours: number
  mandays: number
  created_at: string
}

// Helper function to format project data from Supabase to our app format
export function formatProjectData(project: Project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description || "",
    status: project.status.toLowerCase() as "active" | "on-hold" | "at-risk" | "completed",
    budget: project.budget,
    spent: project.spent,
    burnRate: project.burn_rate,
    mandaysAllocated: project.mandays_allocated,
    mandaysConsumed: project.mandays_consumed,
    startDate: project.start_date || "",
    endDate: project.end_date || "",
    department: project.department || "",
  }
}

// Helper function to format project data from our app format to Supabase
export function formatProjectForSupabase(project: any) {
  return {
    name: project.name,
    description: project.description,
    status: project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("-", " "),
    budget: project.budget,
    spent: project.spent,
    burn_rate: project.burnRate,
    mandays_allocated: project.mandaysAllocated,
    mandays_consumed: project.mandaysConsumed,
    start_date: project.startDate,
    end_date: project.endDate,
    department: project.department,
  }
}
