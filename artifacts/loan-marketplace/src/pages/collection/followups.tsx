import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";

type Followup = { id: number; applicationId: string; channel: string; outcome: string; notes: string | null; promisedAmount: string | null; promisedDate: string | null; createdAt: string };

export default function CollectionFollowups() {
  const list = useQuery({ queryKey: ["collection", "followups"], queryFn: () => api<Followup[]>("/collection/followups") });

  return (
    <CollectionLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-ups</h1>
          <p className="text-muted-foreground mt-1">All follow-ups you've logged.</p>
        </div>
        <Card><CardContent className="pt-6">
          {list.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          <div className="space-y-3">
            {list.data?.map((f) => (
              <div key={f.id} className="border-b pb-3 last:border-0">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Link href={`/collection/cases/${f.applicationId}`}><Badge variant="outline" className="cursor-pointer hover:bg-muted">{f.applicationId}</Badge></Link>
                  <Badge variant="secondary">{f.channel}</Badge>
                  <Badge variant={f.outcome === "paid" ? "default" : "outline"}>{f.outcome.replace(/_/g, " ")}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(f.createdAt).toLocaleString()}</span>
                </div>
                {f.notes && <p className="text-sm mt-2">{f.notes}</p>}
                {f.promisedAmount && <p className="text-xs text-muted-foreground mt-1">Promised {formatINR(Number(f.promisedAmount))}{f.promisedDate ? ` by ${f.promisedDate}` : ""}</p>}
              </div>
            ))}
            {list.data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No follow-ups logged yet.</p>}
          </div>
        </CardContent></Card>
      </div>
    </CollectionLayout>
  );
}
