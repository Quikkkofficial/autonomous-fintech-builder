import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, CheckCircle2, XCircle, Clock, Send, RefreshCw, Filter, Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/format";

type Dispatch = {
  id: number;
  leadId: string;
  integrationId: string;
  integrationName: string;
  status: string;
  externalId: string | null;
  responseMessage: string | null;
  dispatchedAt: string;
  updatedAt: string;
  lead?: {
    customerName: string | null;
    customerPhone: string | null;
    type: string;
    amount: string;
    lenderName: string;
    referredByPartnerId: number | null;
  };
};

type Integration = { id: string; name: string };

const STATUS_BADGE: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700 border-blue-300",
  accepted: "bg-green-100 text-green-700 border-green-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  error: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent: <Send className="h-3.5 w-3.5" />,
  accepted: <CheckCircle2 className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  error: <XCircle className="h-3.5 w-3.5" />,
};

export default function AdminDispatchLog() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIntg, setFilterIntg] = useState("all");

  const dispatches = useQuery({
    queryKey: ["admin", "dispatches"],
    queryFn: () => api<Dispatch[]>("/admin/dispatches"),
    refetchInterval: 20_000,
  });

  const integrations = useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: () => api<Integration[]>("/admin/integrations"),
  });

  const repush = useMutation({
    mutationFn: (leadId: string) => api(`/admin/dispatches/repush/${leadId}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "dispatches"] });
      toast({ title: "Re-dispatched", description: "Lead sent to all active integrations." });
    },
    onError: () => toast({ title: "Re-dispatch failed", variant: "destructive" }),
  });

  const filtered = dispatches.data?.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterIntg !== "all" && d.integrationId !== filterIntg) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        d.leadId.toLowerCase().includes(s) ||
        (d.lead?.customerName ?? "").toLowerCase().includes(s) ||
        (d.lead?.customerPhone ?? "").toLowerCase().includes(s) ||
        d.integrationName.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const statsCounts = {
    total: dispatches.data?.length ?? 0,
    accepted: dispatches.data?.filter((d) => d.status === "accepted").length ?? 0,
    rejected: dispatches.data?.filter((d) => d.status === "rejected").length ?? 0,
    pending: dispatches.data?.filter((d) => d.status === "pending" || d.status === "sent").length ?? 0,
    error: dispatches.data?.filter((d) => d.status === "error").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lead Dispatch Log</h1>
            <p className="text-muted-foreground mt-1">
              Full history of leads forwarded to banks and NBFCs with real-time status.
            </p>
          </div>
          <Button variant="outline" onClick={() => dispatches.refetch()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${dispatches.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", val: statsCounts.total, color: "" },
            { label: "Accepted", val: statsCounts.accepted, color: "border-green-200 bg-green-50/40" },
            { label: "Rejected", val: statsCounts.rejected, color: "border-red-200 bg-red-50/40" },
            { label: "Pending", val: statsCounts.pending, color: "border-amber-200 bg-amber-50/40" },
            { label: "Error", val: statsCounts.error, color: "border-red-200 bg-red-50/40" },
          ].map((s) => (
            <Card key={s.label} className={s.color}>
              <CardContent className="pt-4">
                <Activity className="h-4 w-4 text-muted-foreground mb-1" />
                <div className="text-2xl font-bold">{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search lead ID, customer, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                {["all", "accepted", "rejected", "pending", "error"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={filterStatus === s ? "default" : "outline"}
                    onClick={() => setFilterStatus(s)}
                    className="capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant={filterIntg === "all" ? "default" : "outline"} onClick={() => setFilterIntg("all")}>All Banks</Button>
                {integrations.data?.map((i) => (
                  <Button key={i.id} size="sm" variant={filterIntg === i.id ? "default" : "outline"} onClick={() => setFilterIntg(i.id)}>
                    {i.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispatch Records</CardTitle>
            <CardDescription>{filtered?.length ?? 0} matching dispatches</CardDescription>
          </CardHeader>
          <CardContent>
            {dispatches.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Lead ID</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Type / Amount</th>
                    <th className="py-2 pr-4">Bank / NBFC</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">External ID</th>
                    <th className="py-2 pr-4">Message</th>
                    <th className="py-2 pr-4">Dispatched</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-4 font-mono text-xs">{d.leadId}</td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{d.lead?.customerName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{d.lead?.customerPhone}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="capitalize">{d.lead?.type ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{d.lead?.amount ? formatINR(Number(d.lead.amount)) : ""}</div>
                      </td>
                      <td className="py-2 pr-4 font-medium">{d.integrationName}</td>
                      <td className="py-2 pr-4">
                        <Badge className={`gap-1 text-xs ${STATUS_BADGE[d.status] ?? ""}`}>
                          {STATUS_ICON[d.status]}
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{d.externalId ?? "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground max-w-[160px] truncate" title={d.responseMessage ?? ""}>{d.responseMessage ?? "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(d.dispatchedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="py-2">
                        {(d.status === "error" || d.status === "rejected") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => repush.mutate(d.leadId)}
                            disabled={repush.isPending}
                          >
                            <RefreshCw className="h-3 w-3" />Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered?.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No dispatch records match the current filters.</td></tr>
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
