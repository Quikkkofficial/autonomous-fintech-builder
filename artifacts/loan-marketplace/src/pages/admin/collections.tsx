import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";

type Case = { id: string; userId: number; lenderName: string; type: string; amount: string; outstandingAmount: string | null; recoveredAmount: string; dpd: number; assignedCollectorId: number | null; customerName: string | null; customerPhone: string | null };

export default function AdminCollections() {
  const cases = useQuery({ queryKey: ["admin", "collections"], queryFn: () => api<Case[]>("/admin/collections") });

  const bucket = (n: number) => n > 90 ? "90+" : n > 60 ? "61-90" : n > 30 ? "31-60" : "1-30";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground mt-1">Overdue accounts across all collection partners.</p>
        </div>
        <Card><CardContent className="pt-6">
          {cases.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="py-2 pr-4">App ID</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Lender</th><th className="py-2 pr-4 text-right">Outstanding</th><th className="py-2 pr-4 text-right">Recovered</th><th className="py-2 pr-4">DPD</th><th className="py-2 pr-4">Bucket</th><th className="py-2">Assigned</th></tr>
              </thead>
              <tbody>
                {cases.data?.map((c) => {
                  const out = Number(c.outstandingAmount ?? c.amount) - Number(c.recoveredAmount ?? 0);
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{c.id}</td>
                      <td className="py-2 pr-4"><div className="font-medium">{c.customerName ?? `User #${c.userId}`}</div><div className="text-xs text-muted-foreground">{c.customerPhone}</div></td>
                      <td className="py-2 pr-4">{c.lenderName}</td>
                      <td className="py-2 pr-4 text-right font-medium">{formatINR(out)}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(Number(c.recoveredAmount))}</td>
                      <td className="py-2 pr-4 text-destructive font-semibold">{c.dpd}</td>
                      <td className="py-2 pr-4"><Badge variant={c.dpd > 60 ? "destructive" : "secondary"}>{bucket(c.dpd)}</Badge></td>
                      <td className="py-2">{c.assignedCollectorId ? `#${c.assignedCollectorId}` : <Badge variant="outline">unassigned</Badge>}</td>
                    </tr>
                  );
                })}
                {cases.data?.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No overdue cases.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </AdminLayout>
  );
}
