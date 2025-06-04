"use client"

import { useState } from "react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface UploadMandaysProps {
  projects: any[]
}

export function UploadMandays({ projects }: UploadMandaysProps) {
  const { toast } = useToast()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("2024")

  const handleUpload = async () => {
    if (!csvFile || !projectId) {
      toast({
        title: "Missing Information",
        description: "Please select a project and upload a CSV file.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", csvFile)
      formData.append("projectId", projectId)
      formData.append("year", selectedYear)

      const response = await fetch("https://n8n.gits.id/webhook/upload-csv", {
        method: "POST",
        headers: {
          "x-api-key": "rizky",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to reach n8n webhook")
      }

      const responseData = await response.json()
      console.log("Raw response from n8n:", responseData)

      let mandayData = []

      if (Array.isArray(responseData)) {
        mandayData = responseData
      } else if (typeof responseData === "object" && responseData.data && Array.isArray(responseData.data)) {
        mandayData = responseData.data
      } else {
        throw new Error("Unexpected response format from n8n")
      }

      const validMandayData = mandayData.filter((row) => row.Role && row.Month && row.TotalDuration)

      if (validMandayData.length === 0) {
        throw new Error("No valid data returned from n8n")
      }

      // Process each record individually to avoid upsert issues
      for (const row of validMandayData) {
        const mandayRecord = {
          project_id: projectId,
          role: row.Role,
          month: row.Month,
          year: selectedYear,
          total_hours: Number.parseFloat(row.TotalDuration),
           // Convert hours to mandays (8 hours = 1 manday)
        }

        // Check if record already exists
        const { data: existingData, error: checkError } = await supabase
          .from("mandays")
          .select("id")
          .eq("project_id", mandayRecord.project_id)
          .eq("role", mandayRecord.role)
          .eq("month", mandayRecord.month)
          .maybeSingle()

        if (checkError) {
          console.error("Error checking for existing manday record:", checkError)
          continue
        }

        if (existingData && existingData.id) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("mandays")
            .update({
              total_hours: mandayRecord.total_hours,
              mandays: mandayRecord.mandays,
              year: mandayRecord.year, // Include year in the update
            })
            .eq("id", existingData.id)

          if (updateError) {
            console.error("Error updating manday record:", updateError)
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase.from("mandays").insert(mandayRecord)

          if (insertError) {
            console.error("Error inserting manday record:", insertError)
          }
        }
      }

      toast({
        title: "Upload Successful",
        description: `Successfully processed ${validMandayData.length} records.`,
      })

      setCsvFile(null)
      setProjectId(null)

      const fileInput = document.getElementById("csv-file") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    } catch (err: any) {
      console.error("Upload error:", err)
      toast({
        title: "Upload Failed",
        description: err.message || "There was an error uploading the data.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="project-select" className="text-sm font-medium">
          Select Project
        </label>
        <Select value={projectId || ""} onValueChange={setProjectId}>
          <SelectTrigger id="project-select">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Projects</SelectLabel>
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

      <div className="space-y-2">
        <label htmlFor="csv-file" className="text-sm font-medium">
          Upload CSV File
        </label>
        <Input id="csv-file" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
        <p className="text-xs text-muted-foreground">
          Upload a raw CSV file. n8n will extract Role, Month, and TotalDuration automatically.
        </p>
      </div>

      <Button onClick={handleUpload} disabled={!projectId || !csvFile || uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload CSV & Save Mandays"}
        {!uploading && <Upload className="ml-2 h-4 w-4" />}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p className="font-medium">Info:</p>
        <p>This process uploads raw data. n8n handles all parsing and transformation.</p>
      </div>
    </div>
  )
}
