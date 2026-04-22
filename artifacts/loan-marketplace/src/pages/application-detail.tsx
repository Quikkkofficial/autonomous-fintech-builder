import { useRoute, useLocation } from "wouter";
import { useGetLoanApplication, getGetLoanApplicationQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Clock, CircleDashed } from "lucide-react";
import { formatINR, formatDate, formatDateTime, statusColor } from "@/lib/format";

export default function ApplicationDetail() {
  const [, params] = useRoute("/applications/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ?? "";
  const { data: app, isLoading } = useGetLoanApplication(id, { query: { queryKey: getGetLoanApplicationQueryKey(id), enabled: !!id } });

  if (isLoading) return <div className="space-y-4 max-w-3xl mx-auto"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!app) return <div className="max-w-3xl mx-auto"><p>Application not found.</p></div>;

  const history = (app.statusHistory as Array<{ status: string; at: string; note?: string }>) ?? [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 gap-2" onClick={() => setLocation("/applications")}>
          <ArrowLeft className="w-4 h-4" /> All applications
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{app.lenderName}</h1>
          <Badge variant="outline" className="capitalize">{app.type}</Badge>
          <Badge className={statusColor(app.status)}>{app.status.replace("_", " ")}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">Reference: <span className="font-mono">{app.referenceCode}</span></p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Loan details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Amount" value={formatINR(app.amount)} />
            <Field label="Tenure" value={`${app.tenureMonths} months`} />
            <Field label="Interest rate" value={`${app.interestRate}% p.a.`} />
            <Field label="EMI" value={formatINR(app.emi) + "/mo"} />
            <Field label="Purpose" value={app.purpose ?? "—"} />
            <Field label="Applied on" value={formatDate(app.createdAt)} />
            {app.expectedDisbursalAt && <Field label="Expected disbursal" value={formatDate(app.expectedDisbursalAt)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {i === history.length - 1 ? (
                      <Clock className="w-5 h-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    {i < history.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="font-medium capitalize">{h.status.replace("_", " ")}</div>
                    {h.note && <div className="text-sm text-muted-foreground">{h.note}</div>}
                    <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(h.at)}</div>
                  </div>
                </div>
              ))}
              {(app.status === "submitted" || app.status === "under_review") && (
                <div className="flex gap-3 opacity-50">
                  <CircleDashed className="w-5 h-5" />
                  <div className="text-sm">Approval decision (typically within {app.expectedDisbursalAt ? "24-48 hours" : "a few hours"})</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
