import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Lender = {
  id: string; name: string; type: string; tagline: string | null;
  minRate: string; maxRate: string; minAmount: string; maxAmount: string;
  processingFeePct: string; minIncome: string; minCreditScore: number;
  approvalHours: number; rating: string;
};

export default function AdminLenders() {
  const [editing, setEditing] = useState<Lender | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const lenders = useQuery({ queryKey: ["admin", "lenders"], queryFn: () => api<Lender[]>("/admin/lenders") });
  const update = useMutation({
    mutationFn: (l: Lender) => api(`/admin/lenders/${l.id}`, {
      method: "PATCH",
      json: {
        name: l.name, tagline: l.tagline, minRate: l.minRate, maxRate: l.maxRate,
        minAmount: l.minAmount, maxAmount: l.maxAmount, processingFeePct: l.processingFeePct,
        minIncome: l.minIncome, minCreditScore: Number(l.minCreditScore), approvalHours: Number(l.approvalHours), rating: l.rating,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "lenders"] });
      setEditing(null);
      toast({ title: "Lender updated" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lenders</h1>
          <p className="text-muted-foreground mt-1">Manage marketplace partners and their offering parameters.</p>
        </div>

        {lenders.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lenders.data?.map((l) => (
            <Card key={l.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{l.name}</span>
                  <span className="text-xs uppercase text-muted-foreground">{l.type}</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{l.tagline}</p>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span>{l.minRate}% – {l.maxRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>₹{Number(l.minAmount).toLocaleString("en-IN")} – ₹{Number(l.maxAmount).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Min income</span><span>₹{Number(l.minIncome).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Min credit score</span><span>{l.minCreditScore}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Approval</span><span>{l.approvalHours} hrs</span></div>
                <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setEditing(l)}>Edit</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader><CardTitle>Edit {editing.name}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); update.mutate(editing); }} className="grid grid-cols-2 gap-3">
                  <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
                  <Field label="Tagline"><Input value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></Field>
                  <Field label="Min Rate %"><Input value={editing.minRate} onChange={(e) => setEditing({ ...editing, minRate: e.target.value })} /></Field>
                  <Field label="Max Rate %"><Input value={editing.maxRate} onChange={(e) => setEditing({ ...editing, maxRate: e.target.value })} /></Field>
                  <Field label="Min Amount"><Input value={editing.minAmount} onChange={(e) => setEditing({ ...editing, minAmount: e.target.value })} /></Field>
                  <Field label="Max Amount"><Input value={editing.maxAmount} onChange={(e) => setEditing({ ...editing, maxAmount: e.target.value })} /></Field>
                  <Field label="Processing Fee %"><Input value={editing.processingFeePct} onChange={(e) => setEditing({ ...editing, processingFeePct: e.target.value })} /></Field>
                  <Field label="Min Income"><Input value={editing.minIncome} onChange={(e) => setEditing({ ...editing, minIncome: e.target.value })} /></Field>
                  <Field label="Min Credit Score"><Input value={String(editing.minCreditScore)} onChange={(e) => setEditing({ ...editing, minCreditScore: Number(e.target.value) })} /></Field>
                  <Field label="Approval Hours"><Input value={String(editing.approvalHours)} onChange={(e) => setEditing({ ...editing, approvalHours: Number(e.target.value) })} /></Field>
                  <Field label="Rating"><Input value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: e.target.value })} /></Field>
                  <div className="col-span-2 flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                    <Button type="submit" disabled={update.isPending}>{update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
