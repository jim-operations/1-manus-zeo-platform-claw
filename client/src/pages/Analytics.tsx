import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2, Users, School, CalendarDays, ArrowRightLeft } from "lucide-react";

function AnalyticsContent() {
  const overview = trpc.analytics.overview.useQuery();
  const data = overview.data;

  if (overview.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (overview.error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-destructive text-sm">Error: {overview.error.message}</p>
          <button
            type="button"
            className="mt-3 text-sm underline text-muted-foreground"
            onClick={() => overview.refetch()}
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time KPIs and operational metrics for the Embilipitiya Education Zone
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.staffCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.schoolCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered schools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{data?.pendingLeaves ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{data?.pendingTransfers ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff by Designation</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.staffByDesignation?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No staff data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.staffByDesignation?.map((item) => {
                  const total = data?.staffCount || 1;
                  const pct = Math.round(((item.count as number) / total) * 100);
                  return (
                    <div key={item.designation} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.designation || "Unspecified"}</span>
                        <span className="text-muted-foreground font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave Summary (This Year)</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.leaveByType?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No leave data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data?.leaveByType?.map((item) => (
                  <div key={item.leaveType} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm capitalize">{item.leaveType.replace(/_/g, " ")}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}
