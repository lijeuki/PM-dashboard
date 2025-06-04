"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { fetchMonthlyMandayUsage } from "@/lib/data-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ProjectChartProps {
  selectedProject: string
  selectedYear: string
}

export function ProjectChart({ selectedProject, selectedYear }: ProjectChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const chartData = await fetchMonthlyMandayUsage(selectedProject, selectedYear)
        setData(chartData)
      } catch (err: any) {
        console.error("Failed to load chart data:", err)
        setError(err.message || "Failed to load chart data")
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedProject, selectedYear])

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <ChartContainer
      config={{
        mandays: {
          label: "Mandays",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="mandays" strokeWidth={2} activeDot={{ r: 6 }} />
      </LineChart>
    </ChartContainer>
  )
}
