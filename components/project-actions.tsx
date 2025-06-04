"use client"

import { useState } from "react"
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProjectForm } from "@/components/project-form"
import { createProject, updateProject, deleteProject } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"

interface ProjectActionsProps {
  onProjectsChange: (projects: any[]) => void
  projects: any[]
  selectedProject?: string
  isLoading?: boolean
}

export function ProjectActions({
  onProjectsChange,
  projects,
  selectedProject,
  isLoading = false,
}: ProjectActionsProps) {
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<any | undefined>(undefined)
  const [processing, setProcessing] = useState(false)

  const handleCreateProject = async (formData: any) => {
    setProcessing(true)
    try {
      // Create the project in Supabase
      const newProject = await createProject(formData)

      if (newProject) {
        // Add the new project to the list
        const updatedProjects = [...projects, newProject]
        onProjectsChange(updatedProjects)

        // Close the dialog and show a success message
        setIsCreateDialogOpen(false)
        toast({
          title: "Project Created",
          description: `${newProject.name} has been created successfully.`,
        })
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleEditProject = async (formData: any) => {
    if (!projectToEdit) return

    setProcessing(true)
    try {
      // Update the project in Supabase
      const updatedProject = await updateProject(projectToEdit.id, formData)

      if (updatedProject) {
        // Replace the old project with the updated one
        const updatedProjects = projects.map((project) => (project.id === projectToEdit.id ? updatedProject : project))

        onProjectsChange(updatedProjects)

        // Close the dialog and show a success message
        setIsEditDialogOpen(false)
        setProjectToEdit(undefined)
        toast({
          title: "Project Updated",
          description: `${updatedProject.name} has been updated successfully.`,
        })
      }
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToEdit) return

    setProcessing(true)
    try {
      // Delete the project from Supabase
      await deleteProject(projectToEdit.id)

      // Remove the project from the list
      const updatedProjects = projects.filter((project) => project.id !== projectToEdit.id)
      onProjectsChange(updatedProjects)

      // Close the dialog and show a success message
      setIsDeleteDialogOpen(false)
      toast({
        title: "Project Deleted",
        description: `${projectToEdit.name} has been deleted.`,
        variant: "destructive",
      })
      setProjectToEdit(undefined)
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const openEditDialog = (project: any) => {
    setProjectToEdit(project)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (project: any) => {
    setProjectToEdit(project)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="sm"
          className="h-8 gap-1"
          disabled={isLoading || processing}
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Button>

        {selectedProject && selectedProject !== "all" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading || processing}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const project = projects.find((p) => p.id === selectedProject)
                  if (project) openEditDialog(project)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  const project = projects.find((p) => p.id === selectedProject)
                  if (project) openDeleteDialog(project)
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to your dashboard. Fill out the form below to create a project.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreateDialogOpen(false)}
            isProcessing={processing}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Make changes to the project details below.</DialogDescription>
          </DialogHeader>
          {projectToEdit && (
            <ProjectForm
              initialData={projectToEdit}
              onSubmit={handleEditProject}
              onCancel={() => setIsEditDialogOpen(false)}
              isProcessing={processing}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project <strong>{projectToEdit?.name}</strong> and all associated mandays
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={processing}
            >
              {processing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
