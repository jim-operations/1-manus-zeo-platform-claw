import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, Banknote } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

function PayrollContent() {
  const [page, setPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const parsedMonth = monthFilter ? Number(monthFilter.split("-")[1]) : undefined;
  const parsedYear = monthFilter ? Number(monthFilter.split("-")[0]) : undefined;
  const { data, isLoading, error } = trpc.finance.salary.list.useQuery({
    page,
    pageSize: 20,
    month: parsedMonth,
    year: parsedYear,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.finance.salary.create.useMutation({
    onSuccess: () => {
      toast.success("Salary record created");
      utils.finance.salary.list.invalidate();
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const monthStr = fd.get("month") as string; // format: YYYY-MM
    const [yearStr, monStr] = monthStr.split("-");
    createMutation.mutate({
      staffId: Number(fd.get("staffId")),
      month: Number(monStr),
      year: Number(yearStr),
      grossPay: Number(fd.get("basicSalary")),
      epfDeduction: Number(fd.get("deductions") || 0),
      otherDeductions: Number(fd.get("allowances") || 0),
      netPay: Number(fd.get("netSalary")),
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const records = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Manage salary records and payslips</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Salary Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Salary Record</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Staff ID</Label>
                <Input name="staffId" type="number" required />
              </div>
              <div>
                <Label>Month (YYYY-MM)</Label>
                <Input name="month" type="month" required />
              </div>
              <div>
                <Label>Basic Salary (LKR)</Label>
                <Input name="basicSalary" type="number" min="0" step="0.01" required />
              </div>
              <div>
                <Label>Allowances (LKR)</Label>
                <Input name="allowances" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
              <div>
                <Label>Deductions (LKR)</Label>
                <Input name="deductions" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
              <div>
                <Label>Net Salary (LKR)</Label>
                <Input name="netSalary" type="number" min="0" step="0.01" required />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input type="month" className="w-48" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }} />
      </div>

      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Banknote className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Net Payroll</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(
                      records.reduce((sum: number, r: any) => sum + Number(r.netPay || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Gross Pay</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(
                    records.reduce((sum: number, r: any) => sum + Number(r.grossPay || 0), 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(
                    records.reduce((sum: number, r: any) => sum + Number(r.epfDeduction || 0) + Number(r.taxDeduction || 0) + Number(r.otherDeductions || 0), 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Salary Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Staff ID</th>
                    <th className="text-left p-3 font-medium">Month</th>
                    <th className="text-right p-3 font-medium">Basic Salary</th>
                    <th className="text-right p-3 font-medium">Allowances</th>
                    <th className="text-right p-3 font-medium">Deductions</th>
                    <th className="text-right p-3 font-medium">Net Salary</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No salary records found</td></tr>
                  ) : records.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">#{r.staffId}</td>
                      <td className="p-3 font-medium">{r.month}</td>
                      <td className="p-3 text-right font-mono">{new Intl.NumberFormat("en-LK").format(Number(r.grossPay || 0))}</td>
                      <td className="p-3 text-right font-mono text-green-700">+{new Intl.NumberFormat("en-LK").format(Number(r.etfDeduction || 0))}</td>
                      <td className="p-3 text-right font-mono text-red-700">−{new Intl.NumberFormat("en-LK").format(Number(r.epfDeduction || 0) + Number(r.taxDeduction || 0) + Number(r.otherDeductions || 0))}</td>
                      <td className="p-3 text-right font-mono font-bold">{new Intl.NumberFormat("en-LK").format(Number(r.netPay || 0))}</td>
                      <td className="p-3 capitalize">{r.status || "processed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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

export default function Payroll() {
  return (<DashboardLayout><PayrollContent /></DashboardLayout>);
}
