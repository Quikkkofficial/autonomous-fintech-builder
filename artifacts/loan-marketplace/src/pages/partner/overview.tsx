import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, FileText, IndianRupee, TrendingUp, PlusCircle, Upload,
  KeyRound, Megaphone, Users2, ShieldCheck, Copy, Check, ArrowRight,
  BarChart3, Target, Clock, Zap,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface PartnerStats {
  leads: { total: number; submitted: number; approved: number; disbursed: number; rejected: number };
  earnings: { totalDisbursedAmt: number; paid: number; pending: number; conversionPct: number };
}

function CopyBtn({ text }: { text: string }) {
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

export default function PartnerOverview() {
  const { user } = useAuth();
  const stats = useQuery({ queryKey: ["partner", "stats"], queryFn: () => api<PartnerStats>("/partner/stats") });
  const series = useQuery({ queryKey: ["partner", "timeseries"], queryFn: () => api<Array<{ date: string; count: number }>>("/partner/timeseries") });

  if (stats.isLoading) {
    return <PartnerLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PartnerLayout>;
  }
  const s = stats.data!;

  const funnelData = [
    { stage: "Submitted", count: s.leads.submitted },
    { stage: "Approved", count: s.leads.approved },
    { stage: "Disbursed", count: s.leads.disbursed },
    { stage: "Rejected", count: s.leads.rejected },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Channel Partner Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Your code: <span className="font-mono text-foreground">{user?.partnerCode ?? "—"}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/partner/bulk-upload">
              <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Bulk upload</Button>
            </Link>
            <Link href="/partner/leads/new">
              <Button><PlusCircle className="h-4 w-4 mr-2" />Create new lead</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={FileText} label="Total leads" value={s.leads.total} sub={`${s.leads.submitted} pending`} />
          <Kpi icon={TrendingUp} label="Conversion" value={`${s.earnings.conversionPct}%`} sub={`${s.leads.disbursed} disbursed`} />
          <Kpi icon={IndianRupee} label="Disbursed value" value={formatINR(s.earnings.totalDisbursedAmt)} />
          <Kpi icon={IndianRupee} label="Earnings" value={formatINR(s.earnings.paid)} sub={`${formatINR(s.earnings.pending)} pending`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Leads (last 30 days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={series.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(239 84% 67%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pipeline funnel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="stage" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(239 84% 67%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardContent className="pt-5">
              <Target className="h-5 w-5 text-indigo-600 mb-2" />
              <div className="text-xl font-bold">{s.leads.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="pt-5">
              <BarChart3 className="h-5 w-5 text-green-600 mb-2" />
              <div className="text-xl font-bold">{s.leads.disbursed}</div>
              <div className="text-sm text-muted-foreground">Disbursed</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="pt-5">
              <Clock className="h-5 w-5 text-amber-600 mb-2" />
              <div className="text-xl font-bold">{s.leads.submitted}</div>
              <div className="text-sm text-muted-foreground">In review</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="pt-5">
              <Zap className="h-5 w-5 text-red-600 mb-2" />
              <div className="text-xl font-bold">{formatINR(s.earnings.pending)}</div>
              <div className="text-sm text-muted-foreground">Pending payout</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Partner growth tools</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <Link href="/partner/bulk-upload">
                <Tool title="Bulk upload leads" desc="Upload CSV lead sheets with automatic field mapping and error highlighting." icon={Upload} active />
              </Link>
              <Tool title="Campaign links" desc="Generate tracked share links for WhatsApp, email, and QR codes." icon={Megaphone} />
              <Tool title="Team access" desc="Add sub-agents and control source attribution across your team." icon={Users2} />
              <Link href="/partner/api-integration">
                <Tool title="API key connect" desc="Push leads from any CRM or website using your partner API key." icon={KeyRound} active />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API keys</CardTitle>
                <Link href="/partner/api-integration">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Manage <ArrowRight className="h-3 w-3" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeyRow label="Partner API key" value="pk_qsp_live_e3f9a1b2" />
              <KeyRow label="Webhook signing" value="wh_qsp_live_a7f2b4c8" />
              <Badge variant="secondary" className="w-fit text-xs">Ready for CRM integration</Badge>
              <p className="text-xs text-muted-foreground">Use these keys to connect your website, CRM, or marketing stack.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-0">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-lg">Ready to scale your pipeline?</div>
                <div className="text-indigo-200 text-sm mt-1">Bulk upload 100+ leads at once or integrate via API for fully automated sourcing.</div>
              </div>
              <div className="flex gap-2">
                <Link href="/partner/bulk-upload">
                  <Button variant="secondary" size="sm" className="gap-1.5 text-indigo-700">
                    <Upload className="h-4 w-4" />Bulk upload
                  </Button>
                </Link>
                <Link href="/partner/api-integration">
                  <Button variant="outline" size="sm" className="gap-1.5 border-white text-white hover:bg-white/10">
                    <KeyRound className="h-4 w-4" />API setup
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{label}</div><Icon className="h-4 w-4 text-indigo-600" /></div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Tool({ title, desc, icon: Icon, active }: { title: string; desc: string; icon: React.ComponentType<{ className?: string }>; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${active ? "bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50 cursor-pointer" : "bg-muted/20"}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${active ? "bg-indigo-100" : "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-primary"}`} />
        </div>
        <div className="space-y-1">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function KeyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-mono text-sm">{value}••••••••</div>
      </div>
      <CopyBtn text={value} />
    </div>
  );
}
