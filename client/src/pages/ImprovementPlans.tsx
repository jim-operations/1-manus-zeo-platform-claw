import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, Target, TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

function ImprovementPlansContent() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState<any>(null);

  const { data, isLoading, error } = trpc.supervision.plans.list.useQuery({
    page,
    pageSize: 20,
    status: statusFilter,
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.supervision.plans.create.useMutation({
    onSuccess: () => {
      toast.success("Improvement plan created");
      utils.supervision.plans.list.invalidate();
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.supervision.plans.update.useMutation({
    onSuccess: () => {
      toast.success("Plan updated");
      utils.supervision.plans.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const recsText = fd.get("recommendations") as string;
    const recs = recsText.split("\n").filter(Boolean).map((line, idx) => ({
      id: `rec-${idx + 1}`,
      action: line.trim(),
      responsible: "TBD",
      deadline: "TBD",
      status: "pending",
      progress: 0,
    }));
    createMutation.mutate({
      schoolId: Number(fd.get("schoolId")),
      inspectionId: fd.get("inspectionId") ? Number(fd.get("inspectionId")) : null,
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      recommendations: recs,
      startDate: fd.get("startDate") ? new Date(fd.get("startDate") as string) : undefined,
      targetDate: fd.get("targetDate") ? new Date(fd.get("targetDate") as string) : undefined,
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const plans = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const stats = useMemo(() => {
    return {
      total: plans.length,
      active: plans.filter((p: any) => p.status === "active").length,
      completed: plans.filter((p: any) => p.status === "completed").length,
      overdue: plans.filter((p: any) => p.status === "overdue").length,
      avgProgress: plans.length > 0 ? plans.reduce((sum: number, p: any) => sum + (p.overallProgress || 0), 0) / plans.length : 0,
    };
  }, [plans]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">School Improvement Plans</h1>
          <p className="text-muted-foreground">Track and manage school improvement initiatives</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Improvement Plan</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>School ID</Label>
                <Input name="schoolId" type="number" required placeholder="Enter school ID" />
              </div>
              <div>
                <Label>Linked Inspection ID (optional)</Label>
                <Input name="inspectionId" type="number" placeholder="If linked to an inspection" />
              </div>
              <div>
                <Label>Title</Label>
                <Input name="title" required placeholder="e.g. Academic Performance Improvement 2026" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" rows={2} placeholder="Brief description of the plan..." />
              </div>
              <div>
                <Label>Recommendations (one per line)</Label>
                <Textarea name="recommendations" rows={4} required placeholder="Improve science lab equipment&#10;Hire additional English teachers&#10;Conduct teacher training workshops" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input name="startDate" type="date" />
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Input name="targetDate" type="date" />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Plan
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
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter ?? "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No improvement plans found. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan: any) => {
            const recs = Array.isArray(plan.recommendations) ? plan.recommendations : [];
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        School #{plan.schoolId}
                        {plan.inspectionId && ` · Inspection #${plan.inspectionId}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[plan.status] || "bg-gray-100 text-gray-800"}>
                        {plan.status}
                      </Badge>
                    </div>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Overall Progress</span>
                        <span className="text-xs font-medium">{plan.overallProgress || 0}%</span>
                      </div>
                      <Progress value={plan.overallProgress || 0} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {recs.length} recommendation{recs.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {plan.startDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Start: {new Date(plan.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {plan.targetDate && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Target: {new Date(plan.targetDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {plan.status === "active" && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: plan.id, overallProgress: Math.min((plan.overallProgress || 0) + 10, 100) })}>
                        +10% Progress
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: plan.id, status: "completed", overallProgress: 100 })}>
                        Mark Complete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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

export default function ImprovementPlans() {
  return (<DashboardLayout><ImprovementPlansContent /></DashboardLayout>);
}
