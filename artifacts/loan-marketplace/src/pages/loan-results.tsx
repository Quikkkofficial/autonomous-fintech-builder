import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMatchLoans, useCreateLoanApplication } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Clock, Loader2, Zap, Sparkles, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useEffect } from "react";

export default function LoanResults() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const type = (params.get("type") ?? "personal") as string;
  const amount = Number(params.get("amount") ?? "300000");
  const tenureMonths = Number(params.get("tenure") ?? "36");

  const match = useMatchLoans();
  const create = useCreateLoanApplication();
  const [applyingFor, setApplyingFor] = useState<string | null>(null);

  useEffect(() => {
    match.mutate({ data: { type: type as any, amount, tenureMonths } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offers = match.data ?? [];

  async function apply(lenderId: string) {
    setApplyingFor(lenderId);
    try {
      const app = await create.mutateAsync({ data: { lenderId, type: type as any, amount, tenureMonths } });
      toast({ title: "Application submitted!", description: `Reference: ${app.referenceCode}` });
      setLocation(`/applications/${app.id}`);
    } catch {
      toast({ title: "Could not submit", variant: "destructive" });
    } finally {
      setApplyingFor(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto md:max-w-5xl space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={() => setLocation("/loans")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Edit search
        </button>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Matched offers</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-xs">{formatINR(amount)}</Badge>
          <Badge variant="outline" className="text-xs">{tenureMonths} months</Badge>
          <Badge variant="outline" className="capitalize text-xs">{type.replace("_", " ")} loan</Badge>
        </div>
      </div>

      {/* Loading */}
      {match.isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      )}

      {/* No results */}
      {!match.isPending && offers.length === 0 && (
        <div className="rounded-2xl bg-card border p-10 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">No matching offers</p>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your loan amount or tenure.</p>
          <Button className="mt-4" onClick={() => setLocation("/loans")}>Edit search</Button>
        </div>
      )}

      {/* Offer cards */}
      <div className="space-y-3">
        {offers.map((o, i) => (
          <div
            key={o.lenderId}
            className={`rounded-2xl bg-card border p-4 md:p-5 transition-shadow hover:shadow-md ${i === 0 ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <h3 className="font-bold text-base">{o.lenderName}</h3>
                  {i === 0 && <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 h-4">Best match</Badge>}
                  {o.preApproved && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-1.5 h-4 gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> Pre-approved
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {(o.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> ~{o.approvalHours}h
                  </span>
                  <span className="capitalize hidden sm:inline">{o.lenderType}</span>
                </div>
              </div>
              {/* Desktop apply */}
              <Button
                className="hidden md:flex shrink-0"
                onClick={() => apply(o.lenderId)}
                disabled={create.isPending && applyingFor === o.lenderId}
              >
                {create.isPending && applyingFor === o.lenderId
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "Apply →"}
              </Button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-muted/50">
              <StatCell label="Interest" value={`${o.interestRate}%`} highlight />
              <StatCell label="EMI/mo" value={formatINR(o.emi)} />
              <StatCell label="Fee" value={formatINR(o.processingFee)} />
              <StatCell label="Total" value={formatINR(o.totalPayable)} />
            </div>

            {/* Mobile apply */}
            <Button
              className="md:hidden w-full mt-3 h-11 rounded-xl gap-2"
              onClick={() => apply(o.lenderId)}
              disabled={create.isPending && applyingFor === o.lenderId}
            >
              {create.isPending && applyingFor === o.lenderId
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Apply now <ChevronRight className="w-4 h-4" /></>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className={`font-bold text-sm ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
