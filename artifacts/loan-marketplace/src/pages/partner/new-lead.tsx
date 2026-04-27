import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const LOAN_TYPES = ["personal", "home", "auto", "business", "education"];

export default function NewLead() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", lenderId: "", loanType: "personal",
    amount: "", tenureMonths: "36", purpose: "",
  });

  const lenders = useQuery({ queryKey: ["partner", "lenders"], queryFn: () => api<Array<any>>("/partner/lenders") });

  const create = useMutation({
    mutationFn: () => api(`/partner/leads`, {
      method: "POST",
      json: { ...form, amount: Number(form.amount), tenureMonths: Number(form.tenureMonths) },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner", "leads"] });
      qc.invalidateQueries({ queryKey: ["partner", "stats"] });
      toast({ title: "Lead created" });
      setLocation("/partner/leads");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const supportedTypes: string[] = lenders.data?.find((l) => l.id === form.lenderId)?.supportedTypes ?? LOAN_TYPES;

  return (
    <PartnerLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Lead</h1>
          <p className="text-muted-foreground mt-1">Submit a loan application on behalf of your customer.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Customer & loan details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Customer name" required>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
              </Field>
              <Field label="Customer phone" required>
                <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required pattern="[0-9]{10}" placeholder="10 digit number" />
              </Field>
              <Field label="Lender" required>
                <Select value={form.lenderId} onValueChange={(v) => setForm({ ...form, lenderId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose lender" /></SelectTrigger>
                  <SelectContent>
                    {lenders.data?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} · {l.minRate}%+</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Loan type" required>
                <Select value={form.loanType} onValueChange={(v) => setForm({ ...form, loanType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {supportedTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount (₹)" required>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="10000" />
              </Field>
              <Field label="Tenure (months)" required>
                <Input type="number" value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })} required min="6" max="360" />
              </Field>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-sm">Purpose / notes</Label>
                <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLocation("/partner/leads")}>Cancel</Button>
                <Button type="submit" disabled={create.isPending || !form.lenderId}>{create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit lead</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>{children}</div>;
}
