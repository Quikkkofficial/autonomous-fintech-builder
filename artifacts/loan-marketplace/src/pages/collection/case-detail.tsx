import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Phone, Mail, MapPin } from "lucide-react";
import { formatINR } from "@/lib/format";

interface Followup { id: number; channel: string; outcome: string; notes: string | null; promisedAmount: string | null; promisedDate: string | null; createdAt: string }
interface CaseDetail {
  id: string; lenderName: string; type: string; amount: string; outstandingAmount: string | null; recoveredAmount: string;
  dpd: number; emi: string; tenureMonths: number; interestRate: string; status: string; statusHistory: Array<{ status: string; at: string; note: string }>;
  customer: { id: number; name: string | null; phone: string; email: string | null } | null;
  followups: Followup[];
}

export default function CaseDetailPage() {
  const [, params] = useRoute<{ id: string }>("/collection/cases/:id");
  const id = params?.id ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [followup, setFollowup] = useState({ channel: "call", outcome: "no_response", notes: "", promisedAmount: "", promisedDate: "" });
  const [payment, setPayment] = useState("");

  const cs = useQuery({ queryKey: ["collection", "case", id], queryFn: () => api<CaseDetail>(`/collection/cases/${id}`), enabled: !!id });

  const addFollowup = useMutation({
    mutationFn: () => api(`/collection/cases/${id}/followup`, {
      method: "POST",
      json: {
        channel: followup.channel, outcome: followup.outcome, notes: followup.notes || undefined,
        promisedAmount: followup.promisedAmount ? Number(followup.promisedAmount) : undefined,
        promisedDate: followup.promisedDate || undefined,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection", "case", id] });
      qc.invalidateQueries({ queryKey: ["collection", "stats"] });
      toast({ title: "Follow-up logged" });
      setFollowup({ channel: "call", outcome: "no_response", notes: "", promisedAmount: "", promisedDate: "" });
    },
  });

  const recordPayment = useMutation({
    mutationFn: () => api(`/collection/cases/${id}/payment`, { method: "POST", json: { amount: Number(payment) } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection"] });
      toast({ title: "Payment recorded" });
      setPayment("");
    },
    onError: () => toast({ title: "Failed to record payment", variant: "destructive" }),
  });

  if (cs.isLoading) {
    return <CollectionLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></CollectionLayout>;
  }
  if (!cs.data) return <CollectionLayout><p>Not found</p></CollectionLayout>;
  const c = cs.data;
  const out = Number(c.outstandingAmount ?? c.amount) - Number(c.recoveredAmount ?? 0);

  return (
    <CollectionLayout>
      <div className="space-y-6">
        <Link href="/collection/cases"><Button variant="ghost" size="sm" className="gap-1"><ChevronLeft className="h-4 w-4" />Back to cases</Button></Link>

        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Case {c.id}</h1>
            <p className="text-muted-foreground mt-1">{c.lenderName} · {c.type} loan</p>
          </div>
          <Badge variant={c.dpd > 60 ? "destructive" : "secondary"} className="text-sm px-3 py-1">{c.dpd} days past due</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Outstanding</div><div className="text-2xl font-bold mt-1">{formatINR(out)}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Recovered</div><div className="text-2xl font-bold mt-1">{formatINR(Number(c.recoveredAmount ?? 0))}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">EMI</div><div className="text-2xl font-bold mt-1">{formatINR(Number(c.emi))}</div><div className="text-xs text-muted-foreground mt-1">{c.tenureMonths} mo · {c.interestRate}%</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="font-semibold text-lg">{c.customer?.name ?? "—"}</div>
              <div className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> {c.customer?.phone}</div>
              {c.customer?.email && <div className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> {c.customer.email}</div>}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Log a follow-up</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); addFollowup.mutate(); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Channel">
                  <Select value={followup.channel} onValueChange={(v) => setFollowup({ ...followup, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["call", "sms", "email", "whatsapp", "visit"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Outcome">
                  <Select value={followup.outcome} onValueChange={(v) => setFollowup({ ...followup, outcome: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["no_response", "promised_to_pay", "partial_payment", "paid", "dispute", "wrong_number", "escalated"].map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Promised amount (₹)"><Input type="number" value={followup.promisedAmount} onChange={(e) => setFollowup({ ...followup, promisedAmount: e.target.value })} /></Field>
                <Field label="Promised date"><Input type="date" value={followup.promisedDate} onChange={(e) => setFollowup({ ...followup, promisedDate: e.target.value })} /></Field>
                <div className="sm:col-span-2"><Field label="Notes"><Textarea value={followup.notes} onChange={(e) => setFollowup({ ...followup, notes: e.target.value })} rows={3} /></Field></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={addFollowup.isPending}>{addFollowup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Log follow-up</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Record payment recovered</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); recordPayment.mutate(); }} className="flex gap-3 max-w-md">
              <Input type="number" placeholder="Amount in ₹" value={payment} onChange={(e) => setPayment(e.target.value)} required min="1" />
              <Button type="submit" disabled={recordPayment.isPending || !payment}>{recordPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Record</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Follow-up history</CardTitle></CardHeader>
          <CardContent>
            {c.followups.length === 0 && <p className="text-sm text-muted-foreground">No follow-ups yet.</p>}
            <div className="space-y-3">
              {c.followups.map((f) => (
                <div key={f.id} className="border-l-2 border-primary pl-3 py-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{f.channel}</Badge>
                    <Badge variant={f.outcome === "paid" ? "default" : "secondary"}>{f.outcome.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  {f.notes && <p className="text-sm mt-1">{f.notes}</p>}
                  {f.promisedAmount && <p className="text-xs text-muted-foreground">Promised {formatINR(Number(f.promisedAmount))}{f.promisedDate ? ` by ${f.promisedDate}` : ""}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CollectionLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
