"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface ResourceUsageTableProps {
  selectedProject: string
  selectedYear: string
}

export function ResourceUsageTable({ selectedProject, selectedYear }: ResourceUsageTableProps) {
  const { toast } = useToast()
  const [resourceData, setResourceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ]

  const loadResourceData = async () => {
    setLoading(true)
    try {
      // First, get all unique roles for the project
      let roleQuery

      if (selectedProject === "all") {
        roleQuery = supabase.from("mandays").select("role").eq("year", selectedYear).order("role")
      } else {
        roleQuery = supabase
          .from("mandays")
          .select("role")
          .eq("project_id", selectedProject)
          .eq("year", selectedYear)
          .order("role")
      }

      const { data: roleData, error: roleError } = await roleQuery

      if (roleError) {
        throw roleError
      }

      // Get unique roles
      const uniqueRoles = Array.from(new Set(roleData.map((item) => item.role)))

      // For each role, get the mandays for each month
      const resourceUsageData = []

      for (const role of uniqueRoles) {
        // Get role rate
        let rateQuery

        if (selectedProject === "all") {
          // For "all" projects, we'll use the average rate across all projects
          rateQuery = supabase.from("project_role_rates").select("cost_per_manday").eq("role", role)
        } else {
          rateQuery = supabase
            .from("project_role_rates")
            .select("cost_per_manday")
            .eq("project_id", selectedProject)
            .eq("role", role)
        }

        const { data: rateData, error: rateError } = await rateQuery

        // Default rate if not found
        const rate = rateData && rateData.length > 0 ? Number(rateData[0].cost_per_manday) : 0

        // Get mandays for each month
        const monthlyData: Record<string, number> = {}
        let totalMandays = 0

        for (const month of months) {
          let mandaysQuery

          if (selectedProject === "all") {
            mandaysQuery = supabase
              .from("mandays")
              .select("mandays")
              .eq("role", role)
              .eq("month", month.value)
              .eq("year", selectedYear)
          } else {
            mandaysQuery = supabase
              .from("mandays")
              .select("mandays")
              .eq("project_id", selectedProject)
              .eq("role", role)
              .eq("month", month.value)
              .eq("year", selectedYear)
          }

          const { data: mandaysData, error: mandaysError } = await mandaysQuery

          if (mandaysError) {
            throw mandaysError
          }

          // Sum mandays for this month
          const monthTotal = mandaysData.reduce((sum, item) => sum + item.mandays, 0)
          monthlyData[month.value] = monthTotal
          totalMandays += monthTotal
        }

        // Calculate total cost
        const totalCost = totalMandays * rate

        resourceUsageData.push({
          role,
          rate,
          totalMandays,
          totalCost,
          ...monthlyData,
        })
      }

      setResourceData(resourceUsageData)
    } catch (error) {
      console.error("Error loading resource data:", error)
      toast({
        title: "Error",
        description: "Failed to load resource usage data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResourceData()
  }, [selectedProject, selectedYear])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadResourceData()
      toast({
        title: "Data Refreshed",
        description: "Resource usage data has been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Annual Resource Usage ({selectedYear})</CardTitle>
          <CardDescription>Yearly manday usage and cost by role with monthly breakdown</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : resourceData.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No resource usage data found for {selectedYear}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload mandays data and set role rates to see resource usage
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Role</TableHead>
                  {months.map((month) => (
                    <TableHead key={month.value}>{month.label}</TableHead>
                  ))}
                  <TableHead>Total Mandays</TableHead>
                  <TableHead>Unit Rate (IDR)</TableHead>
                  <TableHead>Total Cost (IDR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resourceData.map((item) => (
                  <TableRow key={item.role}>
                    <TableCell className="font-medium sticky left-0 bg-background">{item.role}</TableCell>
                    {months.map((month) => (
                      <TableCell key={month.value}>
                        {item[month.value] ? item[month.value].toFixed(2) : "0.00"}
                      </TableCell>
                    ))}
                    <TableCell className="font-medium">{item.totalMandays.toFixed(2)}</TableCell>
                    <TableCell>{item.rate ? `Rp ${item.rate.toLocaleString()}` : "Not set"}</TableCell>
                    <TableCell className="font-medium">
                      {item.totalCost ? `Rp ${item.totalCost.toLocaleString()}` : "Rp 0"}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Add a summary row at the bottom */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell className="sticky left-0 bg-muted/50">TOTAL</TableCell>
                  {months.map((month) => {
                    const monthTotal = resourceData.reduce((sum, item) => sum + (item[month.value] || 0), 0)
                    return <TableCell key={`total-${month.value}`}>{monthTotal.toFixed(2)}</TableCell>
                  })}
                  <TableCell>{resourceData.reduce((sum, item) => sum + item.totalMandays, 0).toFixed(2)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    Rp {resourceData.reduce((sum, item) => sum + (item.totalCost || 0), 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
