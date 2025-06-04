"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectActions } from "@/components/project-actions"
import { ProjectChart } from "@/components/project-chart"
import { RoleChart } from "@/components/role-chart"
import { ProjectMetrics } from "@/components/project-metrics"
import { ProjectSpendingSummary } from "@/components/project-spending-summary"
import { ProjectLedger } from "@/components/project-ledger"
import { ResourceUsageTable } from "@/components/resource-usage-table"
import { UploadMandays } from "@/components/upload-mandays"
import { ProjectRoleRates } from "@/components/project-role-rates"
import { RLSDiagnostics } from "@/components/rls-diagnostics"
import { fetchProjects } from "@/lib/data-service"
import { Toaster } from "@/components/ui/toaster"

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("04")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true)
      try {
        const fetchedProjects = await fetchProjects()
        setProjects(fetchedProjects)
      } catch (error) {
        console.error("Failed to load projects:", error)
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [refreshKey])

  const handleProjectsChange = (updatedProjects: any[]) => {
    setProjects(updatedProjects)
  }

  const handleProjectUpdate = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  const handleDownloadReport = async () => {
    const dashboard = document.getElementById("dashboard-content")
    if (!dashboard) {
      console.error("Dashboard content not found")
      return
    }

    try {
      // Convert the dashboard content to a canvas
      const canvas = await html2canvas(dashboard, {
        scale: 1, // Set scale to 1 to avoid blurry images
        useCORS: true, // Enable CORS to load images from different domains
      })

      // Convert the canvas to a data URL
      const imgData = canvas.toDataURL("image/png")

      // Create a new PDF document
      const pdf = new jsPDF("p", "mm", "a4")
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)

      // Save the PDF
      pdf.save("dashboard-report.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  // Find the selected project
  const project = selectedProject !== "all" ? projects.find((p) => p.id === selectedProject) : null

  return (
    <div className="container relative pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage project finances, track resource usage, and monitor spending.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadReport} size="sm" className="h-8 gap-1">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
          <ProjectActions
            onProjectsChange={handleProjectsChange}
            projects={projects}
            selectedProject={selectedProject}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <div className="mt-4" id="dashboard-content">
          <div className="grid gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Customize the data displayed on the dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="project-select" className="text-sm font-medium">
                    Select Project
                  </label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger id="project-select">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Projects</SelectLabel>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="month-select" className="text-sm font-medium">
                    Select Month
                  </label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month-select">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Month</SelectLabel>
                        {[
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
                        ].map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="year-select" className="text-sm font-medium">
                    Select Year
                  </label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select">
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Year</SelectLabel>
                        {["2021", "2022", "2023", "2024", "2025"].map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="overview" className="grid gap-4">
            <ProjectMetrics
              selectedProject={selectedProject}
              projects={projects}
              isLoading={isLoading}
              onRefresh={refreshKey}
            />
            <ProjectChart selectedProject={selectedProject} selectedYear={selectedYear} />
            <RoleChart selectedProject={selectedProject} selectedMonth={selectedMonth} selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="resources" className="grid gap-4">
            <ResourceUsageTable selectedProject={selectedProject} selectedYear={selectedYear} />
            {selectedProject !== "all" && project && (
              <ProjectRoleRates projectId={selectedProject} projectName={project.name} onUpdate={handleProjectUpdate} />
            )}
          </TabsContent>

          <TabsContent value="finances" className="grid gap-4">
            <ProjectSpendingSummary />
            {selectedProject !== "all" && project && (
              <ProjectLedger projectId={selectedProject} projectName={project.name} onUpdate={handleProjectUpdate} />
            )}
          </TabsContent>

          <TabsContent value="upload" className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Mandays Data</CardTitle>
                <CardDescription>Upload a CSV file to update mandays data for a project.</CardDescription>
              </CardHeader>
              <CardContent>
                <UploadMandays projects={projects} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="grid gap-4">
            <RLSDiagnostics />
          </TabsContent>
        </div>
      </Tabs>
      <Toaster />
    </div>
  )
}
