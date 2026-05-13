import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Filter, Download, Send, RefreshCw } from "lucide-react";
import { formatINR } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  lenderName: string;
  type: string;
  amount: string;
  tenureMonths: number;
  emi: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  commissionAmount: string | null;
  createdAt: string;
  umLeadId: string | null;
  umStatus: string | null;
  umPushedAt: string | null;
};

function UmBadge({ lead }: { lead: Lead }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const push = useMutation({
    mutationFn: () => api(`/um/push/${lead.id}`, { method: "POST" }),
    onSuccess: (d: any) => {
      toast({
        title: d.ok ? "Lead accepted by Urban Money" : "UM push failed",
        description: d.ok ? `UM Lead ID: ${d.umLeadId ?? "assigned"}` : d.message,
        variant: d.ok ? "default" : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["partner", "leads"] });
    },
    onError: () => toast({ title: "Push failed", variant: "destructive" }),
  });

  if (lead.umStatus === "pushed") {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge className="text-[10px] h-4 px-1.5 bg-green-100 text-green-700 border-green-300 w-fit">UM ✓</Badge>
        {lead.umLeadId && <span className="text-[10px] font-mono text-muted-foreground">{lead.umLeadId}</span>}
      </div>
    );
  }
  if (lead.umStatus === "failed") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="h-6 text-[10px] text-red-600 hover:text-red-700 px-1.5 gap-1"
        onClick={() => push.mutate()}
        disabled={push.isPending}
      >
        {push.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Retry
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-1.5 gap-1"
      onClick={() => push.mutate()}
      disabled={push.isPending}
    >
      {push.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
      Push
    </Button>
  );
}

export default function PartnerLeads() {
  const leads = useQuery({ queryKey: ["partner", "leads"], queryFn: () => api<Lead[]>("/partner/leads") });
  const stats = useQuery({ queryKey: ["partner", "stats"], queryFn: () => api<any>("/partner/stats") });

  const pushedCount = leads.data?.filter((l) => l.umStatus === "pushed").length ?? 0;
  const pendingCount = leads.data?.filter((l) => !l.umStatus || l.umStatus === "failed").length ?? 0;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Leads</h1>
            <p className="text-muted-foreground mt-1">All loan applications you've sourced — auto-pushed to Urban Money.</p>
          </div>
          <Link href="/partner/leads/new"><Button><PlusCircle className="h-4 w-4 mr-2" />New lead</Button></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total pipeline</div><div className="text-2xl font-bold mt-1">{stats.data?.leads.total ?? 0}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Disbursed</div><div className="text-2xl font-bold mt-1">{stats.data?.leads.disbursed ?? 0}</div></CardContent></Card>
          <Card className="border-green-200 bg-green-50/40"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">UM Pushed</div><div className="text-2xl font-bold mt-1 text-green-700">{pushedCount}</div></CardContent></Card>
          <Card className={pendingCount > 0 ? "border-amber-200 bg-amber-50/40" : ""}><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Pending push</div><div className="text-2xl font-bold mt-1">{pendingCount}</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Search customer / phone" />
            <Input placeholder="Filter by lender" />
            <Input placeholder="Filter by status" />
            <div className="flex gap-2">
              <Button variant="outline" className="w-full"><Filter className="h-4 w-4 mr-2" />Filter</Button>
              <Button variant="outline" className="w-full"><Download className="h-4 w-4 mr-2" />Export</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {leads.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">App ID</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Lender</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2 pr-4 text-right">EMI</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Urban Money</th>
                    <th className="py-2 pr-4">Commission</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.data?.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-4 font-mono text-xs">{l.id}</td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{l.customerName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.customerPhone}</div>
                      </td>
                      <td className="py-2 pr-4">{l.lenderName}</td>
                      <td className="py-2 pr-4 capitalize">{l.type}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(Number(l.amount))}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(Number(l.emi))}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={l.status === "rejected" ? "destructive" : l.status === "disbursed" ? "default" : "secondary"}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <UmBadge lead={l} />
                      </td>
                      <td className="py-2 pr-4">{l.commissionAmount ? formatINR(Number(l.commissionAmount)) : "—"}</td>
                      <td className="py-2 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {leads.data?.length === 0 && (
                    <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No leads yet. Click "New lead" to create one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
