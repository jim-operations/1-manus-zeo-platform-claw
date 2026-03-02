import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Plus, ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZE = 20;

export default function ReportCards() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [studentIdFilter, setStudentIdFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [termFilter, setTermFilter] = useState("");
  const [open, setOpen] = useState(false);

  const listQuery = trpc.reportCards.list.useQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    studentId: studentIdFilter ? Number(studentIdFilter) : undefined,
    academicYear: yearFilter ? Number(yearFilter) : undefined,
    term: termFilter ? (termFilter as "term_1" | "term_2" | "term_3") : undefined,
  });

  const utils = trpc.useUtils();
  const upsertMutation = trpc.reportCards.upsert.useMutation({
    onSuccess: async () => {
      toast.success(t("reportCards.messages.saved"));
      await utils.reportCards.list.invalidate();
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    studentId: "",
    enrollmentId: "",
    academicYear: String(new Date().getFullYear()),
    term: "term_1" as "term_1" | "term_2" | "term_3",
    classTeacherRemarks: "",
    principalRemarks: "",
    attendanceRate: "",
    totalMarks: "",
    averageMarks: "",
    gradePointAverage: "",
    rankInClass: "",
    isPublished: "false",
  });

  const totalPages = Math.ceil((listQuery.data?.total ?? 0) / DEFAULT_PAGE_SIZE);

  const publishedCount = useMemo(() => {
    const rows = listQuery.data?.data ?? [];
    return rows.filter((r: any) => Boolean(r.isPublished)).length;
  }, [listQuery.data]);

  const handleSave = () => {
    if (!form.studentId) {
      toast.error(t("reportCards.messages.studentRequired"));
      return;
    }

    upsertMutation.mutate({
      studentId: Number(form.studentId),
      enrollmentId: form.enrollmentId ? Number(form.enrollmentId) : undefined,
      academicYear: Number(form.academicYear),
      term: form.term,
      classTeacherRemarks: form.classTeacherRemarks || undefined,
      principalRemarks: form.principalRemarks || undefined,
      attendanceRate: form.attendanceRate ? Number(form.attendanceRate) : undefined,
      totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
      averageMarks: form.averageMarks ? Number(form.averageMarks) : undefined,
      gradePointAverage: form.gradePointAverage ? Number(form.gradePointAverage) : undefined,
      rankInClass: form.rankInClass ? Number(form.rankInClass) : undefined,
      isPublished: form.isPublished === "true",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("reportCards.title")}</h1>
            <p className="text-muted-foreground">{t("reportCards.subtitle")}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("reportCards.actions.create")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t("reportCards.actions.create")}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <Label>{t("reportCards.fields.studentId")}</Label>
                  <Input
                    type="number"
                    value={form.studentId}
                    onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t("reportCards.fields.enrollmentId")}</Label>
                  <Input
                    type="number"
                    value={form.enrollmentId}
                    onChange={(e) => setForm((p) => ({ ...p, enrollmentId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t("reportCards.fields.academicYear")}</Label>
                  <Input
                    type="number"
                    value={form.academicYear}
                    onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t("reportCards.fields.term")}</Label>
                  <Select value={form.term} onValueChange={(v) => setForm((p) => ({ ...p, term: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("reportCards.fields.attendanceRate")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.attendanceRate}
                    onChange={(e) => setForm((p) => ({ ...p, attendanceRate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t("reportCards.fields.totalMarks")}</Label>
                  <Input type="number" value={form.totalMarks} onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("reportCards.fields.averageMarks")}</Label>
                  <Input type="number" value={form.averageMarks} onChange={(e) => setForm((p) => ({ ...p, averageMarks: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("reportCards.fields.gpa")}</Label>
                  <Input type="number" value={form.gradePointAverage} onChange={(e) => setForm((p) => ({ ...p, gradePointAverage: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("reportCards.fields.rank")}</Label>
                  <Input type="number" value={form.rankInClass} onChange={(e) => setForm((p) => ({ ...p, rankInClass: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("reportCards.fields.publish")}</Label>
                  <Select value={form.isPublished} onValueChange={(v) => setForm((p) => ({ ...p, isPublished: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">{t("reportCards.status.draft")}</SelectItem>
                      <SelectItem value="true">{t("reportCards.status.published")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>{t("reportCards.fields.classTeacherRemarks")}</Label>
                  <Input value={form.classTeacherRemarks} onChange={(e) => setForm((p) => ({ ...p, classTeacherRemarks: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>{t("reportCards.fields.principalRemarks")}</Label>
                  <Input value={form.principalRemarks} onChange={(e) => setForm((p) => ({ ...p, principalRemarks: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? t("reportCards.actions.saving") : t("common.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("reportCards.stats.total")}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{listQuery.data?.total ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("reportCards.stats.published")}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{publishedCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("reportCards.stats.year")}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{yearFilter || "—"}</div></CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label>{t("reportCards.fields.studentId")}</Label>
            <Input className="w-40" type="number" value={studentIdFilter} onChange={(e) => { setStudentIdFilter(e.target.value); setPage(1); }} />
          </div>
          <div>
            <Label>{t("reportCards.fields.academicYear")}</Label>
            <Input className="w-32" type="number" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }} />
          </div>
          <div>
            <Label>{t("reportCards.fields.term")}</Label>
            <Select value={termFilter || "all"} onValueChange={(v) => { setTermFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("reportCards.filters.allTerms")}</SelectItem>
                <SelectItem value="term_1">Term 1</SelectItem>
                <SelectItem value="term_2">Term 2</SelectItem>
                <SelectItem value="term_3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reportCards.fields.student")}</TableHead>
                <TableHead>{t("reportCards.fields.academicYear")}</TableHead>
                <TableHead>{t("reportCards.fields.term")}</TableHead>
                <TableHead>{t("reportCards.fields.attendanceRate")}</TableHead>
                <TableHead>{t("reportCards.fields.averageMarks")}</TableHead>
                <TableHead>{t("reportCards.fields.rank")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{t("common.loading")}</TableCell>
                </TableRow>
              ) : !(listQuery.data?.data?.length) ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span>{t("reportCards.messages.empty")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                listQuery.data.data.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">#{row.studentId}</TableCell>
                    <TableCell>{row.academicYear}</TableCell>
                    <TableCell>{String(row.term).replace("_", " ")}</TableCell>
                    <TableCell>{row.attendanceRate ?? "—"}{row.attendanceRate != null ? "%" : ""}</TableCell>
                    <TableCell>{row.averageMarks ?? "—"}</TableCell>
                    <TableCell>{row.rankInClass ?? "—"}</TableCell>
                    <TableCell>
                      {row.isPublished ? (
                        <Badge>{t("reportCards.status.published")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("reportCards.status.draft")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> {t("common.previous")}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
