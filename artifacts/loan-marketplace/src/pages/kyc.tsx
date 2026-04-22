import { useState } from "react";
import { useLocation } from "wouter";
import { useSubmitKyc, useGetKyc, getGetMeQueryKey, getGetKycQueryKey } from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, IdCard, CheckCircle2 } from "lucide-react";
import { statusColor } from "@/lib/format";

export default function Kyc() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: existing } = useGetKyc({ query: { queryKey: getGetKycQueryKey(), retry: false } });
  const submit = useSubmitKyc();

  const [form, setForm] = useState({
    fullName: "",
    pan: "",
    aadhaar: "",
    dob: "",
    address: "",
    bankAccount: "",
    ifsc: "",
    monthlyIncome: "",
    employmentType: "salaried" as "salaried" | "self_employed" | "business_owner" | "freelancer",
  });

  if (existing && existing.status === "verified") {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle>KYC Verified</CardTitle>
            <CardDescription>Your identity has been verified successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Full Name" value={existing.fullName} />
              <Field label="PAN" value={existing.panMasked} />
              <Field label="Aadhaar" value={existing.aadhaarMasked} />
              <Field label="DOB" value={existing.dob} />
              <Field label="Bank Account" value={existing.bankAccountMasked} />
              <Field label="IFSC" value={existing.ifsc} />
              <Field label="Monthly Income" value={existing.monthlyIncome ? "₹" + existing.monthlyIncome.toLocaleString("en-IN") : ""} />
              <Field label="Employment" value={existing.employmentType} />
            </div>
            <div className="pt-4 flex gap-3">
              <Badge className={statusColor("verified")}>Verified</Badge>
              <Button onClick={() => setLocation("/dashboard")} className="ml-auto">Continue to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.toUpperCase())) {
      toast({ title: "Invalid PAN", description: "Format: ABCDE1234F", variant: "destructive" });
      return;
    }
    if (!/^\d{12}$/.test(form.aadhaar)) {
      toast({ title: "Invalid Aadhaar", description: "Must be 12 digits", variant: "destructive" });
      return;
    }
    if (!/^\d{9,18}$/.test(form.bankAccount)) {
      toast({ title: "Invalid bank account", variant: "destructive" });
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase())) {
      toast({ title: "Invalid IFSC code", variant: "destructive" });
      return;
    }
    const income = Number(form.monthlyIncome);
    if (!income || income < 10000) {
      toast({ title: "Invalid monthly income", variant: "destructive" });
      return;
    }
    try {
      await submit.mutateAsync({
        data: {
          fullName: form.fullName,
          pan: form.pan.toUpperCase(),
          aadhaar: form.aadhaar,
          dob: form.dob,
          address: form.address,
          bankAccount: form.bankAccount,
          ifsc: form.ifsc.toUpperCase(),
          monthlyIncome: income,
          employmentType: form.employmentType,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await qc.invalidateQueries({ queryKey: getGetKycQueryKey() });
      toast({ title: "KYC Verified", description: "Welcome aboard! Your credit profile is ready." });
      setLocation("/dashboard");
    } catch {
      toast({ title: "Verification failed", description: "Please check your details and try again", variant: "destructive" });
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Complete your KYC
        </h1>
        <p className="text-muted-foreground mt-1">Verify your identity to unlock loan offers from 12+ partner banks.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IdCard className="w-5 h-5" /> Identity & Income</CardTitle>
          <CardDescription>Your data is encrypted and shared only with chosen lenders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name (as on PAN)</Label>
                <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Rahul Sharma" />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="pan">PAN Number</Label>
                <Input id="pan" required maxLength={10} value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
              </div>
              <div>
                <Label htmlFor="aadhaar">Aadhaar Number</Label>
                <Input id="aadhaar" required maxLength={12} value={form.aadhaar} onChange={(e) => setForm({ ...form, aadhaar: e.target.value.replace(/\D/g, "") })} placeholder="123412341234" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, State, PIN" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input id="bankAccount" required value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value.replace(/\D/g, "") })} placeholder="123456789012" />
              </div>
              <div>
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input id="ifsc" required maxLength={11} value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} placeholder="HDFC0001234" />
              </div>
              <div>
                <Label htmlFor="income">Monthly Income (₹)</Label>
                <Input id="income" type="number" required value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} placeholder="50000" />
              </div>
              <div>
                <Label htmlFor="employment">Employment Type</Label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v as typeof form.employmentType })}>
                  <SelectTrigger id="employment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">Salaried</SelectItem>
                    <SelectItem value="self_employed">Self-employed</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
