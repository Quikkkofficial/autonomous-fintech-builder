/**
 * UpiAutopaySetup — UPI Autopay e-mandate setup for recurring EMIs.
 *
 * Flow:
 *  1. shows EMI amount, frequency, tenure; optional UPI ID
 *  2. backend creates a Cashfree subscription -> returns an auth link
 *  3. customer is redirected to their UPI app to approve the mandate
 *  4. webhooks flip the mandate to "active"; debits run automatically
 *
 * RBI note: per-debit limit without additional factor auth is ₹15,000.
 */
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Repeat,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Info,
} from "lucide-react";
import { formatINR } from "@/lib/format";

const FREQUENCIES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "QUARTERLY", label: "Quarterly" },
] as const;

interface SetupResponse {
  reference: string;
  subscriptionId: string;
  authLink: string | null;
  amount: number;
  frequency: string;
  totalDebits: number;
}

export function UpiAutopaySetup({
  applicationId,
  emiAmount,
  tenureMonths,
  onCreated,
}: {
  applicationId?: string;
  emiAmount: number;
  tenureMonths: number;
  onCreated?: (res: SetupResponse) => void;
}) {
  const [frequency, setFrequency] = useState<string>("MONTHLY");
  const [upiId, setUpiId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<SetupResponse | null>(null);

  const overLimit = emiAmount > 15000;

  const setup = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await api<SetupResponse>("/payments/autopay/setup", {
        method: "POST",
        json: {
          applicationId,
          amount: emiAmount,
          // Allow up to 10% variation so small interest adjustments don't fail.
          maxAmount: Math.round(emiAmount * 1.1),
          frequency,
          totalDebits: tenureMonths,
          upiId: upiId.trim() || undefined,
        },
      });
      setCreated(res);
      onCreated?.(res);
    } catch (e) {
      setError(
        (e as { message?: string })?.message ??
          "Could not set up Autopay. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-5 w-5 text-[#EB1414]" />
          Set up UPI Autopay
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Never miss an EMI — authorize once and your {formatINR(emiAmount)}{" "}
          {frequency.toLowerCase()} debit runs automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {overLimit && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              UPI Autopay supports up to ₹15,000 per debit without extra
              authentication. This EMI ({formatINR(emiAmount)}) exceeds that —
              please pay EMIs manually or contact support for eNACH.
            </span>
          </div>
        )}

        {!created ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">EMI amount</span>
                <span className="font-semibold">{formatINR(emiAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of debits</span>
                <span className="font-semibold">{tenureMonths}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max debit</span>
                <span className="font-semibold">
                  {formatINR(Math.round(emiAmount * 1.1))}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Debit frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autopay-upi">UPI ID (optional)</Label>
              <Input
                id="autopay-upi"
                placeholder="name@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.trim())}
              />
              <p className="text-xs text-muted-foreground">
                If provided, the mandate approval opens in this UPI app.
              </p>
            </div>

            <Button
              className="w-full bg-[#EB1414] hover:bg-[#c91010]"
              disabled={creating || overLimit}
              onClick={setup}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating mandate…
                </>
              ) : (
                "Authorize Autopay"
              )}
            </Button>

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                You'll approve a one-time mandate in your UPI app. You can
                pause or cancel anytime from Payments. Pre-debit notifications
                are sent before every debit as per RBI guidelines.
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-center py-2">
            <ShieldCheck className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <p className="font-semibold">Mandate created</p>
              <p className="text-sm text-muted-foreground">
                Reference: {created.reference}
              </p>
            </div>
            {created.authLink ? (
              <Button
                className="w-full bg-[#EB1414] hover:bg-[#c91010]"
                asChild
              >
                <a href={created.authLink} target="_blank" rel="noreferrer">
                  Approve in UPI app
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open your UPI app to approve the pending mandate request.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Once approved, {formatINR(emiAmount)} will be debited{" "}
              {created.frequency.toLowerCase()} for {created.totalDebits}{" "}
              debits.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
