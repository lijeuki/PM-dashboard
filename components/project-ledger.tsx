"use client"

import { useState, useEffect } from "react"
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react"
import { format } from "date-fns"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { addLedgerTransaction, fetchLedgerTransactions, syncProjectWithLedger } from "@/lib/data-service"

interface ProjectLedgerProps {
  projectId: string
  projectName: string
  onUpdate: () => void
}

export function ProjectLedger({ projectId, projectName, onUpdate }: ProjectLedgerProps) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Form state
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit")
  const [category, setCategory] = useState<"budget" | "mandays">("budget")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await fetchLedgerTransactions(projectId)
      setTransactions(data)
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadTransactions()
    }
  }, [projectId])

  const handleAddTransaction = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      })
      return
    }

    try {
      await addLedgerTransaction({
        project_id: projectId,
        type: transactionType,
        category,
        amount: Number(amount),
        notes,
      })

      // Reload transactions
      await loadTransactions()

      // Close dialog and reset form
      setIsAddDialogOpen(false)
      setTransactionType("credit")
      setCategory("budget")
      setAmount("")
      setNotes("")

      toast({
        title: "Transaction Added",
        description: "The transaction has been recorded successfully.",
      })

      // Notify parent component to update
      onUpdate()
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSyncProject = async () => {
    setIsSyncing(true)
    try {
      await syncProjectWithLedger(projectId)
      toast({
        title: "Project Synced",
        description: "Project totals have been updated from the ledger.",
      })
      onUpdate()
    } catch (error) {
      console.error("Error syncing project:", error)
      toast({
        title: "Sync Failed",
        description: "Failed to sync project with ledger. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const formatAmount = (amount: number, category: string) => {
    if (category === "budget") {
      return `Rp ${amount.toLocaleString()}`
    } else {
      return `${amount} mandays`
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Ledger</CardTitle>
          <CardDescription>Transaction history for {projectName}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncProject} disabled={isSyncing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isSyncing ? "Syncing..." : "Sync Totals"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>Record a new budget or mandays transaction for this project.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium">
                      Transaction Type
                    </label>
                    <Select
                      value={transactionType}
                      onValueChange={(value) => setTransactionType(value as "credit" | "debit")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Transaction Type</SelectLabel>
                          <SelectItem value="credit">Credit (Add)</SelectItem>
                          <SelectItem value="debit">Debit (Spend)</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select value={category} onValueChange={(value) => setCategory(value as "budget" | "mandays")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Category</SelectLabel>
                          <SelectItem value="budget">Budget (IDR)</SelectItem>
                          <SelectItem value="mandays">Mandays</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount ({category === "budget" ? "IDR" : "Mandays"})
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={category === "budget" ? "Enter amount in IDR" : "Enter number of mandays"}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes (Optional)
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes here"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTransaction}>Add Transaction</Button>
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
        ) : transactions.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a transaction to start tracking budget and mandays
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {format(new Date(transaction.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          transaction.type === "credit" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }
                      >
                        {transaction.type === "credit" ? (
                          <ArrowUpCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="mr-1 h-3 w-3" />
                        )}
                        {transaction.type === "credit" ? "Credit" : "Debit"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {transaction.category === "budget" ? "Budget" : "Mandays"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatAmount(transaction.amount, transaction.category)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{transaction.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
