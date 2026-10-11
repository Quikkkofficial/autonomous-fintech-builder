/**
 * UpiPayment — one-time Bharat UPI payment component.
 *
 * Flow:
 *  1. choose method: pay with UPI ID (Collect) or scan QR
 *  2. backend creates a Cashfree order -> returns payment session / QR string
 *  3. component polls order status until success / failure / expiry
 *
 * Props:
 *  amount        — INR amount to collect
 *  purpose       — "emi" | "processing_fee" | "platform_fee" | "other"
 *  applicationId — optional linked loan application
 *  onSuccess     — called with the transaction when payment succeeds
 *  onFailure     — called with an error message
 */
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";
import { formatINR } from "@/lib/format";

type Step = "choose" | "paying" | "done";
type Method = "upi_collect" | "upi_qr";

interface OrderResponse {
  reference: string;
  orderId: string;
  paymentSessionId: string | null;
  paymentLink: string | null;
  qrString: string | null;
  amount: number;
}

interface TxnStatus {
  reference: string;
  status: string;
  cfPaymentId?: string | null;
  paidAt?: string | null;
}

const UPI_ID_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;

export function UpiPayment({
  amount,
  purpose,
  applicationId,
  title,
  onSuccess,
  onFailure,
}: {
  amount: number;
  purpose: "emi" | "processing_fee" | "platform_fee" | "other";
  applicationId?: string;
  title?: string;
  onSuccess?: (txn: TxnStatus) => void;
  onFailure?: (message: string) => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method>("upi_collect");
  const [upiId, setUpiId] = useState("");
  const [vpaState, setVpaState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [vpaName, setVpaName] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [status, setStatus] = useState<TxnStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const verifyVpa = async (vpa: string) => {
    if (!UPI_ID_RE.test(vpa)) {
      setVpaState("idle");
      setVpaName(null);
      return;
    }
    setVpaState("checking");
    try {
      const res = await api<{ verified: boolean; name?: string }>(
        "/payments/vpa/verify",
        { method: "POST", json: { vpa } },
      );
      setVpaState(res.verified ? "valid" : "invalid");
      setVpaName(res.name ?? null);
    } catch {
      // Verification is best-effort; don't block payment on provider errors.
      setVpaState("idle");
      setVpaName(null);
    }
  };

  const createOrder = async () => {
    if (method === "upi_collect" && !UPI_ID_RE.test(upiId)) {
      setError("Please enter a valid UPI ID (e.g. name@okhdfcbank).");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await api<OrderResponse>("/payments/order", {
        method: "POST",
        json: {
          amount,
          purpose,
          applicationId,
          upiId: method === "upi_collect" ? upiId : undefined,
          method,
        },
      });
      setOrder(res);
      setStep("paying");
      startPolling(res.reference);
    } catch (e) {
      const msg =
        (e as { message?: string })?.message ?? "Could not start the payment. Please try again.";
      setError(msg);
      onFailure?.(msg);
    } finally {
      setCreating(false);
    }
  };

  const startPolling = (reference: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const txn = await api<TxnStatus>(`/payments/order/${reference}`);
        setStatus(txn);
        if (txn.status === "success" || txn.status === "failed" || txn.status === "refunded") {
          stopPolling();
          setStep("done");
          if (txn.status === "success") onSuccess?.(txn);
          else onFailure?.("Payment failed. Please try again.");
        }
      } catch {
        // transient — keep polling
      }
      if (attempts >= 100) {
        // ~5 minutes
        stopPolling();
        setError("Payment timed out. If money was debited it will be refunded automatically.");
      }
    }, 3000);
  };

  const reset = () => {
    stopPolling();
    setStep("choose");
    setOrder(null);
    setStatus(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">
          {title ?? "Pay with UPI"}
        </CardTitle>
        <p className="text-2xl font-bold text-[#EB1414]">{formatINR(amount)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "choose" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={method === "upi_collect" ? "default" : "outline"}
                className={method === "upi_collect" ? "bg-[#EB1414] hover:bg-[#c91010]" : ""}
                onClick={() => setMethod("upi_collect")}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                UPI ID
              </Button>
              <Button
                type="button"
                variant={method === "upi_qr" ? "default" : "outline"}
                className={method === "upi_qr" ? "bg-[#EB1414] hover:bg-[#c91010]" : ""}
                onClick={() => setMethod("upi_qr")}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
            </div>

            {method === "upi_collect" && (
              <div className="space-y-2">
                <Label htmlFor="upi-id">Your UPI ID</Label>
                <div className="relative">
                  <Input
                    id="upi-id"
                    placeholder="name@okhdfcbank"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value.trim());
                      setVpaState("idle");
                      setVpaName(null);
                    }}
                    onBlur={() => verifyVpa(upiId)}
                  />
                  {vpaState === "checking" && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {vpaState === "valid" && (
                    <BadgeCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                  )}
                </div>
                {vpaState === "valid" && (
                  <p className="text-xs text-green-700">
                    Verified{vpaName ? ` — ${vpaName}` : ""}. A collect request will be sent to your UPI app.
                  </p>
                )}
                {vpaState === "invalid" && (
                  <p className="text-xs text-amber-700">
                    Could not verify this UPI ID. You can still continue — your UPI app will confirm.
                  </p>
                )}
              </div>
            )}

            {method === "upi_qr" && (
              <p className="text-sm text-muted-foreground">
                A QR code will be generated. Scan it with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay.
              </p>
            )}

            <Button
              className="w-full bg-[#EB1414] hover:bg-[#c91010]"
              disabled={creating}
              onClick={createOrder}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting payment…
                </>
              ) : (
                `Pay ${formatINR(amount)}`
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secured by Cashfree • UPI payments are processed in INR
            </p>
          </div>
        )}

        {step === "paying" && order && (
          <div className="space-y-4 text-center">
            {method === "upi_qr" && order.qrString ? (
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-4 rounded-xl border">
                  <QRCodeSVG value={order.qrString} size={200} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan with any UPI app to pay {formatINR(amount)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#EB1414]" />
                <p className="text-sm font-medium">
                  Collect request sent to {upiId}
                </p>
                <p className="text-sm text-muted-foreground">
                  Approve the payment in your UPI app.
                </p>
              </div>
            )}
            {order.paymentLink && (
              <Button variant="outline" className="w-full" asChild>
                <a href={order.paymentLink} target="_blank" rel="noreferrer">
                  Open payment page
                </a>
              </Button>
            )}
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Waiting for payment confirmation…
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          </div>
        )}

        {step === "done" && status && (
          <div className="space-y-4 text-center py-4">
            {status.status === "success" ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <p className="font-semibold text-green-700">Payment successful</p>
                <p className="text-sm text-muted-foreground">
                  {formatINR(amount)} received. Reference: {status.reference}
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                <p className="font-semibold text-red-700">Payment failed</p>
                <p className="text-sm text-muted-foreground">
                  No money was debited. Reference: {status.reference}
                </p>
                <Button variant="outline" onClick={reset}>
                  Try again
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
