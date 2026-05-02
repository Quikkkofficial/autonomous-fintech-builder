import { Link } from "wouter";
import { useListLoanApplications, useListCardApplications } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, FileText, CreditCard, Landmark, ChevronRight } from "lucide-react";
import { formatINR, formatDate, statusColor } from "@/lib/format";

export default function Applications() {
  const { data: loans, isLoading: l1 } = useListLoanApplications();
  const { data: cards, isLoading: l2 } = useListCardApplications();

  return (
    <div className="max-w-2xl mx-auto md:max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track every loan and card in one place.</p>
        </div>
        <Link href="/loans">
          <Button size="sm" className="gap-1.5 shrink-0">
            <span className="hidden sm:inline">New</span> application
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="loans">
        <TabsList className="w-full h-10">
          <TabsTrigger value="loans" className="flex-1 gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Loans
            {(loans?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{loans?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex-1 gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Credit cards
            {(cards?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{cards?.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-3 space-y-0">
          {l1 && (
            <div className="rounded-2xl bg-card border overflow-hidden divide-y">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-none" />)}
            </div>
          )}
          {!l1 && (loans?.length ?? 0) === 0 && <EmptyState message="No loan applications yet" cta="/loans" ctaLabel="Find a loan" />}
          {!l1 && (loans?.length ?? 0) > 0 && (
            <div className="rounded-2xl bg-card border overflow-hidden divide-y">
              {loans?.map((a) => (
                <Link key={a.id} href={`/applications/${a.id}`}>
                  <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Landmark className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{a.lenderName}</span>
                        <Badge variant="outline" className="capitalize text-[10px] px-1.5 h-4">{a.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatINR(a.amount)} · {a.tenureMonths}mo · EMI {formatINR(a.emi)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <Badge className={`text-[10px] px-1.5 h-4 ${statusColor(a.status)}`}>{a.status}</Badge>
                      <div className="text-[10px] text-muted-foreground">{formatDate(a.createdAt)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cards" className="mt-3 space-y-0">
          {l2 && (
            <div className="rounded-2xl bg-card border overflow-hidden divide-y">
              {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-none" />)}
            </div>
          )}
          {!l2 && (cards?.length ?? 0) === 0 && <EmptyState message="No card applications yet" cta="/credit-cards" ctaLabel="Browse cards" />}
          {!l2 && (cards?.length ?? 0) > 0 && (
            <div className="rounded-2xl bg-card border overflow-hidden divide-y">
              {cards?.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{a.cardName}</div>
                    <div className="text-xs text-muted-foreground">{a.referenceCode}</div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Badge className={`text-[10px] px-1.5 h-4 ${statusColor(a.status)}`}>{a.status}</Badge>
                    <div className="text-[10px] text-muted-foreground">{formatDate(a.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message, cta, ctaLabel }: { message: string; cta: string; ctaLabel: string }) {
  return (
    <div className="rounded-2xl bg-card border p-10 text-center">
      <p className="text-muted-foreground text-sm mb-3">{message}</p>
      <Link href={cta}>
        <Button size="sm" variant="outline" className="gap-1.5">
          {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}
