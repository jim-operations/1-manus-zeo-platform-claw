import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { trpc } from "@/lib/trpc";
import {
  Users, School, CalendarDays, ArrowRightLeft, Megaphone, Loader2,
  DollarSign, TrendingUp, ClipboardCheck, AlertTriangle, GraduationCap,
  ShoppingCart, Activity, Clock, FileText, BarChart3,
} from "lucide-react";
import { ROLE_DISPLAY_NAMES } from "@shared/permissions";
import type { ZeoRole } from "../../../drizzle/schema";
import { Bar, BarChart, XAxis, YAxis, Cell, PieChart, Pie } from "recharts";

/* ─── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({
  title, value, icon: Icon, description, loading, trend, trendLabel,
}: {
  title: string; value: number | string; icon: any; description?: string; loading?: boolean;
  trend?: "up" | "down" | "neutral"; trendLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            {trendLabel && (
              <p className={`text-xs mt-1 ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                {trendLabel}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Format LKR ───────────────────────────────────────────────────────────── */
function formatLKR(cents: number): string {
  const rupees = cents / 100;
  if (rupees >= 1_000_000) return `Rs. ${(rupees / 1_000_000).toFixed(1)}M`;
  if (rupees >= 1_000) return `Rs. ${(rupees / 1_000).toFixed(0)}K`;
  return `Rs. ${rupees.toLocaleString()}`;
}

/* ─── Budget Summary Card ──────────────────────────────────────────────────── */
function BudgetSummaryCard({ data, loading }: { data: any; loading: boolean }) {
  const utilization = data?.totalAllocated > 0
    ? Math.round(((data.totalAllocated - data.totalRemaining) / data.totalAllocated) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Financial summary across all budgets</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Allocated</p>
                <p className="text-lg font-bold text-primary">{formatLKR(data?.totalAllocated ?? 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-lg font-bold text-orange-600">{formatLKR(data?.totalSpent ?? 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-green-600">{formatLKR(data?.totalRemaining ?? 0)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget Utilization</span>
                <span className="font-medium">{utilization}%</span>
              </div>
              <Progress value={utilization} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>{data?.budgetCount ?? 0} total budgets</span>
              <span>{data?.approvedCount ?? 0} approved</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Inspection Stats Card ────────────────────────────────────────────────── */
function InspectionStatsCard({ data, loading }: { data: any; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Inspection & QA</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>School inspection overview</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 shrink-0">
                <span className="text-2xl font-bold text-primary">{data?.avgScore ?? 0}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Average Score</p>
                <p className="text-xs text-muted-foreground">Across {data?.completed ?? 0} completed inspections</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold">{data?.scheduled ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Scheduled</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold">{data?.inProgress ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">In Progress</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold">{data?.completed ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Improvement Plans Card ───────────────────────────────────────────────── */
function ImprovementPlansCard({ data, loading }: { data: any; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Improvement Plans</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>School improvement tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average Progress</span>
                <span className="font-medium">{data?.avgProgress ?? 0}%</span>
              </div>
              <Progress value={data?.avgProgress ?? 0} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{data?.active ?? 0} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs">{data?.completed ?? 0} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs">{data?.overdue ?? 0} Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-xs">{data?.total ?? 0} Total</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Expenditure Chart ────────────────────────────────────────────────────── */
const expenditureChartConfig: ChartConfig = {
  total: { label: "Amount", color: "var(--color-chart-1)" },
};

function ExpenditureChart({ data, loading }: { data: any[]; loading: boolean }) {
  const expenditures = (data ?? [])
    .filter((d: any) => d.type === "expenditure")
    .map((d: any) => ({
      category: String(d.category).charAt(0).toUpperCase() + String(d.category).slice(1),
      total: Number(d.total) / 100,
    }))
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 6);

  const COLORS = [
    "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
    "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-primary)",
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Expenditure by Category</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Top spending categories (LKR)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : expenditures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transaction data yet</p>
          </div>
        ) : (
          <ChartContainer config={expenditureChartConfig} className="h-[200px] w-full">
            <BarChart data={expenditures} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} fontSize={11} />
              <YAxis type="category" dataKey="category" width={80} fontSize={11} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => `Rs. ${Number(value).toLocaleString()}`} />}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {expenditures.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Inspection Score Distribution ────────────────────────────────────────── */
const inspectionPieConfig: ChartConfig = {
  excellent: { label: "Excellent (80+)", color: "oklch(0.65 0.17 145)" },
  good: { label: "Good (60-79)", color: "var(--color-chart-1)" },
  average: { label: "Average (40-59)", color: "var(--color-chart-4)" },
  poor: { label: "Below Average (<40)", color: "oklch(0.60 0.18 25)" },
};

function InspectionScoreChart({ data, loading }: { data: any; loading: boolean }) {
  const recent = data?.recentInspections ?? [];
  const scored = recent.filter((r: any) => r.overallScore != null);

  const distribution = [
    { name: "Excellent", value: scored.filter((r: any) => r.overallScore >= 80).length, fill: "oklch(0.65 0.17 145)" },
    { name: "Good", value: scored.filter((r: any) => r.overallScore >= 60 && r.overallScore < 80).length, fill: "var(--color-chart-1)" },
    { name: "Average", value: scored.filter((r: any) => r.overallScore >= 40 && r.overallScore < 60).length, fill: "var(--color-chart-4)" },
    { name: "Below Avg", value: scored.filter((r: any) => r.overallScore < 40).length, fill: "oklch(0.60 0.18 25)" },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Inspection Scores</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Recent inspection score distribution</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : distribution.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No scored inspections yet</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ChartContainer config={inspectionPieConfig} className="h-[160px] w-[160px] shrink-0">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              {distribution.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Recent Activity Feed ─────────────────────────────────────────────────── */
function getActivityIcon(entityType: string) {
  switch (entityType) {
    case "staff": return Users;
    case "leave": return CalendarDays;
    case "transfer": return ArrowRightLeft;
    case "school": return School;
    case "announcement": return Megaphone;
    case "budget": return DollarSign;
    case "transaction": return DollarSign;
    case "inspection": return ClipboardCheck;
    case "student": return GraduationCap;
    case "procurement": return ShoppingCart;
    default: return Activity;
  }
}

function getActivityColor(action: string) {
  if (action.startsWith("create")) return "bg-green-500";
  if (action.startsWith("update")) return "bg-blue-500";
  if (action.startsWith("delete")) return "bg-red-500";
  if (action.startsWith("approve")) return "bg-emerald-500";
  if (action.startsWith("reject")) return "bg-orange-500";
  return "bg-muted-foreground";
}

function formatAction(action: string, entityType: string): string {
  const verb = action.replace(/_/g, " ");
  return `${verb} ${entityType}`;
}

function RecentActivityCard({ data, loading }: { data: any[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Latest actions across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((item: any) => {
              const Icon = getActivityIcon(item.entityType);
              return (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getActivityColor(item.action)} bg-opacity-15`}>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.userName}</span>
                      {" "}
                      <span className="text-muted-foreground">{formatAction(item.action, item.entityType)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Announcements Card ───────────────────────────────────────────────────── */
function AnnouncementsCard() {
  const recentAnnouncements = trpc.announcements.list.useQuery({ isPublished: true, page: 1, pageSize: 5 });
  const announcementsList = recentAnnouncements.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Announcements</CardTitle>
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {recentAnnouncements.isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : announcementsList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {announcementsList.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                  a.priority === "critical" ? "bg-destructive" :
                  a.priority === "high" ? "bg-orange-500" : "bg-primary"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Dashboard Content ────────────────────────────────────────────────────── */
function DashboardContent() {
  const { user } = useAuth();
  const analytics = trpc.analytics.overview.useQuery();
  const extended = trpc.analytics.dashboardExtended.useQuery();
  const userRole = (user?.role ?? "user") as ZeoRole;
  const hasDashboardError = Boolean(analytics.error || extended.error);

  const ext = extended.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] ?? "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ROLE_DISPLAY_NAMES[userRole]} &mdash; Zonal Education Office, Embilipitiya
        </p>
      </div>

      {hasDashboardError && (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm text-destructive">
              {analytics.error?.message ?? extended.error?.message ?? "Failed to load dashboard data"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                analytics.refetch();
                extended.refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Staff" value={analytics.data?.staffCount ?? 0} icon={Users} description="Active members" loading={analytics.isLoading} />
        <StatCard title="Schools" value={analytics.data?.schoolCount ?? 0} icon={School} description="Registered" loading={analytics.isLoading} />
        <StatCard title="Students" value={ext?.studentCount ?? 0} icon={GraduationCap} description="Active students" loading={extended.isLoading} />
        <StatCard title="Pending Leaves" value={analytics.data?.pendingLeaves ?? 0} icon={CalendarDays} description="Awaiting approval" loading={analytics.isLoading} />
        <StatCard title="Pending Transfers" value={analytics.data?.pendingTransfers ?? 0} icon={ArrowRightLeft} description="In progress" loading={analytics.isLoading} />
        <StatCard
          title="Procurements"
          value={ext?.procurementStats?.pending ?? 0}
          icon={ShoppingCart}
          description="Pending review"
          loading={extended.isLoading}
        />
      </div>

      {/* Tabs: Overview / Finance / Quality */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="quality">Quality & Inspections</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <BudgetSummaryCard data={ext?.budgetSummary} loading={extended.isLoading} />
            <InspectionStatsCard data={ext?.inspectionStats} loading={extended.isLoading} />
            <ImprovementPlansCard data={ext?.improvementStats} loading={extended.isLoading} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AnnouncementsCard />
            <RecentActivityCard data={ext?.recentActivity ?? []} loading={extended.isLoading} />
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Allocated"
              value={formatLKR(ext?.budgetSummary?.totalAllocated ?? 0)}
              icon={DollarSign}
              description={`${ext?.budgetSummary?.budgetCount ?? 0} budgets`}
              loading={extended.isLoading}
            />
            <StatCard
              title="Total Spent"
              value={formatLKR(ext?.budgetSummary?.totalSpent ?? 0)}
              icon={TrendingUp}
              description="Across all budgets"
              loading={extended.isLoading}
            />
            <StatCard
              title="Procurement Costs"
              value={formatLKR(ext?.procurementStats?.totalCost ?? 0)}
              icon={ShoppingCart}
              description={`${ext?.procurementStats?.total ?? 0} requisitions`}
              loading={extended.isLoading}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ExpenditureChart data={ext?.transactionBreakdown ?? []} loading={extended.isLoading} />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Procurement Status</CardTitle>
                <CardDescription>Purchase requisition breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {extended.isLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-md bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{ext?.procurementStats?.total ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">{ext?.procurementStats?.pending ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{ext?.procurementStats?.approved ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Approved</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Approval Rate</span>
                        <span className="font-medium">
                          {ext?.procurementStats?.total ? Math.round(((ext?.procurementStats?.approved ?? 0) / ext.procurementStats.total) * 100) : 0}%
                        </span>
                      </div>
                      <Progress
                        value={ext?.procurementStats?.total ? ((ext?.procurementStats?.approved ?? 0) / ext.procurementStats.total) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Average Score"
              value={ext?.inspectionStats?.avgScore ?? 0}
              icon={ClipboardCheck}
              description="Across completed inspections"
              loading={extended.isLoading}
            />
            <StatCard
              title="Active Plans"
              value={ext?.improvementStats?.active ?? 0}
              icon={FileText}
              description={`${ext?.improvementStats?.overdue ?? 0} overdue`}
              loading={extended.isLoading}
              trend={ext?.improvementStats?.overdue ? "down" : "neutral"}
              trendLabel={ext?.improvementStats?.overdue ? `${ext.improvementStats.overdue} plan(s) overdue` : "All on track"}
            />
            <StatCard
              title="Completion Rate"
              value={`${ext?.improvementStats?.total ? Math.round(((ext?.improvementStats?.completed ?? 0) / ext.improvementStats.total) * 100) : 0}%`}
              icon={TrendingUp}
              description="Improvement plans completed"
              loading={extended.isLoading}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InspectionScoreChart data={ext?.inspectionStats} loading={extended.isLoading} />
            <ImprovementPlansCard data={ext?.improvementStats} loading={extended.isLoading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Home() {
  return (<DashboardLayout><DashboardContent /></DashboardLayout>);
}
