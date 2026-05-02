import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  CreditCard,
  LayoutDashboard,
  Landmark,
  FileText,
  Bell,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";
import { useGetCreditScore, getGetCreditScoreQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Logo, LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/credit-cards", label: "Cards", icon: CreditCard },
  { href: "/applications", label: "History", icon: FileText },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

const sidebarExtra = [
  { href: "/lenders", label: "Partners", icon: Landmark },
  { href: "/tools/emi", label: "EMI Calculator", icon: Calculator },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-pb">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const active = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <button
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                <span className={cn("text-[10px] font-medium", active && "font-semibold")}>{item.label}</span>
                {active && <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: scoreData } = useGetCreditScore({
    query: { queryKey: getGetCreditScoreQueryKey(), enabled: !!user, retry: false }
  });

  return (
    <div className="min-h-screen w-full bg-muted/30 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b">
          <Link href="/dashboard">
            <Logo size={32} />
          </Link>
        </div>
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          {[...navItems, ...sidebarExtra].map((item) => (
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
        <div className="p-4 border-t space-y-3">
          {scoreData && (
            <div className="bg-primary/5 p-4 rounded-xl">
              <div className="text-xs text-muted-foreground mb-1">Credit Score</div>
              <div className="text-2xl font-bold text-primary">{scoreData.score}</div>
              <Badge variant="secondary" className="mt-1.5 text-xs">{scoreData.band}</Badge>
            </div>
          )}
          <Link href="/profile">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name || "My Account"}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.phone}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar */}
        <header className="hidden md:flex h-16 border-b bg-card items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
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

        {/* Mobile top bar */}
        <header className="md:hidden flex h-14 border-b bg-card items-center justify-between px-4 sticky top-0 z-10">
          <Link href="/dashboard">
            <Logo size={24} />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10">
                <UserIcon className="h-4 w-4 text-primary" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
