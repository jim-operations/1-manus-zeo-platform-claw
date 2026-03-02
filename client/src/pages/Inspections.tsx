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
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, ClipboardCheck, Calendar, Eye, CheckCircle2, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function InspectionsContent() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  const { data, isLoading, error } = trpc.supervision.inspections.list.useQuery({
    page,
    pageSize: 20,
    status: statusFilter,
  });

  const templatesQuery = trpc.supervision.templates.list.useQuery({ page: 1, pageSize: 100 });
  const templates = templatesQuery.data?.items ?? [];

  const utils = trpc.useUtils();

  const scheduleMutation = trpc.supervision.inspections.schedule.useMutation({
    onSuccess: () => {
      toast.success("Inspection scheduled successfully");
      utils.supervision.inspections.list.invalidate();
      setScheduleDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const submitMutation = trpc.supervision.inspections.submit.useMutation({
    onSuccess: () => {
      toast.success("Inspection report submitted");
      utils.supervision.inspections.list.invalidate();
      setSubmitDialogOpen(false);
      setSelectedInspection(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const acknowledgeMutation = trpc.supervision.inspections.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Inspection acknowledged");
      utils.supervision.inspections.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    scheduleMutation.mutate({
      schoolId: Number(fd.get("schoolId")),
      templateId: Number(fd.get("templateId")),
      scheduledDate: new Date(fd.get("scheduledDate") as string),
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInspection) return;
    const fd = new FormData(e.currentTarget);
    submitMutation.mutate({
      id: selectedInspection.id,
      formData: {},
      overallScore: Number(fd.get("overallScore")),
      summary: (fd.get("summary") as string) || undefined,
      recommendations: (fd.get("recommendations") as string) || undefined,
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const inspections = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  // Summary stats
  const stats = useMemo(() => {
    const all = inspections;
    return {
      total: all.length,
      scheduled: all.filter((i: any) => i.status === "scheduled").length,
      completed: all.filter((i: any) => i.status === "completed").length,
      avgScore: all.filter((i: any) => i.overallScore).reduce((sum: number, i: any) => sum + (i.overallScore || 0), 0) / (all.filter((i: any) => i.overallScore).length || 1),
    };
  }, [inspections]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">School Inspections</h1>
          <p className="text-muted-foreground">Schedule, conduct, and review school inspections</p>
        </div>
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Schedule Inspection</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Schedule New Inspection</DialogTitle></DialogHeader>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <Label>School ID</Label>
                <Input name="schoolId" type="number" required placeholder="Enter school ID" />
              </div>
              <div>
                <Label>Inspection Template</Label>
                <Select name="templateId" required>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                    {templates.length === 0 && (
                      <SelectItem value="1" disabled>No templates available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input name="scheduledDate" type="date" required />
              </div>
              <Button type="submit" disabled={scheduleMutation.isPending} className="w-full">
                {scheduleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Schedule Inspection
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
              <ClipboardCheck className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Inspections</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
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
            <div>
              <p className="text-sm text-muted-foreground">Avg. Score</p>
              <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</p>
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inspections Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">School</th>
                    <th className="text-left p-3 font-medium">Scheduled Date</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Acknowledged</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No inspections found</td></tr>
                  ) : inspections.map((insp: any) => (
                    <tr key={insp.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-mono">#{insp.id}</td>
                      <td className="p-3">School #{insp.schoolId}</td>
                      <td className="p-3">{insp.scheduledDate ? new Date(insp.scheduledDate).toLocaleDateString() : "—"}</td>
                      <td className="p-3">
                        <Badge className={STATUS_COLORS[insp.status] || "bg-gray-100 text-gray-800"}>
                          {insp.status?.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono">{insp.overallScore != null ? `${insp.overallScore}%` : "—"}</td>
                      <td className="p-3">
                        {insp.principalAcknowledged ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-3 space-x-1">
                        {insp.status === "scheduled" && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedInspection(insp); setSubmitDialogOpen(true); }}>
                            Submit Report
                          </Button>
                        )}
                        {insp.status === "completed" && !insp.principalAcknowledged && (
                          <Button size="sm" variant="outline" onClick={() => acknowledgeMutation.mutate({ id: insp.id })}>
                            Acknowledge
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

      {/* Submit Report Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={(open) => { setSubmitDialogOpen(open); if (!open) setSelectedInspection(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Inspection Report</DialogTitle></DialogHeader>
          {selectedInspection && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Overall Score (0-100)</Label>
                <Input name="overallScore" type="number" min="0" max="100" required placeholder="e.g. 85" />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea name="summary" rows={3} placeholder="Brief summary of findings..." />
              </div>
              <div>
                <Label>Recommendations</Label>
                <Textarea name="recommendations" rows={3} placeholder="Key recommendations..." />
              </div>
              <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Report
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

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

export default function Inspections() {
  return (<DashboardLayout><InspectionsContent /></DashboardLayout>);
}
