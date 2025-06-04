import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Get all projects first
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("id, name, budget, spent, burn_rate")

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      console.log("No projects found")
      return NextResponse.json([])
    }

    // Calculate spending for each project
    const summaryData = []

    for (const project of projects) {
      try {
        // Initialize totals
        let mandayCosts = 0
        let ledgerCosts = 0

        // Get role rates for this project
        const { data: roleRates, error: rateError } = await supabaseAdmin
          .from("project_role_rates")
          .select("role, cost_per_manday")
          .eq("project_id", project.id)

        if (rateError) {
          console.error(`Error fetching role rates for project ${project.id}:`, rateError)
          // Continue with 0 manday costs
        }

        // Get mandays for this project
        const { data: mandays, error: mandaysError } = await supabaseAdmin
          .from("mandays")
          .select("role, mandays")
          .eq("project_id", project.id)

        if (mandaysError) {
          console.error(`Error fetching mandays for project ${project.id}:`, mandaysError)
          // Continue with 0 manday costs
        }

        // Calculate manday-based costs
        if (roleRates && mandays && roleRates.length > 0 && mandays.length > 0) {
          const rateMap = new Map()
          roleRates.forEach((r) => {
            rateMap.set(r.role, Number(r.cost_per_manday) || 0)
          })

          mandayCosts = mandays.reduce((sum, m) => {
            const rate = rateMap.get(m.role) || 0
            const mandayValue = Number(m.mandays) || 0
            return sum + mandayValue * rate
          }, 0)
        }

        // Get ledger debits for this project
        const { data: ledgerDebits, error: ledgerError } = await supabaseAdmin
          .from("project_ledger")
          .select("amount")
          .eq("project_id", project.id)
          .eq("type", "debit")
          .eq("category", "budget")

        if (ledgerError) {
          console.error(`Error fetching ledger for project ${project.id}:`, ledgerError)
          // Continue with 0 ledger costs
        }

        if (ledgerDebits && ledgerDebits.length > 0) {
          ledgerCosts = ledgerDebits.reduce((sum, l) => {
            return sum + (Number(l.amount) || 0)
          }, 0)
        }

        // Calculate total spent and burn rate
        const totalSpent = mandayCosts + ledgerCosts
        const budget = Number(project.budget) || 0
        const burnRate = budget > 0 ? totalSpent / budget : 0

        summaryData.push({
          project_id: project.id,
          project_name: project.name,
          total_spent: Math.round(totalSpent),
          burn_rate: Number(burnRate.toFixed(4)),
        })
      } catch (projectError) {
        console.error(`Error processing project ${project.id}:`, projectError)
        // Add project with zero values if there's an error
        summaryData.push({
          project_id: project.id,
          project_name: project.name,
          total_spent: 0,
          burn_rate: 0,
        })
      }
    }

    console.log(`Successfully calculated spending for ${summaryData.length} projects`)
    return NextResponse.json(summaryData)
  } catch (error: any) {
    console.error("Unexpected error in spending summary API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
