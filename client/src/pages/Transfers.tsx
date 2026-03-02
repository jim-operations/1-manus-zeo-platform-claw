import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowRightLeft, Plus, Loader2, Check, X, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPermission, PERMISSIONS } from "@shared/permissions";
import type { ZeoRole } from "../../../drizzle/schema";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", pending: "bg-yellow-100 text-yellow-800",
  recommended_by_principal: "bg-blue-100 text-blue-800", reviewed_by_branch: "bg-indigo-100 text-indigo-800",
  approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
};

function TransfersContent() {
  const { user } = useAuth();
  const userRole = (user?.role ?? "user") as ZeoRole;
  const canApprove = hasPermission(userRole, PERMISSIONS.TRANSFER_APPROVE);
  const canReview = hasPermission(userRole, PERMISSIONS.TRANSFER_REVIEW);
  const canRecommend = hasPermission(userRole, PERMISSIONS.TRANSFER_RECOMMEND);
  const canApply = hasPermission(userRole, PERMISSIONS.TRANSFER_APPLY);

  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [search, setSearch] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  const transfersQuery = trpc.transfers.list.useQuery({ page, pageSize, search: search || undefined });
  const schoolsQuery = trpc.schools.list.useQuery();

  const createMut = trpc.transfers.submit.useMutation({
    onSuccess: () => { toast.success("Transfer request submitted"); setShowRequest(false); transfersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const recommendMut = trpc.transfers.recommend.useMutation({
    onSuccess: () => { toast.success("Transfer recommended"); transfersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const reviewMut = trpc.transfers.review.useMutation({
    onSuccess: () => { toast.success("Transfer reviewed"); transfersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const approveMut = trpc.transfers.approve.useMutation({
    onSuccess: () => { toast.success("Transfer approved"); transfersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectMut = trpc.transfers.reject.useMutation({
    onSuccess: () => { toast.success("Transfer rejected"); transfersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectByBranchMut = trpc.transfers.rejectByBranch.useMutation({
    onSuccess: () => { toast.success("Transfer rejected at branch review"); transfersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const transfers = transfersQuery.data?.data ?? [];
  const total = transfersQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const [form, setForm] = useState({ requestedSchoolId: 0, reason: "" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} transfer requests &middot; Manage teacher transfer workflows</p>
        </div>
        {canApply && (
          <Button onClick={() => setShowRequest(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Request Transfer
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto">
            <span className="shrink-0 font-medium">Workflow:</span>
            <Badge variant="outline" className="shrink-0">Submitted</Badge>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Badge variant="outline" className="shrink-0">Principal Recommends</Badge>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Badge variant="outline" className="shrink-0">Branch Reviews</Badge>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Badge variant="outline" className="shrink-0">ZD Approves</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by staff, school, reason, or status..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {transfersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : transfersQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {transfersQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => transfersQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : transfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No transfer requests found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {transfers.map((t: any) => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{t.staffName || `Transfer #${t.id}`}</p>
                      <Badge className={`text-[10px] ${STATUS_COLORS[t.status] ?? ""}`} variant="outline">
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>From: {t.currentSchoolName || `School #${t.currentSchoolId}`}</span>
                      {(t.requestedSchoolName || t.requestedSchoolId) && (
                        <span>To: {t.requestedSchoolName || `School #${t.requestedSchoolId}`}</span>
                      )}
                    </div>
                    {t.reason && <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{t.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canRecommend && t.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => recommendMut.mutate({ id: t.id })} disabled={recommendMut.isPending}>Recommend</Button>
                      </>
                    )}
                    {canReview && t.status === "recommended_by_principal" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => reviewMut.mutate({ id: t.id })} disabled={reviewMut.isPending}>Review</Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => rejectByBranchMut.mutate({ id: t.id, comment: "Rejected at branch review" })} disabled={rejectByBranchMut.isPending}>
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {canApprove && t.status === "reviewed_by_branch" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => approveMut.mutate({ id: t.id })} disabled={approveMut.isPending}>
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => rejectMut.mutate({ id: t.id, comment: "Rejected by Zonal Director" })} disabled={rejectMut.isPending}>
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

      {/* Request Transfer Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Transfer</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Requested School *</Label>
              <Select value={form.requestedSchoolId ? String(form.requestedSchoolId) : ""} onValueChange={(v) => setForm(f => ({ ...f, requestedSchoolId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>
                  {((schoolsQuery.data as any)?.data ?? schoolsQuery.data ?? []).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason *</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Explain the reason for your transfer request" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.requestedSchoolId || !form.reason} onClick={() => {
              createMut.mutate({ requestedSchoolId: form.requestedSchoolId, reason: form.reason });
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

export default function Transfers() {
  return (<DashboardLayout><TransfersContent /></DashboardLayout>);
}
