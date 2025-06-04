import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Try to fetch from the view first
    let { data, error } = await supabaseAdmin
      .from("project_spending_summary")
      .select("*")
      .order("project_name", { ascending: true })

    // If the view doesn't exist or fails, calculate the summary manually
    if (error) {
      console.log("View not found, calculating summary manually:", error.message)

      // Get all projects
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from("projects")
        .select("id, name, budget, spent, burn_rate")

      if (projectsError) {
        return NextResponse.json({ error: projectsError.message }, { status: 500 })
      }

      // Calculate spending for each project
      const summaryData = []

      for (const project of projects) {
        // Get manday costs
        const { data: roleRates } = await supabaseAdmin
          .from("project_role_rates")
          .select("role, cost_per_manday")
          .eq("project_id", project.id)

        const { data: mandays } = await supabaseAdmin
          .from("mandays")
          .select("role, mandays")
          .eq("project_id", project.id)

        // Calculate manday-based costs
        let mandayCosts = 0
        if (roleRates && mandays) {
          const rateMap = new Map(roleRates.map((r) => [r.role, r.cost_per_manday]))
          mandayCosts = mandays.reduce((sum, m) => {
            const rate = rateMap.get(m.role) || 0
            return sum + m.mandays * rate
          }, 0)
        }

        // Get ledger debits
        const { data: ledgerDebits } = await supabaseAdmin
          .from("project_ledger")
          .select("amount")
          .eq("project_id", project.id)
          .eq("type", "debit")
          .eq("category", "budget")

        const ledgerCosts = ledgerDebits?.reduce((sum, l) => sum + Number(l.amount), 0) || 0

        // Calculate total spent and burn rate
        const totalSpent = mandayCosts + ledgerCosts
        const burnRate = project.budget > 0 ? totalSpent / project.budget : 0

        summaryData.push({
          project_id: project.id,
          project_name: project.name,
          total_spent: totalSpent,
          burn_rate: burnRate,
        })
      }

      data = summaryData
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("Unexpected error in spending summary API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
