import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

export default function Attendance() {
  const today = new Date().toISOString().split("T")[0];
  const [schoolId, setSchoolId] = useState("");
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<Array<{ studentId: number; name: string; status: AttendanceStatus; remarks: string }>>([]);

  const { data: schoolSummary } = trpc.attendance.schoolSummary.useQuery(
    { schoolId: Number(schoolId), date },
    { enabled: !!schoolId && !!date }
  );

  const markMutation = trpc.attendance.markBulk.useMutation({
    onSuccess: (data) => {
      toast.success(`Attendance marked for ${data.count} students`);
      setRecords([]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addStudentRow = () => {
    setRecords(prev => [...prev, { studentId: 0, name: "", status: "present", remarks: "" }]);
  };

  const updateRecord = (idx: number, field: string, value: any) => {
    setRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRecord = (idx: number) => {
    setRecords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!schoolId) { toast.error("Please enter a school ID"); return; }
    const validRecords = records.filter(r => r.studentId > 0);
    if (validRecords.length === 0) { toast.error("Add at least one student record"); return; }
    markMutation.mutate({
      schoolId: Number(schoolId),
      date,
      records: validRecords.map(r => ({
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks || undefined,
      })),
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "absent": return <XCircle className="h-4 w-4 text-red-600" />;
      case "late": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "excused": return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Mark and view daily attendance records</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 items-end">
          <div>
            <Label>School ID</Label>
            <Input type="number" value={schoolId} onChange={e => setSchoolId(e.target.value)} placeholder="Enter school ID" className="w-40" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
          </div>
        </div>

        {/* Summary */}
        {schoolSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{schoolSummary.total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-700">Present</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-700">{schoolSummary.present}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-700">Absent</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-700">{schoolSummary.absent}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-700">Late</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-yellow-700">{schoolSummary.late}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-700">Excused</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-700">{schoolSummary.excused}</div></CardContent>
            </Card>
          </div>
        )}

        {/* Mark Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Mark Attendance</CardTitle>
            <Button variant="outline" size="sm" onClick={addStudentRow}>+ Add Student</Button>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Click "Add Student" to begin marking attendance</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input type="number" value={r.studentId || ""} onChange={e => updateRecord(idx, "studentId", Number(e.target.value))} placeholder="Student ID" className="w-32" />
                        </TableCell>
                        <TableCell>
                          <Select value={r.status} onValueChange={v => updateRecord(idx, "status", v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input value={r.remarks} onChange={e => updateRecord(idx, "remarks", e.target.value)} placeholder="Optional remarks" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeRecord(idx)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSubmit} disabled={markMutation.isPending}>
                    {markMutation.isPending ? "Saving..." : `Submit Attendance (${records.filter(r => r.studentId > 0).length} students)`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
