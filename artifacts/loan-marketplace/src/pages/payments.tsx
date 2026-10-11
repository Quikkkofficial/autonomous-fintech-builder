/**
 * Payments — customer view of UPI transactions and Autopay mandates.
 *
 * Tabs:
 *  - Transactions: one-time UPI payments (EMI, fees)
 *  - Autopay: recurring EMI mandates (pause / cancel)
 */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wallet,
  Repeat,
  Loader2,
  Pause,
  XCircle,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";

interface Txn {
  id: number;
  reference: string;
  amount: string;
  purpose: string;
  status: string;
  method?: string | null;
  upiId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

interface Mandate {
  id: number;
  reference: string;
  amount: string;
  maxAmount: string;
  frequency: string;
  totalDebits?: number | null;
  debitsExecuted: number;
  status: string;
  upiId?: string | null;
  nextDebitAt?: string | null;
  lastDebitAt?: string | null;
  lastDebitStatus?: string | null;
  createdAt: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-700",
    refunded: "bg-blue-100 text-blue-800",
    pending: "bg-amber-100 text-amber-800",
    pending_auth: "bg-amber-100 text-amber-800",
    paused: "bg-orange-100 text-orange-800",
    created: "bg-gray-100 text-gray-700",
    expired: "bg-gray-100 text-gray-700",
  };
  const label = status.replace(/_/g, " ");
  return (
    <Badge className={`${map[status] ?? "bg-gray-100 text-gray-700"} capitalize`}>
      {label}
    </Badge>
  );
}

function purposeLabel(p: string) {
  return (
    { emi: "EMI", processing_fee: "Processing fee", platform_fee: "Platform fee", other: "Payment" }[
      p
    ] ?? p
  );
}

export default function Payments() {
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [mandates, setMandates] = useState<Mandate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, m] = await Promise.all([
        api<Txn[]>("/payments/history"),
        api<Mandate[]>("/payments/autopay"),
      ]);
      setTxns(t);
      setMandates(m);
    } catch (e) {
      setError(
        (e as { message?: string })?.message ?? "Could not load payments.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mandateAction = async (
    reference: string,
    action: "cancel" | "pause",
  ) => {
    if (
      action === "cancel" &&
      !window.confirm(
        "Cancel this Autopay mandate? Future EMI debits will stop and you'll need to pay manually.",
      )
    )
      return;
    setActioning(`${action}:${reference}`);
    try {
      await api(`/payments/autopay/${reference}/${action}`, { method: "POST" });
      await load();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Action failed.");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto md:max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            Payments
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            UPI transactions and EMI Autopay mandates.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <Tabs defaultValue="transactions">
        <TabsList className="w-full h-10">
          <TabsTrigger value="transactions" className="flex-1 gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            Transactions
            {(txns?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {txns?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="autopay" className="flex-1 gap-1.5">
            <Repeat className="w-3.5 h-3.5" />
            Autopay
            {(mandates?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {mandates?.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : !txns?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No payments yet</p>
                <p className="text-sm">
                  Your UPI payments for EMIs and fees will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-2xl bg-card border overflow-hidden divide-y">
              {txns.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{formatINR(Number(t.amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {purposeLabel(t.purpose)} • {t.reference}
                      {t.upiId ? ` • ${t.upiId}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.paidAt ?? t.createdAt)}
                    </p>
                  </div>
                  {statusBadge(t.status)}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="autopay" className="mt-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : !mandates?.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Repeat className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No Autopay mandates</p>
                <p className="text-sm">
                  Set up UPI Autopay on a loan application to automate EMIs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mandates.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {formatINR(Number(m.amount))}{" "}
                        <span className="font-normal text-sm text-muted-foreground">
                          / {m.frequency.toLowerCase()}
                        </span>
                      </CardTitle>
                      {statusBadge(m.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Reference</span>
                      <span className="font-mono text-xs">{m.reference}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Debits</span>
                      <span>
                        {m.debitsExecuted}
                        {m.totalDebits ? ` / ${m.totalDebits}` : ""} executed
                      </span>
                    </div>
                    {m.lastDebitAt && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Last debit</span>
                        <span>
                          {formatDate(m.lastDebitAt)} •{" "}
                          {m.lastDebitStatus ?? "—"}
                        </span>
                      </div>
                    )}
                    {(m.status === "active" || m.status === "paused") && (
                      <div className="flex gap-2 pt-2">
                        {m.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioning === `pause:${m.reference}`}
                            onClick={() => mandateAction(m.reference, "pause")}
                          >
                            {actioning === `pause:${m.reference}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pause className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Pause
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          disabled={actioning === `cancel:${m.reference}`}
                          onClick={() => mandateAction(m.reference, "cancel")}
                        >
                          {actioning === `cancel:${m.reference}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Cancel mandate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
