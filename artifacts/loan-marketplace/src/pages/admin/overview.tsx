import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FileText, IndianRupee, AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface AdminStats {
  users: { total: number; customers: number; salesPartners: number; collectionPartners: number };
  loans: { total: number; submitted: number; approved: number; rejected: number; disbursed: number; totalDisbursedAmt: number };
  cards: { total: number };
  collections: { overdueCount: number; outstandingAmt: number };
  statusBreakdown: Array<{ status: string; count: number }>;
}

export default function AdminOverview() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => api<AdminStats>("/admin/stats") });
  const series = useQuery({ queryKey: ["admin", "timeseries"], queryFn: () => api<Array<{ date: string; count: number; amount: number }>>("/admin/timeseries") });
  const recent = useQuery({ queryKey: ["admin", "recent"], queryFn: () => api<Array<any>>("/admin/recent-activity") });

  if (stats.isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;
  }
  const s = stats.data!;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time pulse of the Quikkk marketplace.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Total Users" value={s.users.total} sub={`${s.users.customers} customers`} />
          <KpiCard icon={FileText} label="Loan Apps" value={s.loans.total} sub={`${s.loans.disbursed} disbursed`} />
          <KpiCard icon={IndianRupee} label="Disbursed" value={formatINR(s.loans.totalDisbursedAmt)} />
          <KpiCard icon={AlertTriangle} label="Overdue" value={s.collections.overdueCount} sub={formatINR(s.collections.outstandingAmt)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Applications (last 30 days)</CardTitle></CardHeader>
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
            <CardHeader><CardTitle>Status breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={s.statusBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(0 84% 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Team composition</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Row label="Customers" value={s.users.customers} />
              <Row label="Channel partners" value={s.users.salesPartners} />
              <Row label="Collection partners" value={s.users.collectionPartners} />
              <Row label="Card applications" value={s.cards.total} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recent.data?.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {recent.data?.slice(0, 8).map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <Badge variant="outline">{n.channel}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{n.title}</p>
                    <p className="text-muted-foreground text-xs truncate">{n.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
