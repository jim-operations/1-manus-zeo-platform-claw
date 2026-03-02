import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function AuditContent() {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const auditQuery = trpc.auditLogs.list.useQuery({ page, pageSize });

  const logs = auditQuery.data?.data ?? [];
  const total = auditQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} records &middot; System activity trail for compliance and accountability</p>
      </div>

      {auditQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : auditQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {auditQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => auditQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No audit records yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-1">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 py-2.5 px-4 border-b last:border-0 hover:bg-accent/30 transition-colors rounded">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{log.action}</span>
                    <Badge variant="outline" className="text-[10px]">{log.entityType}</Badge>
                    {log.entityId && <span className="text-xs text-muted-foreground">#{log.entityId}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    User #{log.userId} &middot; {log.ipAddress ?? "Unknown IP"} &middot; {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AuditLog() {
  return (<DashboardLayout><AuditContent /></DashboardLayout>);
}
