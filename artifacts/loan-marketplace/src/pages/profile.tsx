import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetKyc, useGetCreditScore, useLogout, getGetMeQueryKey, getGetKycQueryKey, getGetCreditScoreQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User as UserIcon, Phone, ShieldCheck } from "lucide-react";
import { formatINR, statusColor } from "@/lib/format";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: kyc } = useGetKyc({ query: { queryKey: getGetKycQueryKey(), retry: false } });
  const { data: score } = useGetCreditScore({ query: { queryKey: getGetCreditScoreQueryKey(), retry: false } });
  const logout = useLogout();
  const qc = useQueryClient();
  const { toast } = useToast();

  async function onLogout() {
    await logout.mutateAsync();
    qc.clear();
    await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Signed out" });
    setLocation("/");
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and credit profile.</p>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold">{user?.name || "Welcome"}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +91 {user?.phone}</div>
            {user?.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
          </div>
          <Badge className={statusColor(user?.kycStatus ?? "pending")}>KYC: {user?.kycStatus}</Badge>
        </CardContent>
      </Card>

      {kyc && kyc.status === "verified" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> KYC details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="PAN" value={kyc.panMasked} />
            <Field label="Aadhaar" value={kyc.aadhaarMasked} />
            <Field label="Bank account" value={kyc.bankAccountMasked} />
            <Field label="IFSC" value={kyc.ifsc} />
            <Field label="Monthly income" value={kyc.monthlyIncome ? formatINR(kyc.monthlyIncome) : ""} />
            <Field label="Employment" value={kyc.employmentType} />
          </CardContent>
        </Card>
      )}

      {score && (
        <Card>
          <CardHeader><CardTitle>Credit score</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-6">
            <div>
              <div className="text-5xl font-bold text-primary">{score.score}</div>
              <Badge className="mt-2 capitalize">{score.band}</Badge>
            </div>
            <div className="flex-1 space-y-2">
              {(score.factors as Array<{ label: string; impact: string; detail?: string }>).slice(0, 3).map((f, i) => (
                <div key={i} className="text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${f.impact === "positive" ? "bg-emerald-500" : f.impact === "negative" ? "bg-rose-500" : "bg-amber-500"}`} />
                  <span className="font-medium">{f.label}</span>
                  {f.detail && <span className="text-muted-foreground"> – {f.detail}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <Button variant="destructive" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
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
