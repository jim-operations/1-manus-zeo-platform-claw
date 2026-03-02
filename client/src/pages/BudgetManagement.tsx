import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  revised: "bg-yellow-100 text-yellow-800",
};

function BudgetContent() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [yearFilter, setYearFilter] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = trpc.finance.budgets.list.useQuery({
    page,
    pageSize: 20,
    status: statusFilter,
    academicYear: yearFilter,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.finance.budgets.create.useMutation({
    onSuccess: () => {
      toast.success("Budget created successfully");
      utils.finance.budgets.list.invalidate();
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.finance.budgets.update.useMutation({
    onSuccess: () => {
      toast.success("Budget updated");
      utils.finance.budgets.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      academicYear: fd.get("academicYear") as string,
      totalAllocation: Number(fd.get("totalAllocation")),
      schoolId: fd.get("schoolId") ? Number(fd.get("schoolId")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const budgets = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Manage school and zonal budget allocations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Budget</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Academic Year</Label>
                <Input name="academicYear" placeholder="2025/2026" required />
              </div>
              <div>
                <Label>Total Allocation (LKR)</Label>
                <Input name="totalAllocation" type="number" min="0" step="0.01" required />
              </div>
              <div>
                <Label>School ID (optional, leave blank for zonal budget)</Label>
                <Input name="schoolId" type="number" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Budget description or notes..." />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Budget
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Budgets</p>
                <p className="text-2xl font-bold">{data?.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{budgets.filter((b: any) => b.status === "approved").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(
                    budgets.reduce((sum: number, b: any) => sum + Number(b.totalAllocation || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{budgets.filter((b: any) => b.status === "submitted" || b.status === "draft").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter ?? "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Filter by year (e.g. 2025/2026)" className="w-52" value={yearFilter ?? ""} onChange={(e) => { setYearFilter(e.target.value || undefined); setPage(1); }} />
      </div>

      {/* Budget Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Academic Year</th>
                    <th className="text-left p-3 font-medium">School</th>
                    <th className="text-right p-3 font-medium">Total Allocation</th>
                    <th className="text-right p-3 font-medium">Remaining</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No budgets found</td></tr>
                  ) : budgets.map((budget: any) => (
                    <tr key={budget.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{budget.academicYear}</td>
                      <td className="p-3">{budget.schoolId ? `School #${budget.schoolId}` : "Zonal Budget"}</td>
                      <td className="p-3 text-right font-mono">
                        {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(budget.totalAllocation))}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(budget.remainingBalance))}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={STATUS_COLORS[budget.status] ?? "bg-gray-100"}>{budget.status}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        {(budget.status === "draft" || budget.status === "submitted") && (
                          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: budget.id, status: "approved" })}>
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BudgetManagement() {
  return (<DashboardLayout><BudgetContent /></DashboardLayout>);
}
