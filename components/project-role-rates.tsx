"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  fetchProjectRoleRates,
  updateProjectRoleRate,
  deleteProjectRoleRate,
  triggerProjectFinancialsUpdate,
  addProjectRoleRate,
} from "@/lib/data-service"

interface ProjectRoleRatesProps {
  projectId: string
  projectName: string
  onUpdate: () => void
}

export function ProjectRoleRates({ projectId, projectName, onUpdate }: ProjectRoleRatesProps) {
  const { toast } = useToast()
  const [roleRates, setRoleRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roleRateToEdit, setRoleRateToEdit] = useState<any | null>(null)
  const [roleRateToDelete, setRoleRateToDelete] = useState<any | null>(null)
  const [processing, setProcessing] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Form state
  const [role, setRole] = useState("")
  const [costPerManday, setCostPerManday] = useState("")

  const loadRoleRates = async () => {
    setLoading(true)
    try {
      const data = await fetchProjectRoleRates(projectId)
      setRoleRates(data)
    } catch (error) {
      console.error("Error loading role rates:", error)
      toast({
        title: "Error",
        description: "Failed to load role rates.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadRoleRates()
    }
  }, [projectId])

  const handleAddRoleRate = async () => {
    if (!role) {
      toast({
        title: "Missing Role",
        description: "Please enter a role name.",
        variant: "destructive",
      })
      return
    }

    if (!costPerManday || isNaN(Number(costPerManday)) || Number(costPerManday) <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid positive number for cost per manday.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      // Use the original function name
      await addProjectRoleRate({
        project_id: projectId,
        role,
        cost_per_manday: Number(costPerManday),
      })

      // Reload role rates
      await loadRoleRates()

      // Close dialog and reset form
      setIsAddDialogOpen(false)
      setRole("")
      setCostPerManday("")

      toast({
        title: "Role Rate Added",
        description: `Role rate for ${role} has been added successfully.`,
      })

      // Notify parent component to update
      onUpdate()
    } catch (error: any) {
      console.error("Error adding role rate:", error)
      toast({
        title: "Error",
        description: "Failed to add role rate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleEditRoleRate = async () => {
    if (!roleRateToEdit) return

    if (!role) {
      toast({
        title: "Missing Role",
        description: "Please enter a role name.",
        variant: "destructive",
      })
      return
    }

    if (!costPerManday || isNaN(Number(costPerManday)) || Number(costPerManday) <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Please enter a valid positive number for cost per manday.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      await updateProjectRoleRate(roleRateToEdit.id, {
        role,
        cost_per_manday: Number(costPerManday),
      })

      // Reload role rates
      await loadRoleRates()

      // Close dialog and reset form
      setIsEditDialogOpen(false)
      setRoleRateToEdit(null)
      setRole("")
      setCostPerManday("")

      toast({
        title: "Role Rate Updated",
        description: `Role rate for ${role} has been updated successfully.`,
      })

      // Notify parent component to update
      onUpdate()
    } catch (error) {
      console.error("Error updating role rate:", error)
      toast({
        title: "Error",
        description: "Failed to update role rate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteRoleRate = async () => {
    if (!roleRateToDelete) return

    setProcessing(true)
    try {
      await deleteProjectRoleRate(roleRateToDelete.id)

      // Reload role rates
      await loadRoleRates()

      // Close dialog and reset form
      setIsDeleteDialogOpen(false)
      setRoleRateToDelete(null)

      toast({
        title: "Role Rate Deleted",
        description: `Role rate for ${roleRateToDelete.role} has been deleted.`,
        variant: "destructive",
      })

      // Notify parent component to update
      onUpdate()
    } catch (error) {
      console.error("Error deleting role rate:", error)
      toast({
        title: "Error",
        description: "Failed to delete role rate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const openEditDialog = (roleRate: any) => {
    setRoleRateToEdit(roleRate)
    setRole(roleRate.role)
    setCostPerManday(roleRate.cost_per_manday.toString())
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (roleRate: any) => {
    setRoleRateToDelete(roleRate)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateFinancials = async () => {
    setUpdating(true)
    try {
      await triggerProjectFinancialsUpdate()
      toast({
        title: "Update Triggered",
        description: "Project financials update has been triggered successfully.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error triggering financials update:", error)
      toast({
        title: "Update Failed",
        description: "Failed to trigger project financials update. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Role Rates</CardTitle>
          <CardDescription>Manage cost per manday for each role in {projectName}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUpdateFinancials} disabled={updating}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {updating ? "Updating..." : "Update Financials"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Role Rate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Role Rate</DialogTitle>
                <DialogDescription>Add a new role rate for this project.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., Developer, Designer, PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerManday">Cost Per Manday (IDR)</Label>
                  <Input
                    id="costPerManday"
                    type="number"
                    value={costPerManday}
                    onChange={(e) => setCostPerManday(e.target.value)}
                    placeholder="Enter cost per manday"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={processing}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoleRate} disabled={processing}>
                  {processing ? "Adding..." : "Add Role Rate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : roleRates.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No role rates found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add role rates to calculate project costs based on mandays
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Cost Per Manday (IDR)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleRates.map((roleRate) => (
                  <TableRow key={roleRate.id}>
                    <TableCell className="font-medium">{roleRate.role}</TableCell>
                    <TableCell>Rp {Number(roleRate.cost_per_manday).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(roleRate)}
                          disabled={processing}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(roleRate)}
                          disabled={processing}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Role Rate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role Rate</DialogTitle>
            <DialogDescription>Update the role rate details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Developer, Designer, PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costPerManday">Cost Per Manday (IDR)</Label>
              <Input
                id="edit-costPerManday"
                type="number"
                value={costPerManday}
                onChange={(e) => setCostPerManday(e.target.value)}
                placeholder="Enter cost per manday"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleEditRoleRate} disabled={processing}>
              {processing ? "Updating..." : "Update Role Rate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Role Rate Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role rate for <strong>{roleRateToDelete?.role}</strong>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoleRate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={processing}
            >
              {processing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
