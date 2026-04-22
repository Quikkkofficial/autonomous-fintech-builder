import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calculator, CreditCard, LayoutDashboard, Landmark, FileText, Bell, User as UserIcon } from "lucide-react";
import { useGetCreditScore, getGetCreditScoreQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: scoreData } = useGetCreditScore({
    query: { queryKey: getGetCreditScoreQueryKey(), enabled: !!user, retry: false }
  });

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/loans", label: "Get a Loan", icon: Landmark },
    { href: "/credit-cards", label: "Credit Cards", icon: CreditCard },
    { href: "/applications", label: "Applications", icon: FileText },
    { href: "/lenders", label: "Partners", icon: Landmark },
    { href: "/tools/emi", label: "EMI Calculator", icon: Calculator },
  ];

  return (
    <div className="min-h-screen w-full bg-muted/30 flex">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Landmark className="h-6 w-6" />
            CreditBridge
          </Link>
        </div>
        <div className="p-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href || location.startsWith(item.href + "/") ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t space-y-4">
          {scoreData && (
            <div className="bg-primary/5 p-4 rounded-xl">
              <div className="text-sm text-muted-foreground mb-1">Credit Score</div>
              <div className="text-2xl font-bold text-primary">{scoreData.score}</div>
              <Badge variant="secondary" className="mt-2">{scoreData.band}</Badge>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden font-bold text-lg text-primary">CreditBridge</div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/10">
                <UserIcon className="h-5 w-5 text-primary" />
              </Button>
            </Link>
          </div>
        </header>
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
