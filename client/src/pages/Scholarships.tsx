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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Award, FileText } from "lucide-react";

export default function Scholarships() {
  const [progPage, setProgPage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const [progOpen, setProgOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);

  const { data: programs, isLoading: progsLoading } = trpc.scholarships.programs.list.useQuery({ page: progPage, pageSize: 20 });
  const { data: applications, isLoading: appsLoading } = trpc.scholarships.applications.list.useQuery({ page: appPage, pageSize: 20 });

  const utils = trpc.useUtils();

  const createProgram = trpc.scholarships.programs.create.useMutation({
    onSuccess: () => { toast.success("Scholarship program created"); utils.scholarships.programs.list.invalidate(); setProgOpen(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const submitApp = trpc.scholarships.applications.submit.useMutation({
    onSuccess: () => { toast.success("Application submitted"); utils.scholarships.applications.list.invalidate(); setAppOpen(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const reviewApp = trpc.scholarships.applications.review.useMutation({
    onSuccess: () => { toast.success("Application reviewed"); utils.scholarships.applications.list.invalidate(); },
    onError: (err: any) => toast.error(err.message),
  });

  const [progForm, setProgForm] = useState({
    name: "", description: "", provider: "", eligibilityCriteria: "",
    amount: "", frequency: "annual" as "one_time" | "monthly" | "annual",
    academicYear: String(new Date().getFullYear()), applicationDeadline: "", maxRecipients: "",
  });

  const [appForm, setAppForm] = useState({ programId: "", studentId: "", schoolId: "" });

  const statusColor = (s: string) => {
    switch (s) {
      case "applied": return "secondary";
      case "under_review": return "outline";
      case "shortlisted": return "default";
      case "awarded": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
          <p className="text-muted-foreground">Manage scholarship programs and student applications</p>
        </div>

        <Tabs defaultValue="programs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={progOpen} onOpenChange={setProgOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Create Program</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Scholarship Program</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Program Name *</Label>
                      <Input value={progForm.name} onChange={e => setProgForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={progForm.description} onChange={e => setProgForm(p => ({ ...p, description: e.target.value }))} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Provider</Label>
                        <Input value={progForm.provider} onChange={e => setProgForm(p => ({ ...p, provider: e.target.value }))} placeholder="e.g. MOE, NGO" />
                      </div>
                      <div>
                        <Label>Amount (LKR)</Label>
                        <Input type="number" value={progForm.amount} onChange={e => setProgForm(p => ({ ...p, amount: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Frequency</Label>
                        <Select value={progForm.frequency} onValueChange={v => setProgForm(p => ({ ...p, frequency: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one_time">One-time</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Academic Year</Label>
                        <Input type="number" value={progForm.academicYear} onChange={e => setProgForm(p => ({ ...p, academicYear: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Deadline</Label>
                        <Input type="date" value={progForm.applicationDeadline} onChange={e => setProgForm(p => ({ ...p, applicationDeadline: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Max Recipients</Label>
                        <Input type="number" value={progForm.maxRecipients} onChange={e => setProgForm(p => ({ ...p, maxRecipients: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Eligibility Criteria</Label>
                      <Textarea value={progForm.eligibilityCriteria} onChange={e => setProgForm(p => ({ ...p, eligibilityCriteria: e.target.value }))} rows={2} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setProgOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      if (!progForm.name) { toast.error("Program name is required"); return; }
                      createProgram.mutate({
                        name: progForm.name,
                        description: progForm.description || undefined,
                        provider: progForm.provider || undefined,
                        eligibilityCriteria: progForm.eligibilityCriteria || undefined,
                        amount: progForm.amount ? Number(progForm.amount) : undefined,
                        frequency: progForm.frequency,
                        academicYear: Number(progForm.academicYear),
                        applicationDeadline: progForm.applicationDeadline || undefined,
                        maxRecipients: progForm.maxRecipients ? Number(progForm.maxRecipients) : undefined,
                      });
                    }} disabled={createProgram.isPending}>
                      {createProgram.isPending ? "Creating..." : "Create Program"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progsLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !programs?.data?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No scholarship programs</TableCell></TableRow>
                  ) : programs.data.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.provider || "—"}</TableCell>
                      <TableCell>{p.amount ? `LKR ${p.amount.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="capitalize">{p.frequency?.replace("_", " ") || "—"}</TableCell>
                      <TableCell>{p.academicYear || "—"}</TableCell>
                      <TableCell>{p.applicationDeadline ? new Date(p.applicationDeadline).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Closed"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={appOpen} onOpenChange={setAppOpen}>
                <DialogTrigger asChild>
                  <Button><FileText className="mr-2 h-4 w-4" /> Submit Application</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Submit Scholarship Application</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Program ID *</Label>
                      <Input type="number" value={appForm.programId} onChange={e => setAppForm(p => ({ ...p, programId: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Student ID *</Label>
                      <Input type="number" value={appForm.studentId} onChange={e => setAppForm(p => ({ ...p, studentId: e.target.value }))} />
                    </div>
                    <div>
                      <Label>School ID *</Label>
                      <Input type="number" value={appForm.schoolId} onChange={e => setAppForm(p => ({ ...p, schoolId: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAppOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      if (!appForm.programId || !appForm.studentId || !appForm.schoolId) { toast.error("All fields are required"); return; }
                      submitApp.mutate({
                        programId: Number(appForm.programId),
                        studentId: Number(appForm.studentId),
                        schoolId: Number(appForm.schoolId),
                      });
                    }} disabled={submitApp.isPending}>
                      {submitApp.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Awarded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appsLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : !applications?.data?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No applications</TableCell></TableRow>
                  ) : applications.data.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">#{a.id}</TableCell>
                      <TableCell>{a.programName || `#${a.programId}`}</TableCell>
                      <TableCell>#{a.studentId}</TableCell>
                      <TableCell>{a.applicationDate ? new Date(a.applicationDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge variant={statusColor(a.status) as any}>{a.status?.replace("_", " ")}</Badge></TableCell>
                      <TableCell>{a.awardedAmount ? `LKR ${a.awardedAmount.toLocaleString()}` : "—"}</TableCell>
                      <TableCell>
                        {(a.status === "applied" || a.status === "under_review") && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => reviewApp.mutate({ id: a.id, status: "shortlisted" })}>
                              Shortlist
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => reviewApp.mutate({ id: a.id, status: "awarded", awardedAmount: a.programAmount })}>
                              Award
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => reviewApp.mutate({ id: a.id, status: "rejected", reviewComment: "Does not meet criteria" })}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {Math.ceil((applications?.total ?? 0) / 20) > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {appPage} of {Math.ceil((applications?.total ?? 0) / 20)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={appPage <= 1} onClick={() => setAppPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={appPage >= Math.ceil((applications?.total ?? 0) / 20)} onClick={() => setAppPage(p => p + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
