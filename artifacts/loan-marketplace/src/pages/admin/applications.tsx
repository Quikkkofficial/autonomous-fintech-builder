import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatINR } from "@/lib/format";

type AdminApp = {
  id: string; userId: number; lenderName: string; type: string; amount: string;
  tenureMonths: number; interestRate: string; emi: string; status: string;
  customerName: string | null; customerPhone: string | null;
  referredByPartnerId: number | null; commissionAmount: string | null;
  dpd: number; createdAt: string;
};

type Dispatch = {
  id: number;
  leadId: string;
  integrationId: string;
  integrationName: string;
  status: string;
};

const STATUSES = ["submitted", "under_review", "approved", "disbursed", "rejected"];

const DISPATCH_ICON: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="h-3 w-3 text-green-600" />,
  rejected: <XCircle className="h-3 w-3 text-red-500" />,
  sent: <Send className="h-3 w-3 text-blue-500" />,
  error: <XCircle className="h-3 w-3 text-red-400" />,
  pending: <Clock className="h-3 w-3 text-amber-500" />,
};

const DISPATCH_COLOR: Record<string, string> = {
  accepted: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  error: "bg-red-50 text-red-500 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function DispatchBadges({ appId, dispatches }: { appId: string; dispatches: Dispatch[] }) {
  const mine = dispatches.filter((d) => d.leadId === appId);
  if (mine.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {mine.map((d) => (
        <div key={d.id} className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${DISPATCH_COLOR[d.status] ?? "bg-muted text-muted-foreground"}`}>
          {DISPATCH_ICON[d.status]}
          <span className="font-medium truncate max-w-[80px]">{d.integrationName}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminApplications() {
  const [status, setStatus] = useState("all");
  const qc = useQueryClient();
  const { toast } = useToast();

  const apps = useQuery({
    queryKey: ["admin", "apps", status],
    queryFn: () => api<AdminApp[]>(`/admin/applications${status !== "all" ? `?status=${status}` : ""}`),
  });

  const dispatches = useQuery({
    queryKey: ["admin", "dispatches"],
    queryFn: () => api<Dispatch[]>("/admin/dispatches"),
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/admin/applications/${id}`, { method: "PATCH", json: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "apps"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Application updated" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const repush = useMutation({
    mutationFn: (leadId: string) => api(`/admin/dispatches/repush/${leadId}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "dispatches"] });
      toast({ title: "Re-dispatched to all active banks" });
    },
    onError: () => toast({ title: "Dispatch failed — no active integrations?", variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground mt-1">Review, progress, and track lead dispatch status per bank / NBFC.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={status === "all" ? "default" : "outline"} size="sm" onClick={() => setStatus("all")}>All</Button>
          {STATUSES.map((s) => (
            <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(s)} className="capitalize">{s.replace("_", " ")}</Button>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {apps.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-4">App ID</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Lender</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2 pr-4 text-right">EMI</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">DPD</th>
                    <th className="py-2 pr-4">Partner</th>
                    <th className="py-2 pr-4">Dispatched to</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.data?.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-4 font-mono text-xs">{a.id}</td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{a.customerName ?? `User #${a.userId}`}</div>
                        <div className="text-xs text-muted-foreground">{a.customerPhone}</div>
                      </td>
                      <td className="py-2 pr-4">{a.lenderName}</td>
                      <td className="py-2 pr-4 capitalize">{a.type}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(Number(a.amount))}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(Number(a.emi))}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={a.status === "rejected" ? "destructive" : a.status === "disbursed" ? "default" : "secondary"} className="capitalize">
                          {a.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{a.dpd > 0 ? <span className="text-destructive font-semibold">{a.dpd}</span> : "—"}</td>
                      <td className="py-2 pr-4 text-xs">{a.referredByPartnerId ? `#${a.referredByPartnerId}` : "—"}</td>
                      <td className="py-2 pr-4">
                        <DispatchBadges appId={a.id} dispatches={dispatches.data ?? []} />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <Select value={a.status} onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}>
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            title="Re-dispatch to all active banks"
                            onClick={() => repush.mutate(a.id)}
                            disabled={repush.isPending}
                          >
                            {repush.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {apps.data?.length === 0 && (
                    <tr><td colSpan={11} className="py-8 text-center text-muted-foreground">No applications.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
