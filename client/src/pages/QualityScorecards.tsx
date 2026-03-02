import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, Trophy, Star, BarChart3, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getScoreBadge(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  if (score >= 40) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function ScorecardsContent() {
  const [page, setPage] = useState(1);
  const [yearFilter, setYearFilter] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = trpc.supervision.scorecards.list.useQuery({
    page,
    pageSize: 20,
    academicYear: yearFilter,
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.supervision.scorecards.create.useMutation({
    onSuccess: () => {
      toast.success("Scorecard created");
      utils.supervision.scorecards.list.invalidate();
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const componentScores = {
      curriculum: Number(fd.get("curriculum") || 0),
      infrastructure: Number(fd.get("infrastructure") || 0),
      teaching_quality: Number(fd.get("teachingQuality") || 0),
      administration: Number(fd.get("administration") || 0),
      safety: Number(fd.get("safety") || 0),
      extracurricular: Number(fd.get("extracurricular") || 0),
    };
    const overallScore = Math.round(
      Object.values(componentScores).reduce((a, b) => a + b, 0) / Object.values(componentScores).length
    );
    createMutation.mutate({
      schoolId: Number(fd.get("schoolId")),
      academicYear: fd.get("academicYear") as string,
      overallScore,
      componentScores,
      inspectionCount: Number(fd.get("inspectionCount") || 0),
      improvementPlanCount: Number(fd.get("improvementPlanCount") || 0),
      rank: fd.get("rank") ? Number(fd.get("rank")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
  };

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const scorecards = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const stats = useMemo(() => {
    if (scorecards.length === 0) return { avgScore: 0, topSchools: 0, belowAvg: 0, total: 0 };
    const avg = scorecards.reduce((sum: number, s: any) => sum + (s.overallScore || 0), 0) / scorecards.length;
    return {
      total: scorecards.length,
      avgScore: avg,
      topSchools: scorecards.filter((s: any) => (s.overallScore || 0) >= 80).length,
      belowAvg: scorecards.filter((s: any) => (s.overallScore || 0) < 50).length,
    };
  }, [scorecards]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => `${currentYear - i}/${currentYear - i + 1}`);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quality Scorecards</h1>
          <p className="text-muted-foreground">School performance metrics and quality ratings</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Scorecard</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Quality Scorecard</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>School ID</Label>
                  <Input name="schoolId" type="number" required placeholder="School ID" />
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Select name="academicYear" required>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Component Scores (0-100)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Curriculum</Label>
                    <Input name="curriculum" type="number" min="0" max="100" placeholder="0-100" />
                  </div>
                  <div>
                    <Label className="text-xs">Infrastructure</Label>
                    <Input name="infrastructure" type="number" min="0" max="100" placeholder="0-100" />
                  </div>
                  <div>
                    <Label className="text-xs">Teaching Quality</Label>
                    <Input name="teachingQuality" type="number" min="0" max="100" placeholder="0-100" />
                  </div>
                  <div>
                    <Label className="text-xs">Administration</Label>
                    <Input name="administration" type="number" min="0" max="100" placeholder="0-100" />
                  </div>
                  <div>
                    <Label className="text-xs">Safety</Label>
                    <Input name="safety" type="number" min="0" max="100" placeholder="0-100" />
                  </div>
                  <div>
                    <Label className="text-xs">Extracurricular</Label>
                    <Input name="extracurricular" type="number" min="0" max="100" placeholder="0-100" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Inspections</Label>
                  <Input name="inspectionCount" type="number" min="0" defaultValue="0" />
                </div>
                <div>
                  <Label className="text-xs">Improvement Plans</Label>
                  <Input name="improvementPlanCount" type="number" min="0" defaultValue="0" />
                </div>
                <div>
                  <Label className="text-xs">Rank (optional)</Label>
                  <Input name="rank" type="number" min="1" placeholder="Zone rank" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea name="notes" rows={2} placeholder="Additional notes..." />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Scorecard
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Scorecards</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Top Schools (80+)</p>
                <p className="text-2xl font-bold">{stats.topSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Below Average (&lt;50)</p>
                <p className="text-2xl font-bold">{stats.belowAvg}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={yearFilter ?? "all"} onValueChange={(v) => { setYearFilter(v === "all" ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Years" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scorecards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : scorecards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No scorecards found. Create one to start tracking school quality.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scorecards.map((sc: any) => {
            const components = (sc.componentScores && typeof sc.componentScores === "object") ? sc.componentScores : {};
            return (
              <Card key={sc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">School #{sc.schoolId}</CardTitle>
                    {sc.rank && (
                      <Badge variant="outline" className="text-xs">
                        Rank #{sc.rank}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{sc.academicYear}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${getScoreColor(sc.overallScore)}`}>{sc.overallScore}%</p>
                      <Badge className={getScoreBadge(sc.overallScore)}>
                        Grade {getGrade(sc.overallScore)}
                      </Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-1">
                      <p>{sc.inspectionCount} inspection{sc.inspectionCount !== 1 ? "s" : ""}</p>
                      <p>{sc.improvementPlanCount} plan{sc.improvementPlanCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {Object.keys(components).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(components).map(([key, val]: [string, any]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs capitalize text-muted-foreground">{key.replace("_", " ")}</span>
                            <span className={`text-xs font-medium ${getScoreColor(Number(val))}`}>{val}%</span>
                          </div>
                          <Progress value={Number(val)} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                  {sc.notes && (
                    <p className="text-xs text-muted-foreground mt-3 italic">{sc.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function QualityScorecards() {
  return (<DashboardLayout><ScorecardsContent /></DashboardLayout>);
}
