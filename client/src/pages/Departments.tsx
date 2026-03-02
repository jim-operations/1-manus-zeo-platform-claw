import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2, Plus, ChevronLeft, ChevronRight, Building2, Users, Search,
  Pencil, Trash2, UserCheck, ChevronDown, ChevronUp, Phone, Mail
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";

function DepartmentsContent() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffViewDeptId, setStaffViewDeptId] = useState<number | null>(null);
  const [staffPage, setStaffPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState<any>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formHeadId, setFormHeadId] = useState<string>("");

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  // Queries
  const { data, isLoading, error } = trpc.departments.listPaginated.useQuery({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
  });

  const staffQuery = trpc.departments.staff.useQuery(
    { departmentId: staffViewDeptId!, page: staffPage, pageSize: 10 },
    { enabled: staffViewDeptId !== null }
  );

  // Get staff list for branch head dropdown
  const allStaffQuery = trpc.staff.list.useQuery(
    { page: 1, pageSize: 500 },
    { enabled: createDialogOpen || editDialogOpen }
  );
  const staffOptions = useMemo(() => {
    return allStaffQuery.data?.data ?? [];
  }, [allStaffQuery.data]);

  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Department created successfully");
      utils.departments.listPaginated.invalidate();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Department updated successfully");
      utils.departments.listPaginated.invalidate();
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Department deleted successfully");
      utils.departments.listPaginated.invalidate();
      setDeleteDialogOpen(false);
      setSelectedDept(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormHeadId("");
  };

  const openEditDialog = (dept: any) => {
    setSelectedDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code ?? "");
    setFormDescription(dept.description ?? "");
    setFormHeadId(dept.headId ? String(dept.headId) : "");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (dept: any) => {
    setSelectedDept(dept);
    setDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formName,
      code: formCode || undefined,
      description: formDescription || undefined,
      headId: formHeadId ? Number(formHeadId) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedDept) return;
    updateMutation.mutate({
      id: selectedDept.id,
      name: formName || undefined,
      code: formCode || undefined,
      description: formDescription || undefined,
      headId: formHeadId && formHeadId !== "none" ? Number(formHeadId) : null,
    });
  };

  const handleDelete = () => {
    if (!selectedDept) return;
    deleteMutation.mutate({ id: selectedDept.id });
  };

  const toggleStaffView = (deptId: number) => {
    if (staffViewDeptId === deptId) {
      setStaffViewDeptId(null);
    } else {
      setStaffViewDeptId(deptId);
      setStaffPage(1);
    }
  };

  const canManage = user?.role === "admin" || user?.role === "zonal_director";
  const departments = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Failed to load departments: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizational departments, staff assignments, and branch heads
          </p>
        </div>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Department Name *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Planning & Research" />
                </div>
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. PR" maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of the department's role" rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Branch Head</Label>
                  <Select value={formHeadId} onValueChange={setFormHeadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch head (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffOptions.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.fullName} {s.designation ? `— ${s.designation}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreate} disabled={!formName || createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.filter((d: any) => d.headId).length}
                </p>
                <p className="text-xs text-muted-foreground">With Branch Heads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.reduce((sum: number, d: any) => sum + (d.staffCount ?? 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Staff Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search departments..."
          className="pl-9"
        />
      </div>

      {/* Department List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              {debouncedSearch ? "No departments match your search" : "No departments created yet"}
            </p>
            {canManage && !debouncedSearch && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create First Department
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {departments.map((dept: any) => (
            <Card key={dept.id} className="overflow-hidden">
              <div className="flex flex-col">
                {/* Department Row */}
                <div className="flex items-center gap-4 p-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    onClick={() => toggleStaffView(dept.id)}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{dept.name}</h3>
                        {dept.code && (
                          <Badge variant="outline" className="text-xs shrink-0">{dept.code}</Badge>
                        )}
                      </div>
                      {dept.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dept.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold">{dept.staffCount}</p>
                      <p className="text-[10px] text-muted-foreground">Staff</p>
                    </div>
                    <div className="text-center min-w-[100px]">
                      {dept.headName ? (
                        <>
                          <p className="text-xs font-medium truncate">{dept.headName}</p>
                          <p className="text-[10px] text-muted-foreground">Branch Head</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground/60">—</p>
                          <p className="text-[10px] text-muted-foreground">No Head</p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleStaffView(dept.id)}
                        title="View staff"
                      >
                        {staffViewDeptId === dept.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(dept)}
                            title="Edit department"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(dept)}
                            title="Delete department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Staff Expandable View */}
                {staffViewDeptId === dept.id && (
                  <div className="border-t bg-muted/30 px-4 py-3">
                    {staffQuery.isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (staffQuery.data?.data?.length ?? 0) === 0 ? (
                      <div className="flex flex-col items-center py-6">
                        <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">No staff assigned to this department</p>
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-xs">Designation</TableHead>
                              <TableHead className="text-xs">Phone</TableHead>
                              <TableHead className="text-xs">Email</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staffQuery.data?.data.map((staff: any) => (
                              <TableRow key={staff.id}>
                                <TableCell className="text-sm font-medium">{staff.fullName}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{staff.designation ?? "—"}</TableCell>
                                <TableCell className="text-sm">
                                  {staff.phone ? (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" /> {staff.phone}
                                    </span>
                                  ) : "—"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {staff.personalEmail ? (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" /> {staff.personalEmail}
                                    </span>
                                  ) : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {/* Staff Pagination */}
                        {(staffQuery.data?.total ?? 0) > 10 && (
                          <div className="flex items-center justify-between pt-3">
                            <p className="text-xs text-muted-foreground">
                              Showing {((staffPage - 1) * 10) + 1}\u2013{Math.min(staffPage * 10, staffQuery.data?.total ?? 0)} of {staffQuery.data?.total ?? 0}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={staffPage <= 1}
                                onClick={() => setStaffPage(p => p - 1)}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={staffPage >= Math.ceil((staffQuery.data?.total ?? 0) / 10)}
                                onClick={() => setStaffPage(p => p + 1)}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.total} departments)
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { resetForm(); setSelectedDept(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Department Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Department name" />
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. PR" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Branch Head</Label>
              <Select value={formHeadId} onValueChange={setFormHeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch head (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No Branch Head —</SelectItem>
                  {staffOptions.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.fullName} {s.designation ? `— ${s.designation}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdate} disabled={!formName || updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setSelectedDept(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedDept?.name}</strong>? This action will deactivate the department. Staff assigned to this department will not be affected.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Departments() {
  return (
    <DashboardLayout>
      <DepartmentsContent />
    </DashboardLayout>
  );
}
