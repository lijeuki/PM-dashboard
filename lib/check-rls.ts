import { supabase } from "./supabase"

export async function checkRLSAccess() {
  try {
    // Try to fetch a single row from each table to check access
    const tables = ["projects", "mandays", "project_role_rates", "project_ledger"]
    const results = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*").limit(1)

      results[table] = {
        success: !error,
        error: error ? error.message : null,
        hasData: data && data.length > 0,
      }
    }

    return results
  } catch (error) {
    console.error("Error checking RLS access:", error)
    return { error: "Failed to check RLS access" }
  }
}
