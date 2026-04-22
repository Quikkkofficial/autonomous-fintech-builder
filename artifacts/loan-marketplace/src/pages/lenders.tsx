import { useState } from "react";
import { useListLenders } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, Landmark, Building2 } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function Lenders() {
  const [filter, setFilter] = useState<"all" | "bank" | "nbfc">("all");
  const { data, isLoading } = useListLenders();
  const all = data ?? [];
  const filtered = filter === "all" ? all : all.filter((l) => l.type === filter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Our partner network</h1>
        <p className="text-muted-foreground mt-1">12+ regulated banks and NBFCs work with CreditBridge.</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="bank">Banks ({all.filter(l => l.type === "bank").length})</TabsTrigger>
          <TabsTrigger value="nbfc">NBFCs ({all.filter(l => l.type === "nbfc").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-44 w-full" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((l) => (
            <Card key={l.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {l.type === "bank" ? <Landmark className="w-6 h-6 text-primary" /> : <Building2 className="w-6 h-6 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{l.name}</h3>
                      <p className="text-sm text-muted-foreground">{l.tagline}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="uppercase">{l.type}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {Number(l.rating).toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{l.approvalHours}h approval</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                  <Info label="Interest rate" value={`${Number(l.minRate)}% – ${Number(l.maxRate)}%`} />
                  <Info label="Loan range" value={`${formatINR(Number(l.minAmount))} – ${formatINR(Number(l.maxAmount))}`} />
                  <Info label="Processing fee" value={`${Number(l.processingFeePct)}%`} />
                  <Info label="Min income" value={formatINR(Number(l.minIncome)) + "/mo"} />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(l.supportedTypes as string[]).map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs capitalize">{t}</Badge>
                  ))}
                </div>
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
