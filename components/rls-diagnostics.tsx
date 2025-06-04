"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { checkRLSAccess } from "@/lib/check-rls"

export function RLSDiagnostics() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const accessResults = await checkRLSAccess()
      setResults(accessResults)
    } catch (error) {
      console.error("Error running diagnostics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RLS Diagnostics</CardTitle>
        <CardDescription>Check if Row Level Security is affecting data access</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? "Running Diagnostics..." : "Run Diagnostics"}
        </Button>

        {results && (
          <div className="mt-4 space-y-4">
            <Alert variant={Object.values(results).some((r) => !r.success) ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>RLS Diagnostic Results</AlertTitle>
              <AlertDescription>
                {Object.values(results).every((r) => r.success)
                  ? "All tables are accessible. If you're still not seeing data, check your queries and RLS policies."
                  : "Some tables are not accessible due to RLS policies. Review your policies or use the service role for admin operations."}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {Object.entries(results).map(([table, result]: [string, any]) => (
                <div key={table} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{table}</span>
                  <div className="flex items-center">
                    {result.success ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-500">Accessible</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-500">Blocked: {result.error}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
