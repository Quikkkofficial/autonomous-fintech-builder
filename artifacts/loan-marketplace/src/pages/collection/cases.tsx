import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { api } from "@/lib/api";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PhoneCall, MessageSquare, Mail, Globe2, Clock3, Route } from "lucide-react";
import { formatINR } from "@/lib/format";

type Case = {
  id: string; lenderName: string; type: string; amount: string;
  outstandingAmount: string | null; recoveredAmount: string; dpd: number;
  assignedCollectorId: number | null; customerName: string | null; customerPhone: string | null;
};

export default function CollectionCases() {
  const [location] = useLocation();
  const initial = new URLSearchParams(location.split("?")[1] ?? "").get("filter") ?? "mine";
  const [filter, setFilter] = useState<string>(initial);
  const qc = useQueryClient();
  const { toast } = useToast();

  const cases = useQuery({ queryKey: ["collection", "cases", filter], queryFn: () => api<Case[]>(`/collection/cases?filter=${filter}`) });
  const assign = useMutation({
    mutationFn: (id: string) => api(`/collection/cases/${id}/assign`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection"] });
      toast({ title: "Case assigned to you" });
    },
  });

  return (
    <CollectionLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collection Cases</h1>
          <p className="text-muted-foreground mt-1">Manage overdue accounts and log follow-ups.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "mine" ? "default" : "outline"} size="sm" onClick={() => setFilter("mine")}>My cases</Button>
          <Button variant={filter === "unassigned" ? "default" : "outline"} size="sm" onClick={() => setFilter("unassigned")}>Unassigned</Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All overdue</Button>
        </div>
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-4 bg-muted/20"><div className="font-medium">Omni-channel queue</div><p className="text-xs text-muted-foreground mt-1">One view for calls, SMS, email, WhatsApp, and visits.</p></div>
            <div className="rounded-xl border p-4 bg-muted/20"><div className="font-medium">Trackable journeys</div><p className="text-xs text-muted-foreground mt-1">Every follow-up gets a channel, outcome, and promise-to-pay.</p></div>
            <div className="rounded-xl border p-4 bg-muted/20"><div className="font-medium">SLA / route planning</div><p className="text-xs text-muted-foreground mt-1">Prioritize cases by DPD and next-best action.</p></div>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-6">
          {cases.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground"><tr><th className="py-2 pr-4">App ID</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Lender</th><th className="py-2 pr-4 text-right">Outstanding</th><th className="py-2 pr-4 text-right">Recovered</th><th className="py-2 pr-4">DPD</th><th className="py-2">Action</th></tr></thead>
              <tbody>
                {cases.data?.map((c) => {
                  const out = Number(c.outstandingAmount ?? c.amount) - Number(c.recoveredAmount ?? 0);
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{c.id}</td>
                      <td className="py-2 pr-4"><div className="font-medium">{c.customerName ?? "—"}</div><div className="text-xs text-muted-foreground">{c.customerPhone}</div></td>
                      <td className="py-2 pr-4">{c.lenderName}</td>
                      <td className="py-2 pr-4 text-right font-medium">{formatINR(out)}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(Number(c.recoveredAmount))}</td>
                      <td className="py-2 pr-4"><Badge variant={c.dpd > 60 ? "destructive" : "secondary"}>{c.dpd} days</Badge></td>
                      <td className="py-2">
                        {c.assignedCollectorId ? (
                          <Link href={`/collection/cases/${c.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                        ) : (
                          <Button size="sm" onClick={() => assign.mutate(c.id)}>Assign to me</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {cases.data?.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No cases in this view.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </CollectionLayout>
  );
}
