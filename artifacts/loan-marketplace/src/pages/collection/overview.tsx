import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, AlertTriangle, IndianRupee, CheckCircle2, PhoneCall,
  Mail, MessageSquare, KeyRound, Globe2, TrendingUp, Clock,
  Target, ArrowRight, BarChart3, Radio,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

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
  const totalCases = s.cases.bucket1to30 + s.cases.bucket31to60 + s.cases.bucket61to90 + s.cases.bucket90plus;
  const recoveryRate = s.money.outstanding > 0 ? Math.round((s.money.recovered / (s.money.outstanding + s.money.recovered)) * 100) : 0;

  const buckets = [
    { name: "1-30 DPD", value: s.cases.bucket1to30, color: "#eab308" },
    { name: "31-60 DPD", value: s.cases.bucket31to60, color: "#f97316" },
    { name: "61-90 DPD", value: s.cases.bucket61to90, color: "#ef4444" },
    { name: "90+ DPD", value: s.cases.bucket90plus, color: "#991b1b" },
  ];

  const trendData = [
    { day: "Mon", recovered: 45000, followups: 8 },
    { day: "Tue", recovered: 62000, followups: 12 },
    { day: "Wed", recovered: 38000, followups: 7 },
    { day: "Thu", recovered: 91000, followups: 15 },
    { day: "Fri", recovered: 75000, followups: 11 },
    { day: "Sat", recovered: 28000, followups: 5 },
    { day: "Sun", recovered: 14000, followups: 3 },
  ];

  return (
    <CollectionLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collection Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track delinquencies and recover outstanding amounts.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/collection/omni-channel">
              <Button variant="outline" className="gap-1.5"><Radio className="h-4 w-4" />Omni-channel</Button>
            </Link>
            <Link href="/collection/cases?filter=unassigned">
              <Button variant="outline">Pick up new cases ({s.cases.unassigned})</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Kpi icon={AlertTriangle} label="Assigned" value={s.cases.assigned} color="amber" />
          <Kpi icon={Clock} label="Unassigned" value={s.cases.unassigned} color="orange" />
          <Kpi icon={IndianRupee} label="Outstanding" value={formatINR(s.money.outstanding)} color="red" small />
          <Kpi icon={CheckCircle2} label="Recovered" value={formatINR(s.money.recovered)} color="green" small />
          <Kpi icon={BarChart3} label="Recovery rate" value={`${recoveryRate}%`} color="blue" />
          <Kpi icon={TrendingUp} label="Follow-ups" value={s.followups} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>DPD bucket distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={buckets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(0 84% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Weekly recovery trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Recovered"]} />
                  <Line type="monotone" dataKey="recovered" stroke="hsl(142 70% 45%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">{s.cases.bucket1to30}</div>
              <div className="text-xs text-muted-foreground mt-1">1–30 DPD</div>
              <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs mt-2">Early bucket</Badge>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">{s.cases.bucket31to60}</div>
              <div className="text-xs text-muted-foreground mt-1">31–60 DPD</div>
              <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs mt-2">Mid bucket</Badge>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">{s.cases.bucket61to90}</div>
              <div className="text-xs text-muted-foreground mt-1">61–90 DPD</div>
              <Badge variant="outline" className="text-red-700 border-red-300 text-xs mt-2">Late bucket</Badge>
            </CardContent>
          </Card>
          <Card className="border-red-300 bg-red-100/30">
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">{s.cases.bucket90plus}</div>
              <div className="text-xs text-muted-foreground mt-1">90+ DPD</div>
              <Badge variant="destructive" className="text-xs mt-2">Critical</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Omni-channel recovery stack</CardTitle>
                <Link href="/collection/omni-channel">
                  <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">Configure <ArrowRight className="h-3 w-3" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <Feature title="Voice + dialer" desc="Call tasks, retry rules, call disposition tracking, and recording." icon={PhoneCall} stat="48 calls today" color="amber" />
              <Feature title="SMS / WhatsApp" desc="Automated reminders with promise-to-pay capture and delivery tracking." icon={MessageSquare} stat="124 sent today" color="green" />
              <Feature title="Email nudges" desc="Send payment links, statements, and escalation notices with tracking." icon={Mail} stat="31 emails sent" color="blue" />
              <Feature title="Web portal" desc="Collector dashboard with live queues, SLA markers, and self-pay links." icon={Globe2} stat="Active" color="purple" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">API keys</CardTitle>
                  <Link href="/collection/api-integration">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Manage <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <SecretRow label="Collection portal" value="pk_qcp_live_••••••••" />
                <SecretRow label="Omni-channel webhook" value="wh_qcp_live_••••••••" />
                <p className="text-xs text-muted-foreground">Connect dialers, SMS providers, and CRMs.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Today's targets</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cases to contact</span>
                  <span className="font-semibold">{Math.min(s.cases.assigned, 15)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recovery target</span>
                  <span className="font-semibold">{formatINR(Math.round(s.money.outstanding * 0.1))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Follow-ups due</span>
                  <span className="font-semibold">{s.followups}</span>
                </div>
                <Link href="/collection/cases">
                  <Button size="sm" className="w-full mt-1"><Target className="h-4 w-4 mr-2" />View my cases</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CollectionLayout>
  );
}

function Kpi({ icon: Icon, label, value, color, small }: { icon: any; label: string; value: React.ReactNode; color: string; small?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </div>
        <div className={`font-bold mt-1 ${small ? "text-base" : "text-2xl"}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Feature({ title, desc, icon: Icon, stat, color }: { title: string; desc: string; icon: React.ComponentType<{ className?: string }>; stat: string; color: string }) {
  return (
    <div className={`rounded-xl border border-${color}-200 p-4 bg-${color}-50/30`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg bg-${color}-100 p-2`}><Icon className={`h-4 w-4 text-${color}-600`} /></div>
        <div className="space-y-1 flex-1">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
          <Badge variant="outline" className={`text-xs text-${color}-700 border-${color}-300`}>{stat}</Badge>
        </div>
      </div>
    </div>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}
