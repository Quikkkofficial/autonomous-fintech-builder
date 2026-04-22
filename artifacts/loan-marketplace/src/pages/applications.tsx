import { Link } from "wouter";
import { useListLoanApplications, useListCardApplications } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, FileText, CreditCard } from "lucide-react";
import { formatINR, formatDate, statusColor } from "@/lib/format";

export default function Applications() {
  const { data: loans, isLoading: l1 } = useListLoanApplications();
  const { data: cards, isLoading: l2 } = useListCardApplications();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your applications</h1>
          <p className="text-muted-foreground mt-1">Track every loan and card application in one place.</p>
        </div>
        <Link href="/loans"><Button>New application</Button></Link>
      </div>

      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans" className="gap-2"><FileText className="w-4 h-4" /> Loans ({loans?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="cards" className="gap-2"><CreditCard className="w-4 h-4" /> Credit cards ({cards?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-3 mt-4">
          {l1 && [1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          {!l1 && (loans?.length ?? 0) === 0 && <EmptyState message="No loan applications yet" />}
          {loans?.map((a) => (
            <Link key={a.id} href={`/applications/${a.id}`}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{a.lenderName}</span>
                      <Badge variant="outline" className="capitalize text-xs">{a.type}</Badge>
                      <Badge className={statusColor(a.status)}>{a.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span>{formatINR(a.amount)} • {a.tenureMonths}m @ {a.interestRate}%</span>
                      <span>•</span>
                      <span>EMI {formatINR(a.emi)}</span>
                      <span>•</span>
                      <span>{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="cards" className="space-y-3 mt-4">
          {l2 && [1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          {!l2 && (cards?.length ?? 0) === 0 && <EmptyState message="No card applications yet" />}
          {cards?.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{a.cardName}</span>
                    <Badge className={statusColor(a.status)}>{a.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a.referenceCode} • {formatDate(a.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
