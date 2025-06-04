import { supabase, formatProjectData, formatProjectForSupabase } from "./supabase"

// Fetch all projects
export async function fetchProjects() {
  try {
    const response = await fetch("/api/projects")
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Projects API error:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.map(formatProjectData)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

// Fetch a single project by ID
export async function fetchProjectById(id: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  return formatProjectData(data)
}

// Create a new project
export async function createProject(project: any) {
  const { data, error } = await supabase.from("projects").insert(formatProjectForSupabase(project)).select()

  if (error) {
    console.error("Error creating project:", error)
    throw error
  }

  return data[0] ? formatProjectData(data[0]) : null
}

// Update an existing project
export async function updateProject(id: string, project: any) {
  if (!id) {
    throw new Error("Project ID is required for update")
  }

  const { data, error } = await supabase
    .from("projects")
    .update(formatProjectForSupabase(project))
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating project:", error)
    throw error
  }

  return data[0] ? formatProjectData(data[0]) : null
}

// Delete a project
export async function deleteProject(id: string) {
  if (!id) {
    throw new Error("Project ID is required for deletion")
  }

  // First delete related mandays records
  const { error: mandaysError } = await supabase.from("mandays").delete().eq("project_id", id)

  if (mandaysError) {
    console.error("Error deleting related mandays:", mandaysError)
    throw mandaysError
  }

  // Then delete the project
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    throw error
  }

  return true
}

// Fetch mandays data for a specific project and month
export async function fetchMandaysByProjectAndMonth(projectId: string, month: string, year: string) {
  try {
    const params = new URLSearchParams({ projectId, month, year })
    const response = await fetch(`/api/mandays?${params}`)
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Mandays API error:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching mandays:", error)
    return []
  }
}

// Fetch aggregated mandays data for all projects by month
export async function fetchAggregatedMandaysByMonth(month: string, year: string) {
  try {
    const params = new URLSearchParams({ projectId: "all", month, year })
    const response = await fetch(`/api/mandays?${params}`)
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Aggregated mandays API error:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    // Aggregate the data by role
    const roleMap = new Map<string, { total_hours: number; mandays: number }>()

    data.forEach((item: any) => {
      const current = roleMap.get(item.role) || { total_hours: 0, mandays: 0 }
      roleMap.set(item.role, {
        total_hours: current.total_hours + item.total_hours,
        mandays: current.mandays + item.mandays,
      })
    })

    // Convert map to array
    return Array.from(roleMap.entries()).map(([role, values]) => ({
      role,
      total_hours: values.total_hours,
      mandays: values.mandays,
    }))
  } catch (error) {
    console.error("Error fetching aggregated mandays:", error)
    return []
  }
}

// Get monthly manday usage for a project or all projects
export async function fetchMonthlyMandayUsage(projectId: string, year: string) {
  try {
    if (!projectId) {
      console.error("Project ID is required for fetchMonthlyMandayUsage")
      return []
    }

    const params = new URLSearchParams({ projectId, year })
    const response = await fetch(`/api/mandays?${params}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Monthly mandays API error: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Group by month and sum mandays
    const monthMap = new Map<string, number>()

    data.forEach((item: any) => {
      const current = monthMap.get(item.month) || 0
      monthMap.set(item.month, current + item.mandays)
    })

    // Convert to the format expected by the chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return months.map((month, index) => {
      const monthNum = String(index + 1).padStart(2, "0")
      return {
        month,
        mandays: monthMap.get(monthNum) || 0,
      }
    })
  } catch (error) {
    console.error("Error fetching monthly manday usage:", error)
    return []
  }
}

// Fetch role chart data without using joins
export async function fetchRoleChartData(projectId: string, month: string, year: string) {
  try {
    if (!projectId || !month || !year) {
      console.error("Project ID, month, and year are required for fetchRoleChartData")
      return []
    }

    const params = new URLSearchParams({ projectId, month, year })
    const response = await fetch(`/api/mandays?${params}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Role chart API error: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Group by role and sum mandays
    const roleMap = new Map<string, number>()

    data.forEach((item: any) => {
      const current = roleMap.get(item.role) || 0
      roleMap.set(item.role, current + item.mandays)
    })

    // Convert map to array and sort by mandays (descending)
    return Array.from(roleMap.entries())
      .map(([role, mandays]) => ({
        role,
        mandays,
      }))
      .sort((a, b) => b.mandays - a.mandays)
  } catch (error) {
    console.error("Error fetching role chart data:", error)
    return []
  }
}

// Get available years from the data
export function getYears() {
  return ["2021", "2022", "2023", "2024", "2025"]
}

// Get available months for the filter
export function getMonths() {
  return [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]
}

// Project Ledger Functions

// Add a transaction to the project ledger
export async function addLedgerTransaction(transaction: {
  project_id: string
  type: "credit" | "debit"
  category: "budget" | "mandays"
  amount: number
  notes?: string
}) {
  try {
    const response = await fetch("/api/ledger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding ledger transaction:", error)
    throw error
  }
}

// Fetch ledger transactions for a project
export async function fetchLedgerTransactions(projectId: string) {
  try {
    const response = await fetch(`/api/ledger?projectId=${projectId}`)
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ledger API error:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching ledger transactions:", error)
    return []
  }
}

// Calculate project totals from ledger
export async function calculateProjectTotals(projectId: string) {
  try {
    const data = await fetchLedgerTransactions(projectId)

    const totals = {
      budget: 0,
      spent: 0,
      mandaysAllocated: 0,
      mandaysConsumed: 0,
    }

    data.forEach((transaction: any) => {
      if (transaction.category === "budget") {
        if (transaction.type === "credit") {
          totals.budget += Number(transaction.amount)
        } else {
          totals.spent += Number(transaction.amount)
        }
      } else if (transaction.category === "mandays") {
        if (transaction.type === "credit") {
          totals.mandaysAllocated += Number(transaction.amount)
        } else {
          totals.mandaysConsumed += Number(transaction.amount)
        }
      }
    })

    return totals
  } catch (error) {
    console.error("Error calculating project totals:", error)
    return {
      budget: 0,
      spent: 0,
      mandaysAllocated: 0,
      mandaysConsumed: 0,
    }
  }
}

// Sync project totals with ledger
export async function syncProjectWithLedger(projectId: string) {
  if (!projectId) {
    throw new Error("Project ID is required for syncing with ledger")
  }

  const totals = await calculateProjectTotals(projectId)

  const { error } = await supabase
    .from("projects")
    .update({
      budget: totals.budget,
      spent: totals.spent,
      mandays_allocated: totals.mandaysAllocated,
      mandays_consumed: totals.mandaysConsumed,
    })
    .eq("id", projectId)

  if (error) {
    console.error("Error syncing project with ledger:", error)
    throw error
  }

  return true
}

// Project Role Rates Functions

// Fetch role rates for a project
export async function fetchProjectRoleRates(projectId: string) {
  try {
    const response = await fetch(`/api/role-rates?projectId=${projectId}`)
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Role rates API error:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching project role rates:", error)
    return []
  }
}

// Add a new role rate - SIMPLIFIED VERSION
export async function addProjectRoleRate(roleRate: {
  project_id: string
  role: string
  cost_per_manday: number
}) {
  try {
    const response = await fetch("/api/role-rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roleRate),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding project role rate:", error)
    throw error
  }
}

// Update an existing role rate
export async function updateProjectRoleRate(
  id: string,
  roleRate: {
    role: string
    cost_per_manday: number
  },
) {
  if (!id) {
    throw new Error("Invalid project role rate ID")
  }

  const { data, error } = await supabase.from("project_role_rates").update(roleRate).eq("id", id).select()

  if (error) {
    console.error("Error updating project role rate:", error)
    throw error
  }

  return data[0]
}

// Delete a role rate
export async function deleteProjectRoleRate(id: string) {
  if (!id) {
    throw new Error("Role rate ID is required for deletion")
  }

  const { error } = await supabase.from("project_role_rates").delete().eq("id", id)

  if (error) {
    console.error("Error deleting project role rate:", error)
    throw error
  }

  return true
}

// Manually trigger project financials update
export async function triggerProjectFinancialsUpdate() {
  // This is a workaround to trigger the database function since we can't call it directly
  // We'll make a dummy update to a mandays record to trigger the function
  const { data: mandaysData, error: mandaysError } = await supabase.from("mandays").select("id").limit(1)

  if (mandaysError || !mandaysData || mandaysData.length === 0) {
    console.error("Error finding mandays record to trigger update:", mandaysError)
    throw mandaysError || new Error("No mandays records found")
  }

  // Get the current record
  const { data: currentRecord, error: fetchError } = await supabase
    .from("mandays")
    .select("*")
    .eq("id", mandaysData[0].id)
    .single()

  if (fetchError) {
    console.error("Error fetching mandays record:", fetchError)
    throw fetchError
  }

  // Update the record with the same values to trigger the function
  const { error: updateError } = await supabase.from("mandays").update(currentRecord).eq("id", mandaysData[0].id)

  if (updateError) {
    console.error("Error triggering project financials update:", updateError)
    throw updateError
  }

  return true
}

// Fetch project spending summary - UPDATED TO USE API ROUTE
export async function fetchProjectSpendingSummary() {
  try {
    console.log("Fetching project spending summary...")
    const response = await fetch("/api/spending-summary")

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Spending summary API error:", errorText)
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Spending summary data received:", data)
    return data
  } catch (error: any) {
    console.error("Error fetching project spending summary:", error)
    throw new Error(error.message || "Failed to fetch project spending summary")
  }
}

// Sum mandays for a specific project and update the project record
export async function updateMandaysConsumedForProject(projectId: string) {
  // Step 1: Get total mandays
  const { data: mandaySumResult, error: fetchError } = await supabase
    .from("mandays")
    .select("mandays", { count: "exact", head: false })
    .eq("project_id", projectId)

  if (fetchError) {
    console.error("Error fetching mandays:", fetchError)
    throw fetchError
  }

  const totalMandays = mandaySumResult?.reduce((sum, record) => sum + (record.mandays || 0), 0)

  // Step 2: Update the project record
  const { error: updateError } = await supabase
    .from("projects")
    .update({ mandays_consumed: totalMandays })
    .eq("id", projectId)

  if (updateError) {
    console.error("Error updating project mandays_consumed:", updateError)
    throw updateError
  }

  return totalMandays
}
