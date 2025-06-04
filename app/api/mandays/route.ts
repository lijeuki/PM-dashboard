import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    let query = supabaseAdmin.from("mandays").select("*")

    // Apply filters
    if (projectId !== "all") {
      query = query.eq("project_id", projectId)
    }
    if (month) {
      query = query.eq("month", month)
    }
    if (year) {
      query = query.eq("year", year)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching mandays:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("Unexpected error in mandays API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
