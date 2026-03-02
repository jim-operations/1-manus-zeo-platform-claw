import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, User, BookOpen, Calendar, Award, GraduationCap } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function StudentProfile() {
  const params = useParams<{ id: string }>();
  const studentId = Number(params.id);
  const [, navigate] = useLocation();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data: student, isLoading } = trpc.students.getById.useQuery({ id: studentId });
  const { data: enrollments } = trpc.enrollments.list.useQuery({ studentId, page: 1, pageSize: 50 });
  const { data: grades } = trpc.studentGrades.list.useQuery({ studentId, page: 1, pageSize: 50 });
  const { data: attendanceSummary } = trpc.attendance.studentSummary.useQuery({ studentId, academicYear: currentYear });

  const utils = trpc.useUtils();
  const enrollMutation = trpc.enrollments.enroll.useMutation({
    onSuccess: () => {
      toast.success("Student enrolled successfully");
      utils.enrollments.list.invalidate();
      setEnrollOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [enrollForm, setEnrollForm] = useState({
    schoolId: "", academicYear: String(currentYear), grade: "", classSection: "",
    medium: "" as "sinhala" | "tamil" | "english" | "",
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading student profile...</div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const attendanceRate = attendanceSummary
    ? ((attendanceSummary.present + attendanceSummary.late) / Math.max(attendanceSummary.total, 1) * 100).toFixed(1)
    : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{student.fullName}</h1>
            <p className="text-muted-foreground">
              {student.nameWithInitials && `${student.nameWithInitials} · `}
              {student.admissionNumber ? `Admission #${student.admissionNumber}` : "No admission number"}
            </p>
          </div>
          <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
            <DialogTrigger asChild>
              <Button><GraduationCap className="mr-2 h-4 w-4" /> Enroll</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>School ID *</Label>
                  <Input type="number" value={enrollForm.schoolId} onChange={e => setEnrollForm(p => ({ ...p, schoolId: e.target.value }))} placeholder="School ID" />
                </div>
                <div>
                  <Label>Academic Year *</Label>
                  <Input type="number" value={enrollForm.academicYear} onChange={e => setEnrollForm(p => ({ ...p, academicYear: e.target.value }))} />
                </div>
                <div>
                  <Label>Grade *</Label>
                  <Select value={enrollForm.grade} onValueChange={v => setEnrollForm(p => ({ ...p, grade: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {["1","2","3","4","5","6","7","8","9","10","11","12","13"].map(g => (
                        <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class Section</Label>
                  <Input value={enrollForm.classSection} onChange={e => setEnrollForm(p => ({ ...p, classSection: e.target.value }))} placeholder="e.g. A, B, C" />
                </div>
                <div>
                  <Label>Medium</Label>
                  <Select value={enrollForm.medium} onValueChange={v => setEnrollForm(p => ({ ...p, medium: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Select medium" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sinhala">Sinhala</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
                <Button onClick={() => {
                  if (!enrollForm.schoolId || !enrollForm.grade) { toast.error("School and grade are required"); return; }
                  enrollMutation.mutate({
                    studentId,
                    schoolId: Number(enrollForm.schoolId),
                    academicYear: Number(enrollForm.academicYear),
                    grade: enrollForm.grade,
                    classSection: enrollForm.classSection || undefined,
                    medium: enrollForm.medium || undefined,
                  });
                }} disabled={enrollMutation.isPending}>
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gender</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold capitalize">{student.gender || "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Date of Birth</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{attendanceRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{enrollments?.total ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Personal Info</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div><span className="text-sm text-muted-foreground">Full Name</span><p className="font-medium">{student.fullName}</p></div>
                  <div><span className="text-sm text-muted-foreground">Name with Initials</span><p className="font-medium">{student.nameWithInitials || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Nationality</span><p className="font-medium">{student.nationality || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Religion</span><p className="font-medium">{student.religion || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Address</span><p className="font-medium">{student.address || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Phone</span><p className="font-medium">{student.phone || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Email</span><p className="font-medium">{student.email || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Previous School</span><p className="font-medium">{student.previousSchool || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Emergency Contact</span><p className="font-medium">{student.emergencyContact || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Emergency Phone</span><p className="font-medium">{student.emergencyPhone || "—"}</p></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!enrollments?.data?.length ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No enrollment records</TableCell></TableRow>
                    ) : enrollments.data.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.academicYear}</TableCell>
                        <TableCell>Grade {e.grade}</TableCell>
                        <TableCell>{e.classSection || "—"}</TableCell>
                        <TableCell className="capitalize">{e.medium || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
                        </TableCell>
                        <TableCell>{e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!grades?.data?.length ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No grade records</TableCell></TableRow>
                    ) : grades.data.map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.subjectName || `Subject #${g.subjectId}`}</TableCell>
                        <TableCell>{g.academicYear}</TableCell>
                        <TableCell>{g.term?.replace("_", " ")}</TableCell>
                        <TableCell className="capitalize">{g.assessmentType?.replace("_", " ")}</TableCell>
                        <TableCell>{g.obtainedMarks}/{g.maxMarks}</TableCell>
                        <TableCell>{g.gradeSymbol || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardContent className="pt-6">
                {attendanceSummary ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{attendanceSummary.total}</div>
                      <div className="text-sm text-muted-foreground">Total Days</div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">{attendanceSummary.present}</div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="text-2xl font-bold text-red-700 dark:text-red-400">{attendanceSummary.absent}</div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                      <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{attendanceSummary.late}</div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{attendanceSummary.excused}</div>
                      <div className="text-sm text-muted-foreground">Excused</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No attendance data for {currentYear}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
