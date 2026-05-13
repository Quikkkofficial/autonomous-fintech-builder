import { useState } from "react";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, Key, Code2, BookOpen, AlertTriangle, CheckCircle2, Terminal, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

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

export default function PartnerApiIntegration() {
  const { user } = useAuth();
  const partnerCode = user?.partnerCode ?? "QSP-00001";

  const webhookCode = `POST https://api.quikkk.in/partner/webhook
Authorization: Bearer <your_api_key>
Content-Type: application/json

{
  "event": "lead.status_changed",
  "leadId": "LA-XXXXXXXX",
  "status": "approved",
  "partnerCode": "${partnerCode}",
  "timestamp": "2026-05-13T12:00:00Z"
}`;

  const pushLeadCode = `POST https://api.quikkk.in/partner/leads
Authorization: Bearer pk_qsp_live_••••••••
Content-Type: application/json

{
  "customerName": "Rahul Sharma",
  "customerPhone": "9876543210",
  "loanType": "personal",
  "amount": 500000,
  "tenureMonths": 36,
  "referralSource": "website",
  "campaign": "may-2026"
}`;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Integration</h1>
            <p className="text-muted-foreground mt-1">Connect your website, CRM, or app to push leads automatically.</p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-300 gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Partner: {partnerCode}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-indigo-200 bg-indigo-50/40">
            <CardContent className="pt-5">
              <Zap className="h-5 w-5 text-indigo-600 mb-2" />
              <div className="font-semibold text-sm">Push leads via API</div>
              <div className="text-xs text-muted-foreground mt-1">Submit leads from any platform in real-time</div>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50/40">
            <CardContent className="pt-5">
              <Code2 className="h-5 w-5 text-indigo-600 mb-2" />
              <div className="font-semibold text-sm">Webhook events</div>
              <div className="text-xs text-muted-foreground mt-1">Receive status updates to your endpoint</div>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50/40">
            <CardContent className="pt-5">
              <Key className="h-5 w-5 text-indigo-600 mb-2" />
              <div className="font-semibold text-sm">Secure credentials</div>
              <div className="text-xs text-muted-foreground mt-1">JWT-based API keys with scoped permissions</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-indigo-600" />Your API Credentials</CardTitle>
            <CardDescription>Use these to authenticate requests to the Quikkk Partner API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SecretRow label="Partner API Key" value="pk_qsp_live_e3f9a1b2c4d5f6a7" />
            <SecretRow label="Webhook Signing Secret" value="wh_qsp_live_a7f2b4c8d1e5f9b3" />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Never expose your API key in client-side code or public repositories. Rotate keys immediately if compromised.
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="push">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="push"><Terminal className="h-4 w-4 mr-2" />Push Leads</TabsTrigger>
            <TabsTrigger value="webhook"><Code2 className="h-4 w-4 mr-2" />Webhooks</TabsTrigger>
            <TabsTrigger value="guide"><BookOpen className="h-4 w-4 mr-2" />Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="push" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Push a lead programmatically</CardTitle>
                <CardDescription>POST to our API from your website, CRM, or backend whenever a customer fills a form.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock code={pushLeadCode} />
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="font-medium mb-1 text-green-700">✓ loanType options</div>
                    <div className="text-xs text-muted-foreground font-mono">personal, home, auto, business, education, gold, fd, mutual_fund, insurance</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="font-medium mb-1">Campaign tagging</div>
                    <div className="text-xs text-muted-foreground">Add <code className="font-mono">campaign</code> and <code className="font-mono">referralSource</code> for attribution tracking.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receive status updates</CardTitle>
                <CardDescription>Configure a webhook URL in your settings and we'll POST events to it when lead statuses change.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-sm font-medium mb-2">Your webhook URL</div>
                  <div className="flex items-center gap-2">
                    <input className="flex-1 rounded border px-3 py-2 text-sm font-mono bg-background" placeholder="https://yourapp.com/webhooks/quikkk" />
                    <Button size="sm">Save</Button>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Example payload</div>
                  <CodeBlock code={webhookCode} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { event: "lead.created", desc: "New lead submitted" },
                    { event: "lead.status_changed", desc: "Status updated (approved, rejected, disbursed)" },
                    { event: "payout.released", desc: "Commission payment released" },
                    { event: "lead.duplicate", desc: "Lead rejected as duplicate" },
                  ].map((e) => (
                    <div key={e.event} className="rounded-lg border p-3 text-sm">
                      <code className="text-xs bg-zinc-950 text-zinc-100 rounded px-2 py-0.5 font-mono">{e.event}</code>
                      <p className="text-muted-foreground text-xs mt-1">{e.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { done: true, step: "Get API credentials from this page" },
                  { done: true, step: "Add Authorization header to all requests" },
                  { done: false, step: "Build lead capture form on your website/app" },
                  { done: false, step: "POST leads to /partner/leads on form submit" },
                  { done: false, step: "Configure webhook URL to receive status updates" },
                  { done: false, step: "Test with a sample lead in UAT" },
                  { done: false, step: "Go live — leads appear in My Leads instantly" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm border ${item.done ? "bg-green-50 border-green-200" : "bg-muted/30"}`}>
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />}
                    <span className={item.done ? "text-green-800 font-medium" : ""}>{item.step}</span>
                    {item.done && <Badge variant="secondary" className="ml-auto text-xs">Done</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}
