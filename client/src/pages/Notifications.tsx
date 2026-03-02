import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";

function NotificationsContent() {
  const notificationsQuery = trpc.notifications.list.useQuery();
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("All marked as read"); notificationsQuery.refetch(); },
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });

  const notifications = notificationsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with system alerts and activity
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {notificationsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notificationsQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {notificationsQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => notificationsQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors cursor-pointer ${!n.readAt ? "bg-primary/5 border-primary/20" : "hover:bg-accent/30"}`}
              onClick={() => { if (!n.readAt) markRead.mutate({ id: n.id }); }}
            >
              <CardContent className="flex items-start gap-3 py-3 px-4">
                {!n.readAt && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.readAt ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  {n.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationsContent />
    </DashboardLayout>
  );
}
