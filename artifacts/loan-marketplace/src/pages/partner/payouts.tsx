import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";

type Payout = { id: number; applicationId: string; amount: string; status: string; paidAt: string | null; createdAt: string };

export default function PartnerPayouts() {
  const payouts = useQuery({ queryKey: ["partner", "payouts"], queryFn: () => api<Payout[]>("/partner/payouts") });

  const totalPaid = payouts.data?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalPending = payouts.data?.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground mt-1">Commission for every disbursed loan you've sourced.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Pending</div><div className="text-2xl font-bold mt-1">{formatINR(totalPending)}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Paid out</div><div className="text-2xl font-bold mt-1">{formatINR(totalPaid)}</div></CardContent></Card>
        </div>
        <Card><CardContent className="pt-6">
          {payouts.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground"><tr><th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Application</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2">Date</th></tr></thead>
              <tbody>
                {payouts.data?.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">#{p.id}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{p.applicationId}</td>
                    <td className="py-2 pr-4 text-right font-medium">{formatINR(Number(p.amount))}</td>
                    <td className="py-2 pr-4"><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge></td>
                    <td className="py-2 text-xs">{p.paidAt ? `Paid ${new Date(p.paidAt).toLocaleDateString()}` : new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {payouts.data?.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No payouts yet — disburse leads to earn commission.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </PartnerLayout>
  );
}
