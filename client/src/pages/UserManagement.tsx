import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Settings, Loader2, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ROLE_DISPLAY_NAMES, ZEO_ROLES } from "@shared/permissions";
import type { ZeoRole } from "../../../drizzle/schema";
import { useState } from "react";

function UserManagementContent() {
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const usersQuery = trpc.users.list.useQuery({ page, pageSize });
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); usersQuery.refetch(); setEditUser(null); },
    onError: (err) => toast.error(err.message),
  });

  const [editUser, setEditUser] = useState<{ id: number; name: string | null; role: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState("");

  const usersList = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user accounts and role assignments ({total} users)
        </p>
      </div>

      {usersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : usersQuery.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-destructive text-sm">Error: {usersQuery.error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => usersQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : usersList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-2">
            {usersList.map((u: any) => (
              <Card key={u.id} className="hover:bg-accent/30 transition-colors">
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {u.name?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.name || "Unnamed"}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        <Shield className="h-3 w-3 mr-0.5" />
                        {ROLE_DISPLAY_NAMES[(u.role ?? "user") as ZeoRole] ?? u.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email ?? "No email"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setEditUser({ id: u.id, name: u.name, role: u.role }); setSelectedRole(u.role); }}>
                    Edit Role
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role — {editUser?.name ?? "User"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {ZEO_ROLES.map(r => (
                  <SelectItem key={r} value={r}>{ROLE_DISPLAY_NAMES[r as ZeoRole] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              disabled={updateRoleMutation.isPending || selectedRole === editUser?.role}
              onClick={() => { if (editUser) updateRoleMutation.mutate({ userId: editUser.id, role: selectedRole }); }}
            >
              {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UserManagement() {
  return (
    <DashboardLayout>
      <UserManagementContent />
    </DashboardLayout>
  );
}
