import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Test the connection by trying to fetch one project
    const { data, error } = await supabaseAdmin.from("projects").select("id").limit(1)

    if (error) {
      console.error("Health check failed:", error)
      return NextResponse.json(
        {
          status: "error",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      message: "Database connection successful",
      projectCount: data?.length || 0,
    })
  } catch (error: any) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
