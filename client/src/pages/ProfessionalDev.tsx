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
  Loader2, Plus, ChevronLeft, ChevronRight, GraduationCap, Clock, Award, BookOpen,
  Search, Pencil, Trash2, ExternalLink, Calendar
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const PROGRAM_TYPES = [
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "conference", label: "Conference" },
  { value: "course", label: "Course" },
  { value: "certification", label: "Certification" },
  { value: "other", label: "Other" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  workshop: "bg-blue-500/10 text-blue-600",
  seminar: "bg-purple-500/10 text-purple-600",
  conference: "bg-amber-500/10 text-amber-600",
  course: "bg-green-500/10 text-green-600",
  certification: "bg-red-500/10 text-red-600",
  other: "bg-gray-500/10 text-gray-600",
};

function ProfessionalDevContent() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // Form state
  const [formStaffId, setFormStaffId] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [formProvider, setFormProvider] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCertificateUrl, setFormCertificateUrl] = useState("");

  // Queries
  const listQuery = trpc.professionalDev.listPaginated.useQuery({
    page,
    pageSize: 15,
    search: search || undefined,
    programType: typeFilter || undefined,
  });

  const statsQuery = trpc.professionalDev.stats.useQuery();
  const staffQuery = trpc.staff.list.useQuery({ page: 1, pageSize: 500 });

  const staffOptions = useMemo(() => {
    if (!staffQuery.data?.data) return [];
    return staffQuery.data.data.map((s: any) => ({ id: s.id, fullName: s.fullName, designation: s.designation }));
  }, [staffQuery.data]);

  // Mutations
  const createMut = trpc.professionalDev.create.useMutation({
    onSuccess: () => {
      toast.success("Training record created");
      setCreateOpen(false);
      resetForm();
      utils.professionalDev.listPaginated.invalidate();
      utils.professionalDev.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.professionalDev.update.useMutation({
    onSuccess: () => {
      toast.success("Training record updated");
      setEditOpen(false);
      setSelected(null);
      utils.professionalDev.listPaginated.invalidate();
      utils.professionalDev.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.professionalDev.delete.useMutation({
    onSuccess: () => {
      toast.success("Training record deleted");
      setDeleteOpen(false);
      setSelected(null);
      utils.professionalDev.listPaginated.invalidate();
      utils.professionalDev.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setFormStaffId("");
    setFormName("");
    setFormType("");
    setFormProvider("");
    setFormStartDate("");
    setFormEndDate("");
    setFormHours("");
    setFormDescription("");
    setFormCertificateUrl("");
  }

  function openEdit(record: any) {
    setSelected(record);
    setFormName(record.programName);
    setFormType(record.programType);
    setFormProvider(record.provider ?? "");
    setFormStartDate(record.startDate ? new Date(record.startDate).toISOString().split("T")[0] : "");
    setFormEndDate(record.endDate ? new Date(record.endDate).toISOString().split("T")[0] : "");
    setFormHours(record.durationHours?.toString() ?? "");
    setFormDescription(record.description ?? "");
    setFormCertificateUrl(record.certificateUrl ?? "");
    setEditOpen(true);
  }

  function handleCreate() {
    if (!formStaffId || !formName || !formType || !formStartDate) {
      toast.error("Please fill in required fields");
      return;
    }
    createMut.mutate({
      staffId: Number(formStaffId),
      programName: formName,
      programType: formType as any,
      provider: formProvider || undefined,
      startDate: new Date(formStartDate),
      endDate: formEndDate ? new Date(formEndDate) : undefined,
      durationHours: formHours ? Number(formHours) : undefined,
      description: formDescription || undefined,
    });
  }

  function handleUpdate() {
    if (!selected || !formName || !formType) {
      toast.error("Please fill in required fields");
      return;
    }
    updateMut.mutate({
      id: selected.id,
      programName: formName,
      programType: formType as any,
      provider: formProvider || undefined,
      startDate: formStartDate ? new Date(formStartDate) : undefined,
      endDate: formEndDate ? new Date(formEndDate) : undefined,
      durationHours: formHours ? Number(formHours) : undefined,
      description: formDescription || undefined,
      certificateUrl: formCertificateUrl || undefined,
    });
  }

  const records = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);
  const stats = statsQuery.data;

  function formatDate(d: any) {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
  }

  function getStatus(record: any): { label: string; variant: "default" | "secondary" | "outline" } {
    if (!record.endDate) return { label: "Ongoing", variant: "default" };
    const end = new Date(record.endDate);
    if (end > new Date()) return { label: "In Progress", variant: "default" };
    return { label: "Completed", variant: "secondary" };
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Professional Development</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track training programs, workshops, certifications, and CPD hours
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Training Record</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <Label>Staff Member *</Label>
                <Select value={formStaffId} onValueChange={setFormStaffId}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staffOptions.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.fullName} {s.designation ? `\u2014 ${s.designation}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Program Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Advanced Teaching Methods" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Program Type *</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {PROGRAM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input value={formProvider} onChange={(e) => setFormProvider(e.target.value)} placeholder="e.g., NIE, SLIDA" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                </div>
                <div>
                  <Label>Duration (hours)</Label>
                  <Input type="number" value={formHours} onChange={(e) => setFormHours(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of the program" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completed ?? 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.inProgress ?? 0}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalHours ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total CPD Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs or providers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PROGRAM_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No training records found</p>
              <p className="text-muted-foreground text-xs mt-1">Click "New Record" to add one</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r: any) => {
                  const status = getStatus(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{r.programName}</p>
                          {r.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.staffName ?? "\u2014"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TYPE_COLORS[r.programType] ?? ""}>
                          {PROGRAM_TYPES.find(t => t.value === r.programType)?.label ?? r.programType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.provider ?? "\u2014"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(r.startDate)}
                          {r.endDate && ` \u2014 ${formatDate(r.endDate)}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.durationHours ?? "\u2014"}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.certificateUrl && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={r.certificateUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSelected(r); setDeleteOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 15 + 1}\u2013{Math.min(page * 15, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setSelected(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Training Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Program Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Program Type *</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider</Label>
                <Input value={formProvider} onChange={(e) => setFormProvider(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
              </div>
              <div>
                <Label>Duration (hours)</Label>
                <Input type="number" value={formHours} onChange={(e) => setFormHours(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Certificate URL</Label>
              <Input value={formCertificateUrl} onChange={(e) => setFormCertificateUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Training Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selected?.programName}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => selected && deleteMut.mutate({ id: selected.id })} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfessionalDev() {
  return (
    <DashboardLayout>
      <ProfessionalDevContent />
    </DashboardLayout>
  );
}
