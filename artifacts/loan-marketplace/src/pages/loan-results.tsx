import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMatchLoans, useCreateLoanApplication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Clock, Loader2, Zap, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useEffect } from "react";

export default function LoanResults() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const type = (params.get("type") ?? "personal") as "personal" | "home" | "auto" | "business" | "education";
  const amount = Number(params.get("amount") ?? "300000");
  const tenureMonths = Number(params.get("tenure") ?? "36");

  const match = useMatchLoans();
  const create = useCreateLoanApplication();
  const [applyingFor, setApplyingFor] = useState<string | null>(null);

  useEffect(() => {
    match.mutate({ data: { type, amount, tenureMonths } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offers = match.data ?? [];

  async function apply(lenderId: string) {
    setApplyingFor(lenderId);
    try {
      const app = await create.mutateAsync({ data: { lenderId, type, amount, tenureMonths } });
      toast({ title: "Application submitted", description: `Reference: ${app.referenceCode}` });
      setLocation(`/applications/${app.id}`);
    } catch {
      toast({ title: "Could not submit application", variant: "destructive" });
    } finally {
      setApplyingFor(null);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => setLocation("/loans")} className="mb-3 gap-2">
          <ArrowLeft className="w-4 h-4" /> Edit search
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Your matched offers</h1>
        <p className="text-muted-foreground mt-1">
          {formatINR(amount)} • {tenureMonths} months • {type} loan
        </p>
      </div>

      {match.isPending && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}

      {!match.isPending && offers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No matching offers</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your loan amount or tenure.</p>
            <Button className="mt-4" onClick={() => setLocation("/loans")}>Edit search</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {offers.map((o, i) => (
          <Card key={o.lenderId} className={i === 0 ? "border-primary/40 ring-1 ring-primary/20" : ""}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{o.lenderName}</h3>
                    <Badge variant="outline" className="capitalize text-xs">{o.lenderType}</Badge>
                    {o.preApproved && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1"><Zap className="w-3 h-3" />Pre-approved</Badge>}
                    {i === 0 && <Badge className="bg-primary text-primary-foreground">Best match</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {(o.rating ?? 0).toFixed(1)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{o.approvalHours}h approval</span>
                    <span>Match score: {o.matchScore}/100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:flex-1">
                  <Stat label="Interest" value={`${o.interestRate}% p.a.`} highlight />
                  <Stat label="EMI" value={formatINR(o.emi) + "/mo"} />
                  <Stat label="Processing fee" value={formatINR(o.processingFee)} />
                  <Stat label="Total payable" value={formatINR(o.totalPayable)} />
                </div>
                <Button
                  size="lg"
                  className="md:w-32"
                  onClick={() => apply(o.lenderId)}
                  disabled={create.isPending && applyingFor === o.lenderId}
                >
                  {create.isPending && applyingFor === o.lenderId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${highlight ? "text-primary text-lg" : ""}`}>{value}</div>
    </div>
  );
}
