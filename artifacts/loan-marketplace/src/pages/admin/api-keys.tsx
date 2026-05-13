import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Copy, Check, Key, Webhook, Code2, BookOpen, AlertTriangle,
  CheckCircle2, ArrowRight, Terminal, Database, Zap, Globe,
  RefreshCw, Wifi, WifiOff, Clock, ArrowUpCircle, XCircle, Activity, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg bg-zinc-950 text-zinc-100 text-xs font-mono p-4 overflow-x-auto">
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
      <pre className="pr-8">{code}</pre>
    </div>
  );
}

function CredRow({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [show, setShow] = useState(false);
  const display = masked && !show ? value.slice(0, 6) + "••••••••••" : value;
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm mt-0.5 break-all">{display}</div>
      </div>
      {masked && (
        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShow(!show)}>
          {show ? "Hide" : "Show"}
        </Button>
      )}
      <CopyButton text={value} />
    </div>
  );
}

type UmStatus = {
  tokenValid: boolean;
  tokenTtlSec: number;
  tokenGeneratedAt: number | null;
  tokenExpiresAt: number | null;
  lastError: string | null;
  ipBlocked: boolean;
  serverIp: string | null;
  stats: { totalPushed: number; totalSuccess: number; totalError: number };
  recentPushes: Array<{ leadId: string; umLeadId: string | null; status: "success" | "error"; message: string; at: number }>;
  endpoint: string;
  clientId: string;
};

function TokenTTL({ ttlSec }: { ttlSec: number }) {
  const [sec, setSec] = useState(ttlSec);
  useEffect(() => { setSec(ttlSec); }, [ttlSec]);
  useEffect(() => {
    if (sec <= 0) return;
    const t = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [sec]);
  const pct = Math.round((sec / 600) * 100);
  const color = sec > 120 ? "bg-green-500" : sec > 30 ? "bg-amber-500" : "bg-red-500";
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Token TTL</span>
        <span className="font-mono font-medium text-foreground">{mins}:{String(secs).padStart(2, "0")}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LiveStatusWidget() {
  const { toast } = useToast();

  const status = useQuery<UmStatus>({
    queryKey: ["um", "status"],
    queryFn: () => api<UmStatus>("/um/status"),
    refetchInterval: 10_000,
    retry: 1,
  });

  const refresh = useMutation({
    mutationFn: () => api("/um/token/refresh", { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Token refreshed", description: "New Urban Money JWT generated successfully." });
      status.refetch();
    },
    onError: (e: Error) => {
      toast({ title: "Token refresh failed", description: e.message, variant: "destructive" });
    },
  });

  const d = status.data;
  const connected = d?.tokenValid ?? false;
  const successRate = d && d.stats.totalPushed > 0
    ? Math.round((d.stats.totalSuccess / d.stats.totalPushed) * 100)
    : null;

  return (
    <Card className={connected ? "border-green-300 bg-green-50/30" : "border-red-200 bg-red-50/20"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {connected ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            Urban Money API — Live Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={connected ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${connected ? "bg-green-600 animate-pulse" : "bg-red-500"}`} />
              {connected ? "Connected" : "Disconnected"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              className="gap-1.5 h-7 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`} />
              {refresh.isPending ? "Connecting…" : "Refresh Token"}
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Polling every 10 s · Endpoint: <span className="font-mono">umapi-uat.urbanmoney.com</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-background px-4 py-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Total pushed</div>
            <div className="text-2xl font-bold">{d?.stats.totalPushed ?? 0}</div>
          </div>
          <div className="rounded-lg border bg-background px-4 py-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Success</div>
            <div className="text-2xl font-bold text-green-600">{d?.stats.totalSuccess ?? 0}</div>
          </div>
          <div className="rounded-lg border bg-background px-4 py-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> Failed</div>
            <div className="text-2xl font-bold text-red-600">{d?.stats.totalError ?? 0}</div>
          </div>
          <div className="rounded-lg border bg-background px-4 py-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="h-3 w-3 text-blue-500" /> Success rate</div>
            <div className="text-2xl font-bold">{successRate !== null ? `${successRate}%` : "—"}</div>
          </div>
        </div>

        {connected && d && (
          <TokenTTL ttlSec={d.tokenTtlSec} />
        )}

        {d?.ipBlocked && (
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-orange-800 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              IP Address Not Whitelisted — Action Required
            </div>
            <p className="text-orange-700 text-xs leading-relaxed">
              The Urban Money UAT API rejected our server's IP address. This is a standard security control on their side.
              Contact Urban Money's technical team and ask them to whitelist the following IP:
            </p>
            <div className="flex items-center gap-2 rounded-md bg-white border border-orange-200 px-3 py-2">
              <code className="font-mono text-sm font-bold text-orange-900 flex-1">{d.serverIp ?? "Detecting…"}</code>
              {d.serverIp && <CopyButton text={d.serverIp} />}
            </div>
            <p className="text-orange-600 text-xs">
              Once whitelisted, click "Refresh Token" above and the connection will go live automatically.
              For the production deployment, a separate IP will need to be whitelisted.
            </p>
          </div>
        )}

        {!connected && !d?.ipBlocked && !status.isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            No active token. Click "Refresh Token" to generate a new JWT and connect to the Urban Money API.
            {d?.lastError && <span className="text-xs text-red-700">({d.lastError})</span>}
          </div>
        )}

        {d?.recentPushes && d.recentPushes.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground" />Recent Push Activity</div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Lead ID</th>
                    <th className="text-left px-3 py-2">UM Lead ID</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Message</th>
                    <th className="text-left px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentPushes.map((p, i) => (
                    <tr key={i} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono">{p.leadId}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{p.umLeadId ?? "—"}</td>
                      <td className="px-3 py-2">
                        {p.status === "success"
                          ? <Badge className="text-[10px] h-4 px-1.5 bg-green-100 text-green-700 border-green-300">Accepted</Badge>
                          : <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Failed</Badge>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[180px] truncate">{p.message}</td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(p.at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {d?.recentPushes?.length === 0 && (
          <div className="rounded-lg bg-muted/30 border border-dashed p-4 text-center text-xs text-muted-foreground">
            No leads pushed yet. Leads submitted by channel partners are automatically forwarded to Urban Money.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PRODUCT_IDS = [
  { name: "Personal Loan", id: 2 },
  { name: "Home Loan", id: 1 },
  { name: "Business Loan", id: 4 },
  { name: "Car Loan", id: 9 },
  { name: "Loan Against Property", id: 3 },
];

const TOKEN_REQUEST_CODE = `POST https://umapi-uat.urbanmoney.com/tpapi/v1/generateToken

Headers:
  client-id: 2aee44bcb4630f5b
  client-secret: 7297eb7e7624b787f077fc1c8f02484b
  Content-Type: application/json`;

const TOKEN_RESPONSE_CODE = `{
  "access_token": "<jwt_token>",
  "token_type": "Bearer",
  "expires_in": "10 min"
}`;

const LEAD_REQUEST_CODE = `POST https://umapi-uat.urbanmoney.com/tpapi/v1/lead/create

Headers:
  Authorization: Bearer <access_token>
  Content-Type: application/json

Body:
{
  "customerName": "Rahul Sharma",
  "countryCode": "+91",
  "phoneNo": "9876543210",
  "loanAmount": 500000,
  "monthlyIncome": 45000,
  "creditScore": 750,
  "productId": 2,
  "remarks": "Customer interested in personal loan"
}`;

const LEAD_RESPONSE_CODE = `{
  "message": "Lead accepted",
  "leadId": "<vendor_lead_id>"
}`;

const CURL_EXAMPLE = `# Step 1: Generate token
curl -X POST https://umapi-uat.urbanmoney.com/tpapi/v1/generateToken \\
  -H "client-id: 2aee44bcb4630f5b" \\
  -H "client-secret: 7297eb7e7624b787f077fc1c8f02484b" \\
  -H "Content-Type: application/json"

# Step 2: Submit lead (replace TOKEN with actual token)
curl -X POST https://umapi-uat.urbanmoney.com/tpapi/v1/lead/create \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNo":"9876543210","productId":2,"loanAmount":500000}'`;

export default function AdminApiKeys() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Integration</h1>
            <p className="text-muted-foreground mt-1">
              Urban Money Lead Integration API — real-time lead forwarding to partner network.
            </p>
          </div>
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 gap-1.5">
            <Zap className="h-3.5 w-3.5" /> UAT Environment
          </Badge>
        </div>

        <LiveStatusWidget />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-5">
              <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
              <div className="font-semibold text-sm">Auto Push</div>
              <div className="text-xs text-muted-foreground mt-1">Every partner lead auto-forwarded to UM on creation</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-5">
              <Globe className="h-5 w-5 text-blue-600 mb-2" />
              <div className="font-semibold text-sm">Endpoint</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">umapi-uat.urbanmoney.com</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-5">
              <Database className="h-5 w-5 text-purple-600 mb-2" />
              <div className="font-semibold text-sm">5 Products</div>
              <div className="text-xs text-muted-foreground mt-1">Personal, Home, Business, Car, LAP</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" />Vendor Credentials</CardTitle>
            <CardDescription>Stored server-side. Never exposed to the frontend or end users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CredRow label="client-id" value="2aee44bcb4630f5b" />
            <CredRow label="client-secret" value="7297eb7e7624b787f077fc1c8f02484b" masked />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>The client-secret is embedded in the API server only — it is never sent to client browsers.</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="docs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-2" />API Docs</TabsTrigger>
            <TabsTrigger value="products"><Database className="h-4 w-4 mr-2" />Product IDs</TabsTrigger>
            <TabsTrigger value="curl"><Terminal className="h-4 w-4 mr-2" />Quick Start</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="space-y-5 mt-5">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">POST</Badge>
                  <CardTitle className="text-base">Step 1 — Generate Token</CardTitle>
                </div>
                <CardDescription className="font-mono text-xs">https://umapi-uat.urbanmoney.com/tpapi/v1/generateToken</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Request (headers only, no body required)</div>
                  <CodeBlock code={TOKEN_REQUEST_CODE} lang="http" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Success Response (200)</div>
                  <CodeBlock code={TOKEN_RESPONSE_CODE} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-sm">
                    <Badge variant="outline" className="text-red-600 border-red-300 mb-2">400</Badge>
                    <p className="text-muted-foreground text-xs">Missing client-id or client-secret headers</p>
                  </div>
                  <div className="rounded-lg border p-3 text-sm">
                    <Badge variant="outline" className="text-red-600 border-red-300 mb-2">401</Badge>
                    <p className="text-muted-foreground text-xs">Invalid credentials provided</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <ArrowRight className="h-4 w-4" />
              <div className="h-px flex-1 bg-border" />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">POST</Badge>
                  <CardTitle className="text-base">Step 2 — Create Lead</CardTitle>
                </div>
                <CardDescription className="font-mono text-xs">https://umapi-uat.urbanmoney.com/tpapi/v1/lead/create</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Request</div>
                  <CodeBlock code={LEAD_REQUEST_CODE} lang="http" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Success Response (200)</div>
                  <CodeBlock code={LEAD_RESPONSE_CODE} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Field Reference</div>
                  <div className="overflow-x-auto rounded-lg border text-sm">
                    <table className="w-full">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Field</th>
                          <th className="text-left px-3 py-2 font-medium">Type</th>
                          <th className="text-left px-3 py-2 font-medium">Required</th>
                          <th className="text-left px-3 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { f: "phoneNo", t: "string", r: true, d: "10-digit mobile number" },
                          { f: "productId", t: "number", r: true, d: "Numeric product ID (see table)" },
                          { f: "customerName", t: "string", r: false, d: "Customer full name" },
                          { f: "countryCode", t: "string", r: false, d: "Default +91" },
                          { f: "loanAmount", t: "number", r: false, d: "Requested loan amount" },
                          { f: "monthlyIncome", t: "number", r: false, d: "Customer monthly income" },
                          { f: "creditScore", t: "number", r: false, d: "Customer credit score" },
                          { f: "remarks", t: "string", r: false, d: "Multiple remarks — use | as separator" },
                        ].map((row) => (
                          <tr key={row.f} className="border-t">
                            <td className="px-3 py-2 font-mono text-xs text-primary">{row.f}</td>
                            <td className="px-3 py-2 text-xs">{row.t}</td>
                            <td className="px-3 py-2">
                              {row.r
                                ? <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-300">Required</Badge>
                                : <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Optional</Badge>}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{row.d}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { code: "400", desc: "Invalid phone number (not 10 digits)" },
                    { code: "400", desc: "Invalid or unsupported productId" },
                    { code: "401", desc: "Token missing, expired, or invalid" },
                  ].map((e, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <Badge variant="outline" className="text-red-600 border-red-300 mb-2">{e.code}</Badge>
                      <p className="text-muted-foreground text-xs">{e.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="pt-4 text-sm">
                <div className="font-medium mb-1 flex items-center gap-2"><Code2 className="h-4 w-4" />Remarks format</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Use pipe <code className="bg-white px-1 rounded border text-xs">|</code> as separator for multiple remarks.
                  Trailing pipes are allowed. Example: <code className="bg-white px-1 rounded border text-xs">ABC|CFF|Customer follow-up pending|</code>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle>Product ID Mapping</CardTitle>
                <CardDescription>
                  Always send the numeric <code className="font-mono text-xs bg-muted px-1 rounded">productId</code> — never the product name.
                  Invalid IDs will cause lead rejection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Product Name</th>
                        <th className="text-left px-4 py-3 font-medium">productId</th>
                        <th className="text-left px-4 py-3 font-medium">Quikkk Loan Types</th>
                        <th className="text-left px-4 py-3 font-medium">Example payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Personal Loan", id: 2, types: "personal, education, gold" },
                        { name: "Home Loan", id: 1, types: "home" },
                        { name: "Business Loan", id: 4, types: "business" },
                        { name: "Car Loan", id: 9, types: "auto" },
                        { name: "Loan Against Property", id: 3, types: "(manual push only)" },
                      ].map((p) => (
                        <tr key={p.id} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="font-mono text-base px-3 py-1">{p.id}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{p.types}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-zinc-950 text-zinc-100 rounded px-2 py-1 font-mono">
                                {`"productId": ${p.id}`}
                              </code>
                              <CopyButton text={`"productId": ${p.id}`} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Any productId not in the above table will cause immediate lead rejection. Never send product names.</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curl" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5" />Quick Start (cURL)</CardTitle>
                <CardDescription>Copy and run these commands to test the integration end-to-end.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock code={CURL_EXAMPLE} lang="bash" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Token notes</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Token expires in exactly 10 minutes</li>
                      <li>Quikkk auto-refreshes before expiry</li>
                      <li>Send in <code className="font-mono">Authorization: Bearer</code> header</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Lead notes</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Do not re-submit the same lead</li>
                      <li>Duplicate leads will be rejected by UM</li>
                      <li><code className="font-mono">phoneNo</code> and <code className="font-mono">productId</code> are mandatory</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Partner Portal Keys</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <CredRow label="Partner API Key" value="pk_qsp_live_e3f9a1b2c4d5" masked />
              <CredRow label="Webhook Signing Secret" value="wh_qsp_live_a7f2b4c8d1e5" masked />
              <p className="text-xs text-muted-foreground">Use these to authenticate inbound webhook events from partner portals and CRM systems.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" />Collection Portal Keys</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <CredRow label="Collection Portal Key" value="pk_qcp_live_f8a3b7c2d6e1" masked />
              <CredRow label="Omni-channel Webhook" value="wh_qcp_live_b2c5d8e3f9a1" masked />
              <p className="text-xs text-muted-foreground">Connect dialers, SMS providers, and collection CRMs using these secure credentials.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
