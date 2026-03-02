import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Tag, AlertCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function AnnouncementDetail() {
  const params = useParams<{ id: string }>();
  const announcementId = Number(params.id);
  const [, navigate] = useLocation();

  const { data: announcement, isLoading, error } = trpc.announcements.getById.useQuery({ id: announcementId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading announcement...</div>
      </DashboardLayout>
    );
  }

  if (error || !announcement) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{error?.message || "Announcement not found"}</p>
          <Button variant="outline" onClick={() => navigate("/announcements")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Announcements
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "normal": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/announcements")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Announcements
        </Button>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityColor(announcement.priority) as any} className="capitalize">
              {announcement.priority}
            </Badge>
            <Badge variant="outline" className="capitalize">{announcement.category?.replace("_", " ") || "General"}</Badge>
            {announcement.isPinned && <Badge variant="default">Pinned</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{announcement.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Author #{announcement.authorId}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              }) : "—"}
            </span>
            {announcement.targetAudience != null && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {`Audience: ${JSON.stringify(announcement.targetAudience)}`}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {announcement.content}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{announcement.isPublished ? "Published" : "Draft"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Published</span>
                <p className="font-medium">
                  {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString() : "Not published"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Expires</span>
                <p className="font-medium">
                  {announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleDateString() : "No expiry"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Read Count</span>
                <p className="font-medium">{announcement.readCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
