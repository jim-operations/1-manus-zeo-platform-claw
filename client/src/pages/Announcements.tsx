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
import { Megaphone, Plus, Loader2, Pin, Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPermission, PERMISSIONS } from "@shared/permissions";
import type { ZeoRole } from "../../../drizzle/schema";
import { useState } from "react";
import { useLocation } from "wouter";

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-800", urgent: "bg-red-100 text-red-800",
  circular: "bg-purple-100 text-purple-800", event: "bg-green-100 text-green-800",
  holiday: "bg-amber-100 text-amber-800", exam: "bg-orange-100 text-orange-800",
  training: "bg-teal-100 text-teal-800", other: "bg-gray-100 text-gray-700",
};

const PRIORITY_INDICATORS: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", normal: "bg-blue-500", low: "bg-gray-400",
};

const CATEGORIES = ["general", "urgent", "circular", "event", "holiday", "exam", "training", "other"] as const;
const PRIORITIES = ["critical", "high", "normal", "low"] as const;

function AnnouncementsContent() {
  const { user } = useAuth();
  const userRole = (user?.role ?? "user") as ZeoRole;
  const canCreate = hasPermission(userRole, PERMISSIONS.ANNOUNCEMENTS_CREATE);

  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [, navigate] = useLocation();

  const announcementsQuery = trpc.announcements.list.useQuery({ isPublished: true, page, pageSize, search: search || undefined });
  const createMut = trpc.announcements.create.useMutation({
    onSuccess: () => { toast.success("Announcement created"); setShowCreate(false); announcementsQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const announcements = announcementsQuery.data?.data ?? [];
  const total = announcementsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const [form, setForm] = useState({
    title: "", content: "", category: "general" as typeof CATEGORIES[number],
    priority: "normal" as typeof PRIORITIES[number], targetRoles: "" as string,
    isPublished: true, isPinned: false,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} announcements &middot; Official notices and circulars</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Announcement
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {announcementsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : announcementsQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {announcementsQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => announcementsQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No announcements yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {announcements.map((a: any) => (
              <Card
                key={a.id}
                className="hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/announcements/${a.id}`)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${PRIORITY_INDICATORS[a.priority] ?? "bg-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{a.title}</h3>
                        {a.isPinned && <Pin className="h-3 w-3 text-primary" />}
                        <Badge className={`text-[10px] ${CATEGORY_COLORS[a.category] ?? ""}`} variant="outline">{a.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "Draft"}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.readCount} reads</span>
                        {a.authorName && <span>By: {a.authorName}</span>}
                      </div>
                    </div>
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

      {/* Create Announcement Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Content *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: any) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v: any) => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Target Roles (comma-separated, leave empty for all)</Label>
              <Input value={form.targetRoles} onChange={e => setForm(f => ({ ...f, targetRoles: e.target.value }))} placeholder="e.g. teacher,principal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.title || !form.content} onClick={() => {
              createMut.mutate({
                title: form.title,
                content: form.content,
                category: form.category,
                priority: form.priority,
                targetAudience: form.targetRoles ? form.targetRoles.split(",").map(s => s.trim()) : undefined,
                isPublished: form.isPublished,
                isPinned: form.isPinned,
              });
            }}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Announcements() {
  return (<DashboardLayout><AnnouncementsContent /></DashboardLayout>);
}
