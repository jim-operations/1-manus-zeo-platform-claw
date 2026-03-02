import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { School, Plus, Loader2, Users, MapPin, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  "1AB": "Type 1AB (National)", "1C": "Type 1C", "2": "Type 2", "3": "Type 3 (Primary)",
};

function SchoolsContent() {
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const schoolsQuery = trpc.schools.list.useQuery({ page, pageSize, search: search || undefined });
  const createMut = trpc.schools.create.useMutation({
    onSuccess: () => { toast.success("School registered"); setShowAdd(false); schoolsQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const schoolsList = schoolsQuery.data?.data ?? [];
  const total = schoolsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const [form, setForm] = useState({
    name: "", code: "", type: "1C" as string, address: "", district: "", division: "",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schools</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} schools &middot; Schools under the Embilipitiya Education Zone</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add School
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by school name, code, or division..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {schoolsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : schoolsQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {schoolsQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => schoolsQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : schoolsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <School className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No schools registered yet</p>
            <p className="text-muted-foreground text-xs mt-1">Add schools to the zone registry</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {schoolsList.map((school: any) => (
              <Card key={school.id} className="hover:bg-accent/30 transition-colors">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{school.name}</h3>
                        {school.type && <Badge variant="secondary" className="text-[10px] shrink-0">{TYPE_LABELS[school.type] ?? school.type}</Badge>}
                      </div>
                      {school.code && <p className="text-xs text-muted-foreground mt-0.5">Code: {school.code}</p>}
                      {school.principalName && <p className="text-xs text-muted-foreground mt-0.5">Principal: {school.principalName}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {school.division && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {school.division}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {school.teacherCount ?? 0} teachers</span>
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

      {/* Add School Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Register School</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>School Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>School Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1AB">Type 1AB (National)</SelectItem>
                    <SelectItem value="1C">Type 1C</SelectItem>
                    <SelectItem value="2">Type 2</SelectItem>
                    <SelectItem value="3">Type 3 (Primary)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>District</Label><Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} /></div>
              <div><Label>Division</Label><Input value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.name} onClick={() => {
              createMut.mutate({
                name: form.name,
                code: form.code || undefined,
                type: (form.type || undefined) as any,
                address: form.address || undefined,
                district: form.district || undefined,
                division: form.division || undefined,
              });
            }}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SchoolsPage() {
  return (<DashboardLayout><SchoolsContent /></DashboardLayout>);
}
