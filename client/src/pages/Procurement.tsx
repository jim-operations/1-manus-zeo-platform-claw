import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight, ShoppingCart, Store } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const PR_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  ordered: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
};

function ProcurementContent() {
  const [tab, setTab] = useState("requisitions");
  const [prPage, setPrPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  const prQuery = trpc.finance.procurement.list.useQuery({
    page: prPage,
    pageSize: 20,
    status: statusFilter,
  });

  const vendorQuery = trpc.finance.vendors.list.useQuery({
    page: vendorPage,
    pageSize: 20,
  });

  const utils = trpc.useUtils();

  const createPrMutation = trpc.finance.procurement.create.useMutation({
    onSuccess: () => {
      toast.success("Purchase requisition submitted");
      utils.finance.procurement.list.invalidate();
      setPrDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const reviewMutation = trpc.finance.procurement.review.useMutation({
    onSuccess: () => {
      toast.success("Requisition updated");
      utils.finance.procurement.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createVendorMutation = trpc.finance.vendors.create.useMutation({
    onSuccess: () => {
      toast.success("Vendor registered");
      utils.finance.vendors.list.invalidate();
      setVendorDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreatePr = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const itemsText = fd.get("items") as string;
    const parsedItems = itemsText.split("\n").filter(Boolean).map((line) => {
      const parts = line.trim();
      return { name: parts, quantity: 1, unitPrice: Number(fd.get("estimatedCost")) || 0, total: Number(fd.get("estimatedCost")) || 0 };
    });
    createPrMutation.mutate({
      schoolId: Number(fd.get("schoolId")),
      budgetId: fd.get("budgetId") ? Number(fd.get("budgetId")) : undefined,
      title: fd.get("title") as string,
      items: parsedItems,
      totalEstimatedCost: Number(fd.get("estimatedCost")),
      justification: (fd.get("justification") as string) || undefined,
    });
  };

  const handleCreateVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createVendorMutation.mutate({
      name: fd.get("name") as string,
      registrationNumber: (fd.get("registrationNumber") as string) || undefined,
      contactPerson: (fd.get("contactPerson") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      category: (fd.get("category") as "stationery" | "equipment" | "furniture" | "construction" | "services" | "food" | "transport" | "other") || "other",
    });
  };

  const requisitions = prQuery.data?.items ?? [];
  const prTotalPages = prQuery.data ? Math.ceil(prQuery.data.total / 20) : 1;
  const vendors = vendorQuery.data?.items ?? [];
  const vendorTotalPages = vendorQuery.data ? Math.ceil(vendorQuery.data.total / 20) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Procurement</h1>
          <p className="text-muted-foreground">Manage purchase requisitions and vendors</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="requisitions" className="gap-2"><ShoppingCart className="w-4 h-4" />Requisitions</TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2"><Store className="w-4 h-4" />Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Select value={statusFilter ?? "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? undefined : v); setPrPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={prDialogOpen} onOpenChange={setPrDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />New Requisition</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Submit Purchase Requisition</DialogTitle></DialogHeader>
                <form onSubmit={handleCreatePr} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input name="title" required />
                  </div>
                  <div>
                    <Label>School ID</Label>
                    <Input name="schoolId" type="number" required />
                  </div>
                  <div>
                    <Label>Budget ID (optional)</Label>
                    <Input name="budgetId" type="number" />
                  </div>
                  <div>
                    <Label>Items (describe items needed)</Label>
                    <Textarea name="items" required placeholder="List items, quantities, and specifications..." />
                  </div>
                  <div>
                    <Label>Estimated Cost (LKR)</Label>
                    <Input name="estimatedCost" type="number" min="1" step="0.01" required />
                  </div>
                  <div>
                    <Label>Justification</Label>
                    <Textarea name="justification" placeholder="Why is this purchase necessary?" />
                  </div>
                  <Button type="submit" disabled={createPrMutation.isPending} className="w-full">
                    {createPrMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Requisition
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {prQuery.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Title</th>
                        <th className="text-left p-3 font-medium">School</th>
                        <th className="text-right p-3 font-medium">Est. Cost</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisitions.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No requisitions found</td></tr>
                      ) : requisitions.map((pr: any) => (
                        <tr key={pr.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-medium">{pr.title}</td>
                          <td className="p-3">School #{pr.schoolId}</td>
                          <td className="p-3 text-right font-mono">
                            {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(pr.estimatedCost))}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={PR_STATUS_COLORS[pr.status] ?? "bg-gray-100"}>{pr.status?.replace("_", " ")}</Badge>
                          </td>
                          <td className="p-3">{new Date(pr.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 text-center space-x-1">
                            {(pr.status === "submitted" || pr.status === "under_review") && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ id: pr.id, status: "approved" })}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => reviewMutation.mutate({ id: pr.id, status: "rejected", reviewComment: "Rejected" })}>
                                  Reject
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {prTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={prPage <= 1} onClick={() => setPrPage(prPage - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {prPage} of {prTotalPages}</span>
              <Button variant="outline" size="sm" disabled={prPage >= prTotalPages} onClick={() => setPrPage(prPage + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Register Vendor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Register New Vendor</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateVendor} className="space-y-4">
                  <div>
                    <Label>Vendor Name</Label>
                    <Input name="name" required />
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <Input name="registrationNumber" />
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input name="contactPerson" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input name="phone" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input name="email" type="email" />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea name="address" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input name="category" placeholder="e.g., stationery, equipment, IT" />
                  </div>
                  <Button type="submit" disabled={createVendorMutation.isPending} className="w-full">
                    {createVendorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Register Vendor
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {vendorQuery.isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Reg. Number</th>
                        <th className="text-left p-3 font-medium">Contact</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-center p-3 font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No vendors registered</td></tr>
                      ) : vendors.map((v: any) => (
                        <tr key={v.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-medium">{v.name}</td>
                          <td className="p-3">{v.registrationNumber || "—"}</td>
                          <td className="p-3">{v.contactPerson || "—"}</td>
                          <td className="p-3">{v.phone || "—"}</td>
                          <td className="p-3 capitalize">{v.category || "—"}</td>
                          <td className="p-3 text-center">{v.rating ? `${v.rating}/5` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {vendorTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={vendorPage <= 1} onClick={() => setVendorPage(vendorPage - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {vendorPage} of {vendorTotalPages}</span>
              <Button variant="outline" size="sm" disabled={vendorPage >= vendorTotalPages} onClick={() => setVendorPage(vendorPage + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Procurement() {
  return (<DashboardLayout><ProcurementContent /></DashboardLayout>);
}
