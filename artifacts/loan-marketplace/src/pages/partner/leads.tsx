import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle } from "lucide-react";
import { formatINR } from "@/lib/format";

type Lead = { id: string; lenderName: string; type: string; amount: string; tenureMonths: number; emi: string; status: string; customerName: string | null; customerPhone: string | null; commissionAmount: string | null; createdAt: string };

export default function PartnerLeads() {
  const leads = useQuery({ queryKey: ["partner", "leads"], queryFn: () => api<Lead[]>("/partner/leads") });

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Leads</h1>
            <p className="text-muted-foreground mt-1">All loan applications you've sourced.</p>
          </div>
          <Link href="/partner/leads/new"><Button><PlusCircle className="h-4 w-4 mr-2" />New lead</Button></Link>
        </div>
        <Card><CardContent className="pt-6">
          {leads.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="py-2 pr-4">App ID</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Lender</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4 text-right">EMI</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Commission</th><th className="py-2">Created</th></tr>
              </thead>
              <tbody>
                {leads.data?.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-4 font-mono text-xs">{l.id}</td>
                    <td className="py-2 pr-4"><div className="font-medium">{l.customerName ?? "—"}</div><div className="text-xs text-muted-foreground">{l.customerPhone}</div></td>
                    <td className="py-2 pr-4">{l.lenderName}</td>
                    <td className="py-2 pr-4 capitalize">{l.type}</td>
                    <td className="py-2 pr-4 text-right">{formatINR(Number(l.amount))}</td>
                    <td className="py-2 pr-4 text-right">{formatINR(Number(l.emi))}</td>
                    <td className="py-2 pr-4"><Badge variant={l.status === "rejected" ? "destructive" : l.status === "disbursed" ? "default" : "secondary"}>{l.status}</Badge></td>
                    <td className="py-2 pr-4">{l.commissionAmount ? formatINR(Number(l.commissionAmount)) : "—"}</td>
                    <td className="py-2 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {leads.data?.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No leads yet. Click "New lead" to create one.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </PartnerLayout>
  );
}
