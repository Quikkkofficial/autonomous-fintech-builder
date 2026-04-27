import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";

type Payout = { id: number; partnerId: number; applicationId: string; amount: string; status: string; paidAt: string | null; createdAt: string };

export default function AdminPayouts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useQuery({ queryKey: ["admin", "payouts"], queryFn: () => api<Payout[]>("/admin/payouts") });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api(`/admin/payouts/${id}`, { method: "PATCH", json: { status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "payouts"] }); toast({ title: "Updated" }); },
  });

  const totalPending = list.data?.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalPaid = list.data?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Payouts</h1>
          <p className="text-muted-foreground mt-1">Approve and track channel partner commissions.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Pending payouts</div><div className="text-2xl font-bold mt-1">{formatINR(totalPending)}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Paid this period</div><div className="text-2xl font-bold mt-1">{formatINR(totalPaid)}</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            {list.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr><th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Partner</th><th className="py-2 pr-4">App</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Created</th><th className="py-2">Action</th></tr>
                </thead>
                <tbody>
                  {list.data?.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">#{p.id}</td>
                      <td className="py-2 pr-4">Partner #{p.partnerId}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{p.applicationId}</td>
                      <td className="py-2 pr-4 text-right font-medium">{formatINR(Number(p.amount))}</td>
                      <td className="py-2 pr-4"><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge></td>
                      <td className="py-2 pr-4 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        {p.status === "pending" ? (
                          <Button size="sm" onClick={() => update.mutate({ id: p.id, status: "paid" })}>Mark paid</Button>
                        ) : <span className="text-xs text-muted-foreground">paid {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}</span>}
                      </td>
                    </tr>
                  ))}
                  {list.data?.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No payouts yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
