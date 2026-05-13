import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Copy, Check, Key, Webhook, Code2, BookOpen, AlertTriangle,
  CheckCircle2, ArrowRight, Terminal, Database, Zap, Globe
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
              Mekyek Lead Integration API — connect any CRM, website, or platform.
            </p>
          </div>
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 gap-1.5">
            <Zap className="h-3.5 w-3.5" /> UAT Environment
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-5">
              <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
              <div className="font-semibold text-sm">Authentication</div>
              <div className="text-xs text-muted-foreground mt-1">JWT token, 10 min expiry</div>
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
            <CardDescription>Use these credentials to generate access tokens for the Lead API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CredRow label="client-id" value="2aee44bcb4630f5b" />
            <CredRow label="client-secret" value="7297eb7e7624b787f077fc1c8f02484b" masked />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Keep the client-secret confidential. Never expose it in frontend code or public repositories.</span>
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
                        <th className="text-left px-4 py-3 font-medium">Example payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRODUCT_IDS.map((p) => (
                        <tr key={p.id} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="font-mono text-base px-3 py-1">{p.id}</Badge>
                          </td>
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
                  <span>Any productId not in the above table will result in immediate lead rejection. Do not send product names in the payload.</span>
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
                      <li>Generate a fresh token before each session</li>
                      <li>Send in <code className="font-mono">Authorization: Bearer</code> header</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Lead notes</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Do not re-submit the same lead</li>
                      <li>Duplicate leads will be rejected</li>
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
