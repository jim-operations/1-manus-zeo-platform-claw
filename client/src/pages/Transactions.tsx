import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const CATEGORIES = ["salary", "stationery", "maintenance", "utilities", "transport", "equipment", "training", "grants", "fees", "donations", "other"] as const;

function TransactionsContent() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = trpc.finance.transactions.list.useQuery({
    page,
    pageSize: 20,
    type: typeFilter,
    category: categoryFilter,
    search: searchTerm || undefined,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.finance.transactions.create.useMutation({
    onSuccess: () => {
      toast.success("Transaction recorded successfully");
      utils.finance.transactions.list.invalidate();
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      budgetId: Number(fd.get("budgetId")),
      type: fd.get("type") as "income" | "expenditure",
      category: fd.get("category") as typeof CATEGORIES[number],
      amount: Number(fd.get("amount")),
      description: fd.get("description") as string,
      referenceNumber: (fd.get("referenceNumber") as string) || undefined,
      transactionDate: new Date(fd.get("transactionDate") as string),
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const transactions = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Record and track income and expenditure</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Record Transaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Budget ID</Label>
                <Input name="budgetId" type="number" required />
              </div>
              <div>
                <Label>Type</Label>
                <select name="type" className="w-full border rounded-md p-2" required>
                  <option value="income">Income</option>
                  <option value="expenditure">Expenditure</option>
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <select name="category" className="w-full border rounded-md p-2" required>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Amount (LKR)</Label>
                <Input name="amount" type="number" min="1" step="0.01" required />
              </div>
              <div>
                <Label>Description</Label>
                <Input name="description" required />
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input name="referenceNumber" placeholder="Optional" />
              </div>
              <div>
                <Label>Transaction Date</Label>
                <Input name="transactionDate" type="date" required />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search description..." className="w-60" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
        <Select value={typeFilter ?? "all"} onValueChange={(v) => { setTypeFilter(v === "all" ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expenditure">Expenditure</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter ?? "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">Reference</th>
                    <th className="text-right p-3 font-medium">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found</td></tr>
                  ) : transactions.map((t: any) => (
                    <tr key={t.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">{new Date(t.transactionDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {t.type === "income" ? <ArrowUpCircle className="w-4 h-4 text-green-600" /> : <ArrowDownCircle className="w-4 h-4 text-red-600" />}
                          <Badge variant={t.type === "income" ? "default" : "destructive"}>{t.type}</Badge>
                        </div>
                      </td>
                      <td className="p-3 capitalize">{t.category}</td>
                      <td className="p-3">{t.description}</td>
                      <td className="p-3 text-muted-foreground">{t.referenceNumber || "—"}</td>
                      <td className={`p-3 text-right font-mono ${t.type === "income" ? "text-green-700" : "text-red-700"}`}>
                        {t.type === "income" ? "+" : "−"}{new Intl.NumberFormat("en-LK").format(Number(t.amount))}
                      </td>
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

export default function Transactions() {
  return (<DashboardLayout><TransactionsContent /></DashboardLayout>);
}
