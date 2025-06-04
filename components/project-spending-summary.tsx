"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Info, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { fetchProjectSpendingSummary, triggerProjectFinancialsUpdate } from "@/lib/data-service"

export function ProjectSpendingSummary() {
  const { toast } = useToast()
  const [summaryData, setSummaryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummaryData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("Loading spending summary data...")
      const data = await fetchProjectSpendingSummary()
      console.log("Received spending summary data:", data)
      setSummaryData(data || [])
    } catch (error: any) {
      console.error("Error loading spending summary:", error)
      setError(error.message || "Failed to load project spending summary")
      setSummaryData([])
      toast({
        title: "Error",
        description: "Failed to load project spending summary.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummaryData()
  }, [])

  const handleUpdateFinancials = async () => {
    setUpdating(true)
    try {
      await triggerProjectFinancialsUpdate()
      await loadSummaryData()
      toast({
        title: "Update Successful",
        description: "Project financials have been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error updating financials:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update project financials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleRetry = () => {
    loadSummaryData()
  }

  const getBurnRateStatus = (burnRate: number) => {
    if (burnRate > 1) {
      return { label: "Over Budget", className: "bg-red-50 text-red-700" }
    } else if (burnRate > 0.8) {
      return { label: "High", className: "bg-yellow-50 text-yellow-700" }
    } else if (burnRate > 0.5) {
      return { label: "Medium", className: "bg-blue-50 text-blue-700" }
    } else {
      return { label: "Low", className: "bg-green-50 text-green-700" }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <CardTitle>Project Spending Summary</CardTitle>
            <CardDescription>Overview of project spending and burn rates</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Total spent includes both manday-based costs (mandays × role rates) and direct debit transactions from
                  the project ledger.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          {error && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleUpdateFinancials} disabled={updating}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {updating ? "Updating..." : "Update Financials"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              {error}
              <br />
              <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        ) : summaryData.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No spending data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add role rates and mandays data to see spending summary
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm">
                <strong>Note:</strong> Total spent includes both manday-based costs (mandays × role rates) and direct
                debit transactions from the project ledger.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Total Spent (IDR)</TableHead>
                    <TableHead>Burn Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.map((item) => {
                    const burnRateStatus = getBurnRateStatus(item.burn_rate)
                    return (
                      <TableRow key={item.project_id}>
                        <TableCell className="font-medium">{item.project_name}</TableCell>
                        <TableCell>Rp {Number(item.total_spent).toLocaleString()}</TableCell>
                        <TableCell>{(item.burn_rate * 100).toFixed(2)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={burnRateStatus.className}>
                            {burnRateStatus.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
