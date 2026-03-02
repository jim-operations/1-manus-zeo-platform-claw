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
import { Plus, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

export default function Grades() {
  const [page, setPage] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = trpc.studentGrades.list.useQuery({
    page, pageSize: 20,
    studentId: studentId ? Number(studentId) : undefined,
    academicYear: academicYear ? Number(academicYear) : undefined,
    term: (term as any) || undefined,
  });

  const utils = trpc.useUtils();
  const enterMutation = trpc.studentGrades.enter.useMutation({
    onSuccess: () => {
      toast.success("Grade entered successfully");
      utils.studentGrades.list.invalidate();
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    studentId: "", subjectId: "", academicYear: String(new Date().getFullYear()),
    term: "term_1" as "term_1" | "term_2" | "term_3",
    assessmentType: "term_exam" as "class_test" | "term_exam" | "practical" | "assignment" | "project" | "other",
    assessmentName: "", maxMarks: "100", obtainedMarks: "", gradeSymbol: "", remarks: "",
  });

  const handleSubmit = () => {
    if (!form.studentId || !form.subjectId || !form.obtainedMarks) {
      toast.error("Student ID, Subject ID, and marks are required"); return;
    }
    enterMutation.mutate({
      studentId: Number(form.studentId),
      subjectId: Number(form.subjectId),
      academicYear: Number(form.academicYear),
      term: form.term,
      assessmentType: form.assessmentType,
      assessmentName: form.assessmentName || undefined,
      maxMarks: Number(form.maxMarks),
      obtainedMarks: Number(form.obtainedMarks),
      gradeSymbol: form.gradeSymbol || undefined,
      remarks: form.remarks || undefined,
    });
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grades & Assessments</h1>
            <p className="text-muted-foreground">Enter and manage student grades and assessment results</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Enter Grade</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Enter Grade</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <Label>Student ID *</Label>
                  <Input type="number" value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} />
                </div>
                <div>
                  <Label>Subject ID *</Label>
                  <Input type="number" value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} />
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Input type="number" value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} />
                </div>
                <div>
                  <Label>Term</Label>
                  <Select value={form.term} onValueChange={v => setForm(p => ({ ...p, term: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assessment Type</Label>
                  <Select value={form.assessmentType} onValueChange={v => setForm(p => ({ ...p, assessmentType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class_test">Class Test</SelectItem>
                      <SelectItem value="term_exam">Term Exam</SelectItem>
                      <SelectItem value="practical">Practical</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assessment Name</Label>
                  <Input value={form.assessmentName} onChange={e => setForm(p => ({ ...p, assessmentName: e.target.value }))} placeholder="e.g. Mid-term" />
                </div>
                <div>
                  <Label>Max Marks</Label>
                  <Input type="number" value={form.maxMarks} onChange={e => setForm(p => ({ ...p, maxMarks: e.target.value }))} />
                </div>
                <div>
                  <Label>Obtained Marks *</Label>
                  <Input type="number" value={form.obtainedMarks} onChange={e => setForm(p => ({ ...p, obtainedMarks: e.target.value }))} />
                </div>
                <div>
                  <Label>Grade Symbol</Label>
                  <Input value={form.gradeSymbol} onChange={e => setForm(p => ({ ...p, gradeSymbol: e.target.value }))} placeholder="e.g. A, B+" />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={enterMutation.isPending}>
                  {enterMutation.isPending ? "Saving..." : "Save Grade"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <Label>Student ID</Label>
            <Input type="number" value={studentId} onChange={e => { setStudentId(e.target.value); setPage(1); }} placeholder="Filter by student" className="w-36" />
          </div>
          <div>
            <Label>Academic Year</Label>
            <Input type="number" value={academicYear} onChange={e => { setAcademicYear(e.target.value); setPage(1); }} className="w-28" />
          </div>
          <div>
            <Label>Term</Label>
            <Select value={term} onValueChange={v => { setTerm(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_terms">All Terms</SelectItem>
                <SelectItem value="term_1">Term 1</SelectItem>
                <SelectItem value="term_2">Term 2</SelectItem>
                <SelectItem value="term_3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !data?.data?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No grade records found</TableCell></TableRow>
              ) : data.data.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell>#{g.studentId}</TableCell>
                  <TableCell className="font-medium">{g.subjectName || `#${g.subjectId}`}</TableCell>
                  <TableCell>{g.academicYear}</TableCell>
                  <TableCell>{g.term?.replace("_", " ")}</TableCell>
                  <TableCell className="capitalize">{g.assessmentType?.replace("_", " ")}</TableCell>
                  <TableCell>
                    <span className="font-mono">{g.obtainedMarks}/{g.maxMarks}</span>
                    <span className="text-muted-foreground ml-1">({((g.obtainedMarks / g.maxMarks) * 100).toFixed(0)}%)</span>
                  </TableCell>
                  <TableCell>
                    {g.gradeSymbol ? <Badge variant="outline">{g.gradeSymbol}</Badge> : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({data?.total ?? 0} total)</p>
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
