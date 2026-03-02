import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserRound, CalendarCheck2, BookOpenCheck, FileText } from "lucide-react";

export default function ParentPortal() {
  const { t } = useTranslation();
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));

  const childrenQuery = trpc.parentPortal.myChildren.useQuery();

  useEffect(() => {
    if (!selectedChildId && childrenQuery.data?.length) {
      setSelectedChildId(String(childrenQuery.data[0].studentId));
    }
  }, [childrenQuery.data, selectedChildId]);

  const selectedStudentId = selectedChildId ? Number(selectedChildId) : undefined;

  const profileQuery = trpc.parentPortal.childProfile.useQuery(
    { studentId: selectedStudentId ?? 0 },
    { enabled: Boolean(selectedStudentId) }
  );

  const attendanceQuery = trpc.parentPortal.childAttendanceSummary.useQuery(
    { studentId: selectedStudentId ?? 0, academicYear: Number(academicYear) },
    { enabled: Boolean(selectedStudentId && academicYear) }
  );

  const gradesQuery = trpc.parentPortal.childGradeSummary.useQuery(
    { studentId: selectedStudentId ?? 0, academicYear: Number(academicYear) },
    { enabled: Boolean(selectedStudentId && academicYear) }
  );

  const reportCardsQuery = trpc.parentPortal.childReportCards.useQuery(
    { studentId: selectedStudentId ?? 0, page: 1, pageSize: 20 },
    { enabled: Boolean(selectedStudentId) }
  );

  const attendanceRate = useMemo(() => {
    const summary: any = attendanceQuery.data;
    if (!summary || !summary.total) return 0;
    return Math.round(((summary.present ?? 0) / summary.total) * 100);
  }, [attendanceQuery.data]);

  const averageAcrossSubjects = useMemo(() => {
    const rows: any[] = (gradesQuery.data as any[]) ?? [];
    if (!rows.length) return null;
    const avg = rows.reduce((sum, r) => sum + (Number(r.avgMarks) || 0), 0) / rows.length;
    return avg.toFixed(1);
  }, [gradesQuery.data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("parentPortal.title")}</h1>
          <p className="text-muted-foreground">{t("parentPortal.subtitle")}</p>
        </div>

        {childrenQuery.isLoading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">{t("common.loading")}</CardContent></Card>
        ) : !(childrenQuery.data?.length) ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <UserRound className="h-5 w-5" />
                <span>{t("parentPortal.messages.noChildren")}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>{t("parentPortal.fields.child")}</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {childrenQuery.data.map((child: any) => (
                      <SelectItem key={child.studentId} value={String(child.studentId)}>
                        {child.fullName} ({child.relationship})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("parentPortal.fields.academicYear")}</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map((offset) => {
                      const year = String(new Date().getFullYear() - offset);
                      return <SelectItem key={year} value={year}>{year}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4" /> {t("parentPortal.cards.attendanceRate")}
                  </CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{attendanceRate}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpenCheck className="h-4 w-4" /> {t("parentPortal.cards.avgMarks")}
                  </CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{averageAcrossSubjects ?? "—"}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {t("parentPortal.cards.reportCards")}
                  </CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{reportCardsQuery.data?.total ?? 0}</div></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("parentPortal.sections.childProfile")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div><span className="text-muted-foreground">{t("parentPortal.fields.fullName")}: </span>{(profileQuery.data as any)?.fullName ?? "—"}</div>
                <div><span className="text-muted-foreground">{t("parentPortal.fields.admissionNumber")}: </span>{(profileQuery.data as any)?.admissionNumber ?? "—"}</div>
                <div><span className="text-muted-foreground">{t("parentPortal.fields.gender")}: </span>{(profileQuery.data as any)?.gender ?? "—"}</div>
                <div><span className="text-muted-foreground">{t("parentPortal.fields.phone")}: </span>{(profileQuery.data as any)?.phone ?? "—"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("parentPortal.sections.reportCards")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("reportCards.fields.academicYear")}</TableHead>
                        <TableHead>{t("reportCards.fields.term")}</TableHead>
                        <TableHead>{t("reportCards.fields.averageMarks")}</TableHead>
                        <TableHead>{t("reportCards.fields.rank")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportCardsQuery.isLoading ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
                      ) : !(reportCardsQuery.data?.data?.length) ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t("parentPortal.messages.noReportCards")}</TableCell></TableRow>
                      ) : (
                        reportCardsQuery.data.data.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.academicYear}</TableCell>
                            <TableCell>{String(row.term).replace("_", " ")}</TableCell>
                            <TableCell>{row.averageMarks ?? "—"}</TableCell>
                            <TableCell>{row.rankInClass ?? "—"}</TableCell>
                            <TableCell>
                              {row.isPublished ? <Badge>{t("reportCards.status.published")}</Badge> : <Badge variant="outline">{t("reportCards.status.draft")}</Badge>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
