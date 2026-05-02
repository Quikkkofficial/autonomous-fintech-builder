import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, IndianRupee, TrendingUp, PlusCircle, Upload, KeyRound, Megaphone, Users2, ShieldCheck, MessageSquareMore } from "lucide-react";
import { formatINR } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface PartnerStats {
  leads: { total: number; submitted: number; approved: number; disbursed: number; rejected: number };
  earnings: { totalDisbursedAmt: number; paid: number; pending: number; conversionPct: number };
}

export default function PartnerOverview() {
  const { user } = useAuth();
  const stats = useQuery({ queryKey: ["partner", "stats"], queryFn: () => api<PartnerStats>("/partner/stats") });
  const series = useQuery({ queryKey: ["partner", "timeseries"], queryFn: () => api<Array<{ date: string; count: number }>>("/partner/timeseries") });

  if (stats.isLoading) {
    return <PartnerLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PartnerLayout>;
  }
  const s = stats.data!;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Channel Partner Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your code: <span className="font-mono text-foreground">{user?.partnerCode ?? "—"}</span></p>
          </div>
          <Link href="/partner/leads/new"><Button><PlusCircle className="h-4 w-4 mr-2" />Create new lead</Button></Link>
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
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={series.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(0 84% 50%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Row label="Submitted" value={s.leads.submitted} />
              <Row label="Approved" value={s.leads.approved} />
              <Row label="Disbursed" value={s.leads.disbursed} />
              <Row label="Rejected" value={s.leads.rejected} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Partner growth tools</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <Tool title="Bulk upload leads" desc="Upload CSV/XLSX lead sheets and map lender/product fields." icon={Upload} />
              <Tool title="Campaign links" desc="Generate tracked share links for WhatsApp, email, and QR." icon={Megaphone} />
              <Tool title="Team access" desc="Add sub-agents and control source attribution." icon={Users2} />
              <Tool title="Security controls" desc="Rotate API keys, set IP allowlists, and scope permissions." icon={ShieldCheck} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>API keys</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <KeyRow label="Partner portal" value="pk_qsp_live_••••••••" />
              <KeyRow label="Webhook signing" value="wh_qsp_live_••••••••" />
              <Badge variant="secondary" className="w-fit">Ready for CRM integration</Badge>
              <p className="text-xs text-muted-foreground">Use these keys to connect with your website, CRM, or marketing stack.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PartnerLayout>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{label}</div><Icon className="h-4 w-4 text-primary" /></div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}

function Tool({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border p-4 bg-muted/20">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div>
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function KeyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}
