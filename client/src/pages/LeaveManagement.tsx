import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Plus, Loader2, Check, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPermission, PERMISSIONS } from "@shared/permissions";
import type { ZeoRole } from "../../../drizzle/schema";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  approved_by_principal: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  casual: "Casual Leave", sick: "Sick Leave", annual: "Annual Leave",
  maternity: "Maternity Leave", paternity: "Paternity Leave", duty: "Duty Leave",
  study: "Study Leave", no_pay: "No-Pay Leave", other: "Other",
};

const LEAVE_TYPES = ["casual", "sick", "annual", "maternity", "paternity", "duty", "study", "no_pay", "other"] as const;

function LeaveContent() {
  const { user } = useAuth();
  const userRole = (user?.role ?? "user") as ZeoRole;
  const canApproveSchool = hasPermission(userRole, PERMISSIONS.LEAVE_APPROVE_SCHOOL);
  const canApproveZone = hasPermission(userRole, PERMISSIONS.LEAVE_APPROVE_ZONE);
  const canApply = hasPermission(userRole, PERMISSIONS.LEAVE_APPLY);

  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [search, setSearch] = useState("");
  const [showApply, setShowApply] = useState(false);

  const leaveQuery = trpc.leave.list.useQuery({ page, pageSize, search: search || undefined });
  const approveMut = trpc.leave.approve.useMutation({
    onSuccess: () => { toast.success("Leave approved"); leaveQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectMut = trpc.leave.reject.useMutation({
    onSuccess: () => { toast.success("Leave rejected"); leaveQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const createMut = trpc.leave.create.useMutation({
    onSuccess: () => { toast.success("Leave request submitted"); setShowApply(false); leaveQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const leaves = leaveQuery.data?.data ?? [];
  const total = leaveQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const [form, setForm] = useState({
    leaveType: "casual" as typeof LEAVE_TYPES[number],
    startDate: "", endDate: "", reason: "",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} leave requests &middot; {canApproveSchool || canApproveZone ? "Review and approve leave requests" : "Apply for and track your leave requests"}
          </p>
        </div>
        {canApply && (
          <Button onClick={() => setShowApply(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Apply Leave
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by staff, type, reason, or status..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {leaveQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : leaveQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {leaveQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => leaveQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No leave requests found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {leaves.map((leave: any) => (
              <Card key={leave.id}>
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}</p>
                      <Badge className={`text-[10px] ${STATUS_COLORS[leave.status] ?? ""}`} variant="outline">
                        {leave.status.replace(/_/g, " ")}
                      </Badge>
                      {leave.staffName && <span className="text-xs text-muted-foreground">— {leave.staffName}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{leave.startDate ? new Date(leave.startDate).toLocaleDateString() : "—"} to {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : "—"}</span>
                      <span>{leave.numberOfDays} day(s)</span>
                    </div>
                    {leave.reason && <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{leave.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canApproveSchool && leave.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => approveMut.mutate({ id: leave.id })} disabled={approveMut.isPending}>
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => rejectMut.mutate({ id: leave.id, comment: "Rejected by principal" })} disabled={rejectMut.isPending}>
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {canApproveZone && leave.status === "approved_by_principal" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => approveMut.mutate({ id: leave.id })} disabled={approveMut.isPending}>
                          <Check className="h-3 w-3 mr-1" /> Final Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => rejectMut.mutate({ id: leave.id, comment: "Rejected at zone level" })} disabled={rejectMut.isPending}>
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Apply Leave Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Leave Type *</Label>
              <Select value={form.leaveType} onValueChange={(v: any) => setForm(f => ({ ...f, leaveType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.startDate || !form.endDate} onClick={() => {
              const start = new Date(form.startDate);
              const end = new Date(form.endDate);
              const diffMs = end.getTime() - start.getTime();
              const numberOfDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
              createMut.mutate({
                leaveType: form.leaveType,
                startDate: start,
                endDate: end,
                numberOfDays,
                reason: form.reason || undefined,
              });
            }}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LeaveManagement() {
  return (<DashboardLayout><LeaveContent /></DashboardLayout>);
}
