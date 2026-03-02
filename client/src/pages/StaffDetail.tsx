import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Briefcase, Calendar, Award, MapPin, Phone, Mail, AlertCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function StaffDetail() {
  const params = useParams<{ id: string }>();
  const staffId = Number(params.id);
  const [, navigate] = useLocation();

  const { data: staff, isLoading, error } = trpc.staff.getById.useQuery({ id: staffId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading staff profile...</div>
      </DashboardLayout>
    );
  }

  if (error || !staff) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{error?.message || "Staff member not found"}</p>
          <Button variant="outline" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const yearsOfService = staff.appointmentDate
    ? Math.floor((Date.now() - new Date(staff.appointmentDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/staff")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{staff.fullName}</h1>
            <p className="text-muted-foreground">
              {staff.initials && `${staff.initials} · `}
              {staff.designation || "No designation"} · {staff.nic || "No NIC"}
            </p>
          </div>
          <Badge variant={staff.isActive ? "default" : "secondary"} className="text-sm">
            {staff.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Designation</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{staff.designation || "—"}</div>
              <p className="text-xs text-muted-foreground">{staff.subjectSpecialization || "No specialization"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Service Start</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {staff.appointmentDate ? new Date(staff.appointmentDate).toLocaleDateString() : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {yearsOfService !== null ? `${yearsOfService} years of service` : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">School</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{staff.schoolId ? `School #${staff.schoolId}` : "Not assigned"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leave Balances</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {staff.leaveBalance ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Casual</span><span className="font-medium">{staff.leaveBalance.casualUsed}/{staff.leaveBalance.casualTotal}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sick</span><span className="font-medium">{staff.leaveBalance.sickUsed}/{staff.leaveBalance.sickTotal}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Annual</span><span className="font-medium">{staff.leaveBalance.annualUsed}/{staff.leaveBalance.annualTotal}</span></div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No balances set</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="service">Service History</TabsTrigger>
            <TabsTrigger value="leave">Leave Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div><span className="text-sm text-muted-foreground">Full Name</span><p className="font-medium">{staff.fullName}</p></div>
                  <div><span className="text-sm text-muted-foreground">Name with Initials</span><p className="font-medium">{staff.initials || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">NIC Number</span><p className="font-medium">{staff.nic || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Date of Birth</span><p className="font-medium">{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Gender</span><p className="font-medium capitalize">{staff.gender || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Marital Status</span><p className="font-medium capitalize">{staff.maritalStatus || "—"}</p></div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div><span className="text-sm text-muted-foreground">Phone</span><p className="font-medium">{staff.phone || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div><span className="text-sm text-muted-foreground">Email</span><p className="font-medium">{staff.personalEmail || "—"}</p></div>
                  </div>
                  <div className="md:col-span-2"><span className="text-sm text-muted-foreground">Address</span><p className="font-medium">{staff.address || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Salary Step</span><p className="font-medium">{staff.salaryStep || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Retirement Date</span><p className="font-medium">{staff.retirementDate ? new Date(staff.retirementDate).toLocaleDateString() : "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">EPF Number</span><p className="font-medium">{staff.epfNumber || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">ETF Number</span><p className="font-medium">{staff.etfNumber || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Qualifications</span><p className="font-medium">{staff.qualifications ? JSON.stringify(staff.qualifications) : "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Subject Specialization</span><p className="font-medium">{staff.subjectSpecialization || "—"}</p></div>
                  <div><span className="text-sm text-muted-foreground">Emergency Contact</span><p className="font-medium">{staff.emergencyContactName || "—"} {staff.emergencyContactPhone ? `(${staff.emergencyContactPhone})` : ""}</p></div>
                  <div><span className="text-sm text-muted-foreground">Bank Details</span><p className="font-medium">{staff.bankName ? `${staff.bankName} - ${staff.bankBranch || ""} (${staff.bankAccountNumber || ""})` : "—"}</p></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!staff.serviceHistory?.length ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No service history records</TableCell></TableRow>
                    ) : staff.serviceHistory.map((sh: any) => (
                      <TableRow key={sh.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{sh.eventType?.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>{sh.effectiveDate ? new Date(sh.effectiveDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>{sh.details || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{sh.referenceNumber || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card>
              <CardHeader><CardTitle className="text-base">Leave Balances ({new Date().getFullYear()})</CardTitle></CardHeader>
              <CardContent>
                {staff.leaveBalance ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <div className="text-2xl font-bold">{staff.leaveBalance.casualTotal - staff.leaveBalance.casualUsed}</div>
                      <div className="text-xs text-muted-foreground">Casual Leave</div>
                      <div className="text-xs text-muted-foreground">Used {staff.leaveBalance.casualUsed} of {staff.leaveBalance.casualTotal}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <div className="text-2xl font-bold">{staff.leaveBalance.sickTotal - staff.leaveBalance.sickUsed}</div>
                      <div className="text-xs text-muted-foreground">Sick Leave</div>
                      <div className="text-xs text-muted-foreground">Used {staff.leaveBalance.sickUsed} of {staff.leaveBalance.sickTotal}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <div className="text-2xl font-bold">{staff.leaveBalance.annualTotal - staff.leaveBalance.annualUsed}</div>
                      <div className="text-xs text-muted-foreground">Annual Leave</div>
                      <div className="text-xs text-muted-foreground">Used {staff.leaveBalance.annualUsed} of {staff.leaveBalance.annualTotal}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <div className="text-2xl font-bold">{staff.leaveBalance.dutyTotal - staff.leaveBalance.dutyUsed}</div>
                      <div className="text-xs text-muted-foreground">Duty Leave</div>
                      <div className="text-xs text-muted-foreground">Used {staff.leaveBalance.dutyUsed} of {staff.leaveBalance.dutyTotal}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No leave balances configured for this year</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
