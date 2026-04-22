import { useState } from "react";
import { useListCreditCards, useCreateCardApplication } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreditCard as CCIcon, Loader2, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function CreditCards() {
  const { data, isLoading } = useListCreditCards();
  const apply = useCreateCardApplication();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function onApply(cardId: string, name: string) {
    setBusy(cardId);
    try {
      const a = await apply.mutateAsync({ data: { cardId } });
      toast({ title: `Applied for ${name}`, description: `Reference: ${a.referenceCode}` });
    } catch {
      toast({ title: "Could not apply", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit cards</h1>
        <p className="text-muted-foreground mt-1">Hand-picked cards matched to your spending habits.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-72 w-full" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.map((c) => (
            <Card key={c.id} className="overflow-hidden flex flex-col">
              <div
                className="h-44 p-5 text-white relative flex flex-col justify-between"
                style={{ background: c.color || "linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs opacity-80">{c.issuer}</div>
                    <div className="text-lg font-bold leading-tight">{c.name}</div>
                  </div>
                  <CCIcon className="w-8 h-8 opacity-80" />
                </div>
                <div className="flex justify-between items-end">
                  <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm uppercase text-[10px]">{c.network}</Badge>
                  {c.category && <span className="text-xs opacity-90">{c.category}</span>}
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <Info label="Joining fee" value={Number(c.joiningFee) === 0 ? "Free" : formatINR(Number(c.joiningFee))} />
                  <Info label="Annual fee" value={Number(c.annualFee) === 0 ? "Free" : formatINR(Number(c.annualFee))} />
                  <Info label="Min income" value={formatINR(Number(c.minIncome)) + "/mo"} />
                  <Info label="Min CIBIL" value={String(c.minCreditScore)} />
                </div>
                <div className="text-sm mb-3">
                  <div className="flex items-start gap-2 text-primary font-medium">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{c.rewardsRate}</span>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4 flex-1">
                  {(c.perks as string[]).slice(0, 3).map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => onApply(c.id, c.name)}
                  disabled={busy === c.id}
                >
                  {busy === c.id && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  Apply now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
