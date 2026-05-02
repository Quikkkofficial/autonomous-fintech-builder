import { useGetDashboardSummary, useGetCreditScore, useListLoanApplications } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowRight,
  CreditCard,
  Landmark,
  FileText,
  Zap,
  TrendingUp,
  ChevronRight,
  CircleDollarSign,
  Activity,
  Calculator,
} from "lucide-react";
import { formatINR, statusColor } from "@/lib/format";
import { useAuth } from "@/lib/auth";

function ScoreArc({ score }: { score: number }) {
  const pct = Math.min(Math.max((score - 300) / (900 - 300), 0), 1);
  const color = score >= 750 ? "#16a34a" : score >= 650 ? "#d97706" : "#dc2626";
  return (
    <svg viewBox="0 0 120 70" className="w-28 h-16">
      <path d="M10,65 A50,50 0 0,1 110,65" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M10,65 A50,50 0 0,1 110,65"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${pct * 157} 157`}
      />
      <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">{score}</text>
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: score, isLoading: loadingScore } = useGetCreditScore();
  const { data: applications, isLoading: loadingApps } = useListLoanApplications();

  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quickActions = [
    { label: "Get a Loan", icon: Landmark, href: "/loans", color: "bg-red-50 text-red-600" },
    { label: "Credit Cards", icon: CreditCard, href: "/credit-cards", color: "bg-blue-50 text-blue-600" },
    { label: "Applications", icon: FileText, href: "/applications", color: "bg-violet-50 text-violet-600" },
    { label: "EMI Calc", icon: Calculator, href: "/tools/emi", color: "bg-emerald-50 text-emerald-600" },
  ];

  if (loadingSummary || loadingScore || loadingApps) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto md:max-w-none">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const recentApps = (applications ?? []).slice(0, 3);

  return (
    <div className="space-y-5 max-w-2xl mx-auto md:max-w-none">

      {/* Hero / greeting card */}
      <div className="rounded-2xl bg-gradient-to-br from-black via-zinc-900 to-red-800 text-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-white/60 text-sm">{greeting},</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">{firstName} 👋</h1>
          <p className="text-white/70 text-sm mt-1">Your finances at a glance.</p>
          <Link href="/loans">
            <Button size="sm" className="mt-3 bg-white text-black hover:bg-white/90 gap-1.5 h-9 font-semibold text-sm">
              New loan <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        {score && (
          <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-4 sm:gap-0">
            <div className="sm:mb-1">
              <ScoreArc score={score.score} />
            </div>
            <div>
              <div className="text-white/60 text-xs">CIBIL Score</div>
              <Badge className="mt-1 bg-white/20 text-white border-white/20 text-xs">{score.band}</Badge>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2.5">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href}>
            <button className="w-full flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-sm transition-all active:scale-95">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight px-1">{a.label}</span>
            </button>
          </Link>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Active applications</span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{summary?.activeApplications ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Across {summary?.totalLenders ?? 0} lenders</div>
        </div>
        <div className="rounded-2xl bg-card border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Approved amount</span>
            <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatINR(summary?.approvedAmount ?? 0)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Disbursed: {formatINR(summary?.disbursedAmount ?? 0)}</div>
        </div>
        <div className="rounded-2xl bg-card border p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Applications by status</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          {(summary?.applicationsByStatus ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground pt-1">No data yet</div>
          ) : (
            <div className="space-y-1.5">
              {(summary?.applicationsByStatus ?? []).map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs capitalize">{s.status.replace("_", " ")}</span>
                  <Badge variant="secondary" className="text-xs h-5">{s.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent applications */}
      {recentApps.length > 0 && (
        <div className="rounded-2xl bg-card border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Recent applications</h2>
            <Link href="/applications">
              <button className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
          <div className="divide-y">
            {recentApps.map((a: any) => (
              <Link key={a.id} href={`/applications/${a.id}`}>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.lenderName}</div>
                    <div className="text-xs text-muted-foreground">{formatINR(a.amount)} · {a.tenureMonths}mo</div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={`text-[10px] px-1.5 h-5 ${statusColor(a.status)}`}>{a.status}</Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">{a.interestRate}% p.a.</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {(summary?.recentActivity ?? []).length > 0 && (
        <div className="rounded-2xl bg-card border overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Recent activity</h2>
          </div>
          <div className="divide-y">
            {(summary?.recentActivity ?? []).map((act: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{act.title}</p>
                  <p className="text-xs text-muted-foreground">{act.detail}</p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 pt-0.5">
                  {new Date(act.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentApps.length === 0 && (summary?.recentActivity ?? []).length === 0 && (
        <div className="rounded-2xl bg-card border p-8 text-center">
          <Zap className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="font-bold text-base">Start your journey</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Compare loans from 12+ lenders and get matched in 60 seconds.</p>
          <Link href="/loans">
            <Button className="gap-2">Find a loan <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      )}
    </div>
  );
}
