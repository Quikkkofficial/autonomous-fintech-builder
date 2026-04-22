import { useGetDashboardSummary, useGetCreditScore, useListLoanApplications, useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Activity, CreditCard, Landmark, FileText } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: score, isLoading: loadingScore } = useGetCreditScore();
  const { data: applications, isLoading: loadingApps } = useListLoanApplications();

  if (loadingSummary || loadingScore || loadingApps) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here is your financial overview.</p>
        </div>
        <Link href="/loans">
          <Button className="gap-2">New Loan <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{score?.score || summary?.creditScore || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Band: {score?.band || summary?.creditScoreBand || "Unknown"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.activeApplications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {summary?.totalLenders || 0} lenders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(summary?.approvedAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Disbursed: ₹{(summary?.disbursedAmount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.recentActivity && summary.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {summary.recentActivity.map((act, i) => (
                  <div key={i} className="flex justify-between items-center border-b last:border-0 pb-4 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.detail}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(act.at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
             {summary?.applicationsByStatus && summary.applicationsByStatus.length > 0 ? (
               <div className="space-y-4">
                 {summary.applicationsByStatus.map((stat, i) => (
                   <div key={i} className="flex justify-between items-center">
                     <span className="capitalize">{stat.status.replace("_", " ")}</span>
                     <span className="font-bold">{stat.count}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8 text-muted-foreground">No applications yet.</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
