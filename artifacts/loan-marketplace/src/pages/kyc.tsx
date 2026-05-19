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
import {
  Loader2, ShieldCheck, IdCard, CheckCircle2, AlertCircle, User, Building2, CreditCard, Wallet,
} from "lucide-react";
import { statusColor } from "@/lib/format";

function validate(form: {
  fullName: string; pan: string; aadhaar: string; dob: string; address: string;
  bankAccount: string; ifsc: string; monthlyIncome: string; employmentType: string;
}) {
  const errs: Record<string, string> = {};
  if (!form.fullName.trim() || form.fullName.trim().length < 3) errs.fullName = "Enter your full name (min 3 chars)";
  if (!form.dob) errs.dob = "Date of birth is required";
  else {
    const age = (Date.now() - new Date(form.dob).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age < 18) errs.dob = "Must be 18 or older";
    if (age > 75) errs.dob = "Age cannot exceed 75 years";
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.toUpperCase())) errs.pan = "Format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
  if (!/^\d{12}$/.test(form.aadhaar)) errs.aadhaar = "Must be exactly 12 digits";
  if (!form.address.trim() || form.address.trim().length < 10) errs.address = "Enter your full address (min 10 chars)";
  if (!/^\d{9,18}$/.test(form.bankAccount)) errs.bankAccount = "Must be 9–18 digits";
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase())) errs.ifsc = "Format: HDFC0001234 (4 letters, 0, 6 alphanumeric)";
  const income = Number(form.monthlyIncome);
  if (!income || income < 10000) errs.monthlyIncome = "Minimum monthly income is ₹10,000";
  if (income > 10000000) errs.monthlyIncome = "Please enter a valid income amount";
  return errs;
}

const STEPS = [
  { id: "personal", label: "Personal", icon: User, fields: ["fullName", "dob", "pan", "aadhaar"] },
  { id: "address", label: "Address", icon: Building2, fields: ["address"] },
  { id: "bank", label: "Bank", icon: Wallet, fields: ["bankAccount", "ifsc"] },
  { id: "income", label: "Income", icon: CreditCard, fields: ["monthlyIncome", "employmentType"] },
];

function FieldStatus({ error, dirty }: { error?: string; dirty: boolean }) {
  if (!dirty) return null;
  if (error) return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>;
  return <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Looks good</p>;
}

export default function Kyc() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: existing } = useGetKyc({ query: { queryKey: getGetKycQueryKey(), retry: false } });
  const submit = useSubmitKyc();

  const [form, setForm] = useState({
    fullName: "", pan: "", aadhaar: "", dob: "", address: "",
    bankAccount: "", ifsc: "", monthlyIncome: "",
    employmentType: "salaried" as "salaried" | "self_employed" | "business_owner" | "freelancer",
  });
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(0);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const errors = validate(form);

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setDirty(d => ({ ...d, [k]: true }));
  }

  const stepFields = STEPS[step].fields;
  const stepErrors = stepFields.filter(f => errors[f]);
  const stepComplete = stepErrors.length === 0 && stepFields.every(f => dirty[f] || (form as any)[f]);

  const totalFields = Object.keys(form).length - 1; // exclude employmentType from dirty check
  const filledFields = Object.keys(form).filter(k => k !== "employmentType" && (form as any)[k]).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  function next() {
    const toMark: Record<string, boolean> = {};
    stepFields.forEach(f => { toMark[f] = true; });
    setDirty(d => ({ ...d, ...toMark }));
    if (stepErrors.length > 0) {
      toast({ title: "Please fix the errors before continuing", variant: "destructive" });
      return;
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    const allDirty: Record<string, boolean> = {};
    Object.keys(form).forEach(k => { allDirty[k] = true; });
    setDirty(allDirty);
    if (Object.keys(errors).length > 0) {
      const first = Object.values(errors)[0];
      toast({ title: "Please fix all errors", description: first, variant: "destructive" });
      return;
    }
    try {
      await submit.mutateAsync({
        data: {
          fullName: form.fullName.trim(),
          pan: form.pan.toUpperCase(),
          aadhaar: form.aadhaar,
          dob: form.dob,
          address: form.address.trim(),
          bankAccount: form.bankAccount,
          ifsc: form.ifsc.toUpperCase(),
          monthlyIncome: Number(form.monthlyIncome),
          employmentType: form.employmentType,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await qc.invalidateQueries({ queryKey: getGetKycQueryKey() });
      toast({ title: "KYC Verified!", description: "Your credit profile is ready. Exploring loan offers now." });
      setLocation("/dashboard");
    } catch (err: any) {
      const msg = err?.message ?? "Please check your details and try again.";
      setSubmitErr(msg);
      toast({ title: "Verification failed", description: msg, variant: "destructive" });
    }
  }

  if (existing && existing.status === "verified") {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">KYC Verified</CardTitle>
            <CardDescription>Your identity has been verified and your credit profile is active.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Full Name", value: existing.fullName },
                { label: "PAN", value: existing.panMasked },
                { label: "Aadhaar", value: existing.aadhaarMasked },
                { label: "Date of Birth", value: existing.dob },
                { label: "Bank Account", value: existing.bankAccountMasked },
                { label: "IFSC", value: existing.ifsc },
                { label: "Monthly Income", value: existing.monthlyIncome ? "₹" + Number(existing.monthlyIncome).toLocaleString("en-IN") : "" },
                { label: "Employment", value: existing.employmentType?.replace("_", " ") },
              ].map(f => (
                <div key={f.label} className="rounded-lg bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">{f.label}</div>
                  <div className="font-medium capitalize">{f.value || "—"}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-1">
                <CheckCircle2 className="h-4 w-4" />Eligible for all Quikkk products
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Personal Loan", "Home Loan", "Business Loan", "Auto Loan", "Education Loan", "Credit Cards", "Gold Loan", "FD Loan"].map(p => (
                  <Badge key={p} variant="outline" className="text-xs text-green-700 border-green-300">{p}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className={statusColor("verified")}>Verified</Badge>
              <Button onClick={() => setLocation("/dashboard")} className="ml-auto">Continue to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />Complete your KYC
        </h1>
        <p className="text-muted-foreground mt-1">One-time verification to unlock loan offers from 12+ partner banks and NBFCs.</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = i === step;
              const isDone = i < step || (i === step && !stepErrors.length && step === STEPS.length - 1);
              return (
                <button
                  key={s.id}
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-green-100 text-green-700" : i < step ? "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80" : "bg-muted/40 text-muted-foreground/60 cursor-not-allowed"}`}
                >
                  <StepIcon className="h-3 w-3" />{s.label}
                  {isDone && i < step && <CheckCircle2 className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground">{progress}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const S = STEPS[step]; const Ic = S.icon; return <><Ic className="w-5 h-5" />{S.label} Details</>; })()}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Your personal identity information — must match your official documents."}
            {step === 1 && "Your current residential address — must be in India."}
            {step === 2 && "Your primary bank account for loan disbursement and repayment."}
            {step === 3 && "Your income details to calculate your loan eligibility."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name (as on PAN) *</Label>
                  <Input id="fullName" value={form.fullName} onChange={e => setField("fullName", e.target.value)} onBlur={() => setDirty(d => ({...d, fullName: true}))} placeholder="RAHUL SHARMA" className={dirty.fullName ? (errors.fullName ? "border-destructive" : "border-green-500") : ""} />
                  <FieldStatus error={errors.fullName} dirty={!!dirty.fullName} />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input id="dob" type="date" value={form.dob} onChange={e => setField("dob", e.target.value)} onBlur={() => setDirty(d => ({...d, dob: true}))} max={new Date(Date.now() - 18*365.25*24*3600*1000).toISOString().slice(0,10)} className={dirty.dob ? (errors.dob ? "border-destructive" : "border-green-500") : ""} />
                  <FieldStatus error={errors.dob} dirty={!!dirty.dob} />
                </div>
                <div>
                  <Label htmlFor="pan">PAN Number *</Label>
                  <Input id="pan" maxLength={10} value={form.pan} onChange={e => setField("pan", e.target.value.toUpperCase())} onBlur={() => setDirty(d => ({...d, pan: true}))} placeholder="ABCDE1234F" className={`font-mono uppercase ${dirty.pan ? (errors.pan ? "border-destructive" : "border-green-500") : ""}`} />
                  <FieldStatus error={errors.pan} dirty={!!dirty.pan} />
                </div>
                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                  <Input id="aadhaar" maxLength={12} value={form.aadhaar} onChange={e => setField("aadhaar", e.target.value.replace(/\D/g, ""))} onBlur={() => setDirty(d => ({...d, aadhaar: true}))} placeholder="1234 1234 1234" className={`font-mono ${dirty.aadhaar ? (errors.aadhaar ? "border-destructive" : "border-green-500") : ""}`} />
                  <FieldStatus error={errors.aadhaar} dirty={!!dirty.aadhaar} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <Label htmlFor="address">Current Address *</Label>
                <Textarea id="address" rows={4} value={form.address} onChange={e => setField("address", e.target.value)} onBlur={() => setDirty(d => ({...d, address: true}))} placeholder="Flat / House No., Street, Area, City, State, PIN code" className={dirty.address ? (errors.address ? "border-destructive" : "border-green-500") : ""} />
                <FieldStatus error={errors.address} dirty={!!dirty.address} />
                <p className="text-xs text-muted-foreground mt-2">Example: 204 Sunrise Apartments, MG Road, Bengaluru, Karnataka - 560001</p>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="bankAccount">Bank Account Number *</Label>
                  <Input id="bankAccount" value={form.bankAccount} onChange={e => setField("bankAccount", e.target.value.replace(/\D/g, ""))} onBlur={() => setDirty(d => ({...d, bankAccount: true}))} placeholder="Your account number (9–18 digits)" className={`font-mono ${dirty.bankAccount ? (errors.bankAccount ? "border-destructive" : "border-green-500") : ""}`} />
                  <FieldStatus error={errors.bankAccount} dirty={!!dirty.bankAccount} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="ifsc">IFSC Code *</Label>
                  <Input id="ifsc" maxLength={11} value={form.ifsc} onChange={e => setField("ifsc", e.target.value.toUpperCase())} onBlur={() => setDirty(d => ({...d, ifsc: true}))} placeholder="HDFC0001234" className={`font-mono uppercase ${dirty.ifsc ? (errors.ifsc ? "border-destructive" : "border-green-500") : ""}`} />
                  <FieldStatus error={errors.ifsc} dirty={!!dirty.ifsc} />
                  <p className="text-xs text-muted-foreground mt-1">Find your IFSC on your chequebook or bank passbook</p>
                </div>
                <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                  <strong>Why we need this:</strong> Your bank account is used only for loan disbursement and EMI repayment. It is verified via penny-drop and the actual account number is never shared with third parties.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="income">Monthly Income (₹) *</Label>
                  <Input id="income" type="number" min={10000} value={form.monthlyIncome} onChange={e => setField("monthlyIncome", e.target.value)} onBlur={() => setDirty(d => ({...d, monthlyIncome: true}))} placeholder="50000" className={dirty.monthlyIncome ? (errors.monthlyIncome ? "border-destructive" : "border-green-500") : ""} />
                  <FieldStatus error={errors.monthlyIncome} dirty={!!dirty.monthlyIncome} />
                  <p className="text-xs text-muted-foreground mt-1">Include all income sources — salary, business, rental, etc.</p>
                </div>
                <div>
                  <Label htmlFor="employment">Employment Type *</Label>
                  <Select value={form.employmentType} onValueChange={v => setField("employmentType", v as typeof form.employmentType)}>
                    <SelectTrigger id="employment"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="self_employed">Self-employed / Professional</SelectItem>
                      <SelectItem value="business_owner">Business Owner</SelectItem>
                      <SelectItem value="freelancer">Freelancer / Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.monthlyIncome && !errors.monthlyIncome && (
                  <div className="md:col-span-2 rounded-lg bg-green-50 border border-green-200 p-3">
                    <div className="text-xs text-green-700 font-medium mb-1">Estimated eligibility based on income</div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div><span className="font-bold text-green-700">₹{(Number(form.monthlyIncome) * 20).toLocaleString("en-IN")}</span> <span className="text-xs text-muted-foreground">max personal loan</span></div>
                      <div><span className="font-bold text-green-700">₹{(Number(form.monthlyIncome) * 60).toLocaleString("en-IN")}</span> <span className="text-xs text-muted-foreground">max home loan</span></div>
                      <div><span className="font-bold text-green-700">₹{Math.round(Number(form.monthlyIncome) * 0.5).toLocaleString("en-IN")}</span> <span className="text-xs text-muted-foreground">max EMI/month</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {submitErr && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />{submitErr}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" className="flex-1" onClick={next}>
                  Continue to {STEPS[step + 1].label} →
                </Button>
              ) : (
                <Button type="submit" className="flex-1 h-11" disabled={submit.isPending}>
                  {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ShieldCheck className="mr-2 h-4 w-4" />Verify & Complete KYC
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
        <div className="rounded-lg bg-muted/40 p-3"><div className="font-medium text-foreground mb-1">🔒 Encrypted</div>All data secured with bank-grade encryption</div>
        <div className="rounded-lg bg-muted/40 p-3"><div className="font-medium text-foreground mb-1">🏛️ RBI Compliant</div>Follows all RBI KYC guidelines</div>
        <div className="rounded-lg bg-muted/40 p-3"><div className="font-medium text-foreground mb-1">⚡ Instant</div>Verification in under 60 seconds</div>
      </div>
    </div>
  );
}
