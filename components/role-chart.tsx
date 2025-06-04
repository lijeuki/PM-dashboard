"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchRoleChartData } from "@/lib/data-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface RoleChartProps {
  selectedProject: string
  selectedMonth: string
  selectedYear: string
}

export function RoleChart({ selectedProject, selectedMonth, selectedYear }: RoleChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const roleData = await fetchRoleChartData(selectedProject, selectedMonth, selectedYear)
        setData(roleData)
      } catch (err: any) {
        console.error("Failed to load role data:", err)
        setError(err.message || "Failed to load role data")
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedProject, selectedMonth, selectedYear])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Role Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const monthName = new Date(
    Date.UTC(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) - 1, 1),
  ).toLocaleString("default", { month: "long" })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manday Usage by Role</CardTitle>
        <CardDescription>
          Resource allocation across different roles for {monthName} {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="role"
                tick={{ fill: "#888888", fontSize: 12 }}
                tickLine={{ stroke: "#888888" }}
                axisLine={{ stroke: "#888888" }}
                height={60}
                label={{
                  value: "Role",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#888888",
                }}
              />
              <YAxis
                tick={{ fill: "#888888", fontSize: 12 }}
                tickLine={{ stroke: "#888888" }}
                axisLine={{ stroke: "#888888" }}
                width={80}
                label={{
                  value: "Mandays",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#888888",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "10px",
                }}
                formatter={(value: any) => [`${value} mandays`, "Usage"]}
                labelFormatter={(label) => `Role: ${label}`}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                dataKey="mandays"
                name="Mandays Used"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
