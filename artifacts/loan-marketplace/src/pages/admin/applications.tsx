import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";

type AdminApp = {
  id: string; userId: number; lenderName: string; type: string; amount: string;
  tenureMonths: number; interestRate: string; emi: string; status: string;
  customerName: string | null; customerPhone: string | null;
  referredByPartnerId: number | null; commissionAmount: string | null;
  dpd: number; createdAt: string;
};

const STATUSES = ["submitted", "under_review", "approved", "disbursed", "rejected"];

export default function AdminApplications() {
  const [status, setStatus] = useState("all");
  const qc = useQueryClient();
  const { toast } = useToast();

  const apps = useQuery({
    queryKey: ["admin", "apps", status],
    queryFn: () => api<AdminApp[]>(`/admin/applications${status !== "all" ? `?status=${status}` : ""}`),
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground mt-1">Review and progress all loan applications.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={status === "all" ? "default" : "outline"} size="sm" onClick={() => setStatus("all")}>All</Button>
          {STATUSES.map((s) => (
            <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(s)}>{s}</Button>
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
                      <td className="py-2 pr-4"><Badge variant={a.status === "rejected" ? "destructive" : a.status === "disbursed" ? "default" : "secondary"}>{a.status}</Badge></td>
                      <td className="py-2 pr-4">{a.dpd > 0 ? <span className="text-destructive font-semibold">{a.dpd}</span> : "—"}</td>
                      <td className="py-2 pr-4 text-xs">{a.referredByPartnerId ? `#${a.referredByPartnerId}` : "—"}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Select value={a.status} onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}>
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {apps.data?.length === 0 && (
                    <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No applications.</td></tr>
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
