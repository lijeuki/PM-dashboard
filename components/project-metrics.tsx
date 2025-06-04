"use client"

import { useEffect, useState } from "react"
import { Clock, DollarSign, BarChart, AlertCircle, Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchProjectSpendingSummary, updateMandaysConsumedForProject } from "@/lib/data-service"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ProjectMetricsProps {
  selectedProject: string
  projects: any[]
  isLoading?: boolean
  onRefresh?: number
}

export function ProjectMetrics({ selectedProject, projects, isLoading = false, onRefresh }: ProjectMetricsProps) {
  const { toast } = useToast() // Add this line to properly initialize toast
  const [spendingData, setSpendingData] = useState<any[]>([])
  const [loadingSpending, setLoadingSpending] = useState(false)
  const [updatingMandays, setUpdatingMandays] = useState(false) // Add state for update button

  useEffect(() => {
    const loadSpendingData = async () => {
      setLoadingSpending(true)
      try {
        const data = await fetchProjectSpendingSummary()
        setSpendingData(data)
      } catch (error) {
        console.error("Error loading spending data:", error)
      } finally {
        setLoadingSpending(false)
      }
    }

    loadSpendingData()
  }, [onRefresh])

  // Add a handler for updating mandays
  const handleUpdateMandays = async (projectId: string) => {
    setUpdatingMandays(true)
    try {
      const total = await updateMandaysConsumedForProject(projectId)
      toast({
        title: "Success",
        description: `Mandays updated to ${total}.`,
      })
    } catch (err) {
      console.error("Error updating mandays:", err)
      toast({
        title: "Error",
        description: "Failed to update mandays.",
        variant: "destructive",
      })
    } finally {
      setUpdatingMandays(false)
    }
  }

  if (isLoading || loadingSpending) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  // If "all" is selected, show summary metrics
  if (selectedProject === "all") {
    // Calculate totals from spending data
    const totalBudget = projects.reduce((acc, project) => acc + project.budget, 0)
    const totalSpent = spendingData.reduce((acc, item) => acc + Number(item.total_spent), 0)
    const avgBurnRate =
      spendingData.length > 0
        ? (spendingData.reduce((acc, item) => acc + Number(item.burn_rate), 0) / spendingData.length).toFixed(2)
        : "0"
    const totalMandays = projects.reduce((acc, project) => acc + project.mandaysConsumed, 0)

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 mr-1">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Total spent includes both manday-based costs (mandays × role rates) and direct debit transactions
                      from the project ledger.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Rp {totalSpent.toLocaleString()} spent (
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0"}%)
            </p>
            <Progress className="mt-2" value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Burn Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgBurnRate}%</div>
            <p className="text-xs text-muted-foreground">Per month across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mandays</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMandays}</div>
            <p className="text-xs text-muted-foreground">Across all projects (1 manday = 8 hours)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                {projects.filter((p) => p.status === "active").length} Active
              </Badge>
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700"
              >
                {projects.filter((p) => p.status === "on-hold").length} On Hold
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                {projects.filter((p) => p.status === "at-risk").length} At Risk
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700">
                {projects.filter((p) => p.status === "completed").length} Completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show specific project metrics
  const project = projects.find((p) => p.id === selectedProject)

  if (!project) {
    return <div>Project not found</div>
  }

  // Find the spending data for this project
  const projectSpending = spendingData.find((item) => item.project_id === project.id)

  // Use spending data if available, otherwise use project data
  const budget = project.budget
  const spent = projectSpending ? Number(projectSpending.total_spent) : project.spent
  const burnRate = projectSpending ? Number(projectSpending.burn_rate) * 100 : project.burnRate
  const mandaysAllocated = project.mandaysAllocated
  const mandaysConsumed = project.mandaysConsumed

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
      case "on-hold":
        return "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700"
      case "at-risk":
        return "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700"
      case "completed":
        return "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
      default:
        return ""
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{project.name}</CardTitle>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("-", " ")}
            </Badge>
          </div>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start Date:</span>
              <span>{project.startDate || "Not set"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End Date:</span>
              <span>{project.endDate || "Not set"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Department:</span>
              <span>{project.department || "Not specified"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 mr-1">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Total spent includes both manday-based costs (mandays × role rates) and direct debit transactions
                    from the project ledger.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {budget.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Rp {spent.toLocaleString()} spent ({budget > 0 ? ((spent / budget) * 100).toFixed(1) : "0"}%)
          </p>
          <Progress className="mt-2" value={budget > 0 ? (spent / budget) * 100 : 0} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{burnRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Per month</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Mandays Consumed</CardTitle>
            </div>
            <Button size="sm" onClick={() => handleUpdateMandays(project.id)} disabled={updatingMandays}>
              {updatingMandays ? "Updating..." : "Update"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mandaysConsumed}</div>
          <p className="text-xs text-muted-foreground">Out of {mandaysAllocated} allocated (1 manday = 8 hours)</p>
          <Progress className="mt-2" value={mandaysAllocated > 0 ? (mandaysConsumed / mandaysAllocated) * 100 : 0} />
        </CardContent>
      </Card>
    </div>
  )
}
