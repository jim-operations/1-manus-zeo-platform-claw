import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, Plus, Loader2, Users, Phone, Mail, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function StaffContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [showAdd, setShowAdd] = useState(false);
  const [, navigate] = useLocation();

  const staffQuery = trpc.staff.list.useQuery({ search: search || undefined, page, pageSize });
  const usersQuery = trpc.users.list.useQuery({ page: 1, pageSize: 100 });
  const schoolsQuery = trpc.schools.list.useQuery();
  const deptsQuery = trpc.departments.list.useQuery();

  const createMut = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("Staff profile created"); setShowAdd(false); staffQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const staffList = staffQuery.data?.data ?? [];
  const total = staffQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const [form, setForm] = useState({
    userId: 0, fullName: "", nic: "", phone: "", personalEmail: "",
    designation: "", schoolId: 0, departmentId: 0, gender: "male" as const,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} staff profiles &middot; Manage staff profiles and service records
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Staff
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, NIC, or designation..." className="pl-9" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {staffQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : staffQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {staffQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => staffQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : staffList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No staff records found</p>
            <p className="text-muted-foreground text-xs mt-1">Add staff profiles to get started</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {staffList.map((staff: any) => (
              <Card key={staff.id} className="hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => navigate(`/staff/${staff.id}`)}>
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">{staff.fullName?.charAt(0) ?? "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{staff.fullName}</p>
                      {staff.designation && <Badge variant="secondary" className="text-[10px] shrink-0">{staff.designation}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {staff.nic && <span className="text-xs text-muted-foreground">NIC: {staff.nic}</span>}
                      {staff.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {staff.phone}</span>}
                      {staff.personalEmail && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {staff.personalEmail}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/staff/${staff.id}`); }}>
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
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

      {/* Add Staff Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Staff Profile</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Link to User Account</Label>
              <Select value={form.userId ? String(form.userId) : ""} onValueChange={(v) => setForm(f => ({ ...f, userId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select user account" /></SelectTrigger>
                <SelectContent>
                  {(usersQuery.data?.data ?? []).map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name || u.email || `User #${u.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Full Name *</Label><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NIC</Label><Input value={form.nic} onChange={e => setForm(f => ({ ...f, nic: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.personalEmail} onChange={e => setForm(f => ({ ...f, personalEmail: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v: any) => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>School</Label>
                <Select value={form.schoolId ? String(form.schoolId) : ""} onValueChange={(v) => setForm(f => ({ ...f, schoolId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                  <SelectContent>
                    {((schoolsQuery.data as any)?.data ?? schoolsQuery.data ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={form.departmentId ? String(form.departmentId) : ""} onValueChange={(v) => setForm(f => ({ ...f, departmentId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {(deptsQuery.data ?? []).map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.fullName || !form.userId} onClick={() => {
              createMut.mutate({
                userId: form.userId,
                fullName: form.fullName,
                nic: form.nic || undefined,
                phone: form.phone || undefined,
                personalEmail: form.personalEmail || undefined,
                designation: form.designation || undefined,
                gender: form.gender,
                schoolId: form.schoolId || undefined,
                departmentId: form.departmentId || undefined,
              });
            }}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StaffDirectory() {
  return (<DashboardLayout><StaffContent /></DashboardLayout>);
}
