import { useState } from "react";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Key, AlertTriangle, CheckCircle2, Webhook, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-lg bg-zinc-950 text-zinc-100 text-xs font-mono p-4 overflow-x-auto">
      <div className="absolute top-2 right-2"><CopyButton text={code} /></div>
      <pre className="pr-8">{code}</pre>
    </div>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm mt-0.5">{show ? value : value.slice(0, 8) + "••••••••••"}</div>
      </div>
      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</Button>
      <CopyButton text={value} />
    </div>
  );
}

const DIALER_WEBHOOK = `POST https://api.quikkk.in/collection/webhook/dialer
Authorization: Bearer pk_qcp_live_••••••••
Content-Type: application/json

{
  "event": "call.completed",
  "caseId": "CASE-XXXXXX",
  "agentId": "QCP-00001",
  "duration": 145,
  "disposition": "promise_to_pay",
  "promiseDate": "2026-05-20",
  "promiseAmount": 25000,
  "timestamp": "2026-05-13T14:30:00Z"
}`;

const PAYMENT_WEBHOOK = `POST https://api.quikkk.in/collection/webhook/payment
Authorization: Bearer pk_qcp_live_••••••••
Content-Type: application/json

{
  "event": "payment.received",
  "caseId": "CASE-XXXXXX",
  "amount": 25000,
  "paymentMode": "UPI",
  "transactionId": "TXN123456",
  "timestamp": "2026-05-13T15:00:00Z"
}`;

export default function CollectionApiIntegration() {
  return (
    <CollectionLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Integration</h1>
            <p className="text-muted-foreground mt-1">Connect dialers, SMS providers, and CRMs to this collection portal.</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Omni-channel ready
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-5">
              <Webhook className="h-5 w-5 text-amber-600 mb-2" />
              <div className="font-semibold text-sm">Dialer integration</div>
              <div className="text-xs text-muted-foreground mt-1">Push call dispositions from your dialer system</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-5">
              <CheckCircle2 className="h-5 w-5 text-amber-600 mb-2" />
              <div className="font-semibold text-sm">Payment confirmation</div>
              <div className="text-xs text-muted-foreground mt-1">Receive payment events from payment gateways</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="pt-5">
              <Key className="h-5 w-5 text-amber-600 mb-2" />
              <div className="font-semibold text-sm">Secure credentials</div>
              <div className="text-xs text-muted-foreground mt-1">Rotate keys anytime without downtime</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-amber-600" />Your API Credentials</CardTitle>
            <CardDescription>Use these credentials to authenticate incoming webhooks and outbound API calls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SecretRow label="Collection Portal API Key" value="pk_qcp_live_f8a3b7c2d6e1f4b9" />
            <SecretRow label="Omni-channel Webhook Secret" value="wh_qcp_live_b2c5d8e3f9a1c7d4" />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Verify webhook signatures using the Omni-channel Webhook Secret to prevent spoofed requests.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">POST</Badge>
                <CardTitle className="text-base">Dialer call disposition webhook</CardTitle>
              </div>
              <CardDescription>Your dialer should POST call outcomes to this endpoint after each call completes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock code={DIALER_WEBHOOK} />
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-lg border p-3">
                  <div className="font-medium text-sm text-foreground mb-1">disposition values</div>
                  <div className="font-mono space-y-1">
                    <div>promise_to_pay</div><div>paid</div><div>no_answer</div><div>busy</div><div>not_reachable</div><div>refused_to_pay</div>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium text-sm text-foreground mb-1">Notes</div>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>promiseDate and promiseAmount only required for promise_to_pay</li>
                    <li>duration is in seconds</li>
                    <li>Successful POST returns 200 with case updated</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">POST</Badge>
                <CardTitle className="text-base">Payment received webhook</CardTitle>
              </div>
              <CardDescription>Payment gateways or your internal systems can push payment confirmations here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock code={PAYMENT_WEBHOOK} />
              <div className="text-xs text-muted-foreground rounded-lg border p-3">
                <div className="font-medium text-sm text-foreground mb-1">paymentMode values</div>
                <div className="font-mono">UPI, NEFT, IMPS, RTGS, Cash, Cheque, Card</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Connected integrations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Exotel Dialer", status: "Connected", since: "Apr 2026", icon: "📞" },
              { name: "MSG91 (SMS/WhatsApp)", status: "Connected", since: "Apr 2026", icon: "💬" },
              { name: "SendGrid (Email)", status: "Connected", since: "Mar 2026", icon: "📧" },
              { name: "Razorpay (Payments)", status: "Pending setup", since: "—", icon: "💳" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-4 rounded-lg border px-4 py-3">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">Since {item.since}</div>
                </div>
                <Badge variant={item.status === "Connected" ? "default" : "secondary"} className="text-xs">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </CollectionLayout>
  );
}
