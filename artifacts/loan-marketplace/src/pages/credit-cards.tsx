import { useState } from "react";
import { useListCreditCards, useCreateCardApplication } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreditCard as CCIcon, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function CreditCards() {
  const { data, isLoading } = useListCreditCards();
  const apply = useCreateCardApplication();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  async function onApply(cardId: string, name: string) {
    setBusy(cardId);
    try {
      const a = await apply.mutateAsync({ data: { cardId } });
      setApplied(prev => new Set([...prev, cardId]));
      toast({ title: `Applied for ${name}!`, description: `Reference: ${a.referenceCode}` });
    } catch {
      toast({ title: "Could not apply", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto md:max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Credit cards</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Hand-picked cards matched to your profile.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((c) => {
            const wasApplied = applied.has(c.id);
            return (
              <div key={c.id} className="rounded-2xl bg-card border overflow-hidden flex flex-col">
                {/* Card visual */}
                <div
                  className="h-44 p-5 text-white relative flex flex-col justify-between"
                  style={{ background: c.color || "#1e3a8a" }}
                >
                  <div className="absolute inset-0 opacity-10"
                    style={{ background: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }}
                  />
                  <div className="flex justify-between items-start relative">
                    <div>
                      <div className="text-[11px] opacity-75 font-medium">{c.issuer}</div>
                      <div className="text-lg font-bold leading-tight mt-0.5">{c.name}</div>
                    </div>
                    <CCIcon className="w-7 h-7 opacity-70" />
                  </div>
                  <div className="flex justify-between items-end relative">
                    <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm uppercase text-[9px] tracking-wider">
                      {c.network}
                    </Badge>
                    {c.category && <span className="text-[11px] opacity-80 font-medium">{c.category}</span>}
                  </div>
                </div>

                {/* Card details */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Info label="Joining fee" value={Number(c.joiningFee) === 0 ? "Free" : formatINR(Number(c.joiningFee))} />
                    <Info label="Annual fee" value={Number(c.annualFee) === 0 ? "Free" : formatINR(Number(c.annualFee))} />
                    <Info label="Min income" value={formatINR(Number(c.minIncome)) + "/mo"} />
                    <Info label="Min CIBIL" value={String(c.minCreditScore)} />
                  </div>

                  <div className="flex items-start gap-1.5 text-primary text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{c.rewardsRate}</span>
                  </div>

                  <ul className="flex-1 space-y-1">
                    {(c.perks as string[]).slice(0, 3).map((p, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0">•</span>{p}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full h-10 rounded-xl gap-2"
                    variant={wasApplied ? "secondary" : "default"}
                    onClick={() => !wasApplied && onApply(c.id, c.name)}
                    disabled={busy === c.id || wasApplied}
                  >
                    {busy === c.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {wasApplied && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {wasApplied ? "Applied" : busy === c.id ? "Applying…" : "Apply now"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-semibold text-xs mt-0.5">{value}</div>
    </div>
  );
}
