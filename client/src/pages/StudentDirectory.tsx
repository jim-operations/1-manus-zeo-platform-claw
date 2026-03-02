import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Plus, ChevronLeft, ChevronRight, Users, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";

export default function StudentDirectory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.students.list.useQuery({ page, pageSize: 20, search: search || undefined });
  const utils = trpc.useUtils();
  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("Student added successfully");
      utils.students.list.invalidate();
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    fullName: "", admissionNumber: "", nameWithInitials: "", dateOfBirth: "",
    gender: "" as "male" | "female" | "other" | "", address: "", phone: "",
    email: "", nationality: "Sri Lankan", religion: "", previousSchool: "",
    emergencyContact: "", emergencyPhone: "",
  });

  const handleSubmit = () => {
    if (!form.fullName.trim()) { toast.error("Full name is required"); return; }
    createMutation.mutate({
      fullName: form.fullName,
      admissionNumber: form.admissionNumber || undefined,
      nameWithInitials: form.nameWithInitials || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      nationality: form.nationality || undefined,
      religion: form.religion || undefined,
      previousSchool: form.previousSchool || undefined,
      emergencyContact: form.emergencyContact || undefined,
      emergencyPhone: form.emergencyPhone || undefined,
    });
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Directory</h1>
            <p className="text-muted-foreground">Manage student profiles and enrollment records</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Student</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label>Full Name *</Label>
                  <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Full name in English" />
                </div>
                <div>
                  <Label>Name with Initials</Label>
                  <Input value={form.nameWithInitials} onChange={e => setForm(p => ({ ...p, nameWithInitials: e.target.value }))} placeholder="e.g. A.B. Perera" />
                </div>
                <div>
                  <Label>Admission Number</Label>
                  <Input value={form.admissionNumber} onChange={e => setForm(p => ({ ...p, admissionNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} />
                </div>
                <div>
                  <Label>Religion</Label>
                  <Input value={form.religion} onChange={e => setForm(p => ({ ...p, religion: e.target.value }))} />
                </div>
                <div>
                  <Label>Previous School</Label>
                  <Input value={form.previousSchool} onChange={e => setForm(p => ({ ...p, previousSchool: e.target.value }))} />
                </div>
                <div>
                  <Label>Emergency Contact</Label>
                  <Input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} />
                </div>
                <div>
                  <Label>Emergency Phone</Label>
                  <Input value={form.emergencyPhone} onChange={e => setForm(p => ({ ...p, emergencyPhone: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Register Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Records</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.data?.length ?? 0} shown</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by name or admission number..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            />
          </div>
          <Button variant="outline" onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No.</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !data?.data?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : data.data.map((s: any) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/students/${s.id}`)}>
                  <TableCell className="font-mono">{s.admissionNumber || "—"}</TableCell>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell>
                    {s.gender ? <Badge variant="outline">{s.gender}</Badge> : "—"}
                  </TableCell>
                  <TableCell>{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/students/${s.id}`); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({data?.total ?? 0} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
