import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, IndianRupee, CheckCircle2, PhoneCall, Mail, MessageSquare, KeyRound, Globe2, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  cases: { assigned: number; unassigned: number; bucket1to30: number; bucket31to60: number; bucket61to90: number; bucket90plus: number };
  money: { outstanding: number; recovered: number };
  followups: number;
}

export default function CollectionOverview() {
  const stats = useQuery({ queryKey: ["collection", "stats"], queryFn: () => api<Stats>("/collection/stats") });

  if (stats.isLoading) {
    return <CollectionLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></CollectionLayout>;
  }
  const s = stats.data!;
  const buckets = [
    { name: "1-30 DPD", value: s.cases.bucket1to30 },
    { name: "31-60 DPD", value: s.cases.bucket31to60 },
    { name: "61-90 DPD", value: s.cases.bucket61to90 },
    { name: "90+ DPD", value: s.cases.bucket90plus },
  ];

  return (
    <CollectionLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collection Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track delinquencies and recover outstanding amounts.</p>
          </div>
          <Link href="/collection/cases?filter=unassigned"><Button variant="outline">Pick up new cases ({s.cases.unassigned})</Button></Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={AlertTriangle} label="Assigned cases" value={s.cases.assigned} />
          <Kpi icon={IndianRupee} label="Outstanding" value={formatINR(s.money.outstanding)} />
          <Kpi icon={CheckCircle2} label="Recovered" value={formatINR(s.money.recovered)} />
          <Kpi icon={AlertTriangle} label="Follow-ups logged" value={s.followups} />
        </div>

        <Card>
          <CardHeader><CardTitle>DPD bucket distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(0 84% 50%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Omni-channel recovery stack</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <Feature title="Voice + dialer" desc="Call tasks, retry rules, and call disposition tracking." icon={PhoneCall} />
              <Feature title="SMS / WhatsApp" desc="Automated reminders with promise-to-pay capture." icon={MessageSquare} />
              <Feature title="Email nudges" desc="Send payment links, statements, and escalation notices." icon={Mail} />
              <Feature title="Web portal" desc="Collector dashboard with live queues and SLA markers." icon={Globe2} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>API keys</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <SecretRow label="Collection portal" value="pk_qcp_live_••••••••" />
              <SecretRow label="Omni-channel webhook" value="wh_qcp_live_••••••••" />
              <p className="text-xs text-muted-foreground">Connect dialers, SMS providers, and CRMs using secure API credentials.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CollectionLayout>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">{label}</div><Icon className="h-4 w-4 text-primary" /></div>
        <div className="text-2xl font-bold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

function Feature({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ComponentType<{ className?: string }> }) {
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

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}
