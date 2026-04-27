import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { LogOut, User as UserIcon } from "lucide-react";
import { roleLabel } from "@/lib/api";
import type { ReactNode } from "react";

export interface PanelNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PanelLayout({
  title,
  navItems,
  brandHref,
  accent,
  children,
}: {
  title: string;
  navItems: PanelNavItem[];
  brandHref: string;
  accent?: "red" | "amber" | "indigo";
  children: ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch {}
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    setLocation("/login");
  };

  const accentBg = accent === "amber" ? "bg-amber-50" : accent === "indigo" ? "bg-indigo-50" : "bg-primary/5";
  const accentText = accent === "amber" ? "text-amber-700" : accent === "indigo" ? "text-indigo-700" : "text-primary";

  return (
    <div className="min-h-screen w-full bg-muted/30 flex">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6 border-b">
          <Link href={brandHref}>
            <Logo size={32} />
          </Link>
          <Badge variant="secondary" className={`mt-3 ${accentBg} ${accentText} border-0`}>{title}</Badge>
        </div>
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-primary/10 p-2"><UserIcon className="h-4 w-4 text-primary" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.name ?? user?.phone}</div>
              <div className="text-xs text-muted-foreground truncate">{roleLabel(user?.role)}{user?.partnerCode ? ` · ${user.partnerCode}` : ""}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden"><Logo size={24} /></div>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground hidden sm:block">
            Welcome, <span className="font-medium text-foreground">{user?.name ?? user?.phone}</span>
          </div>
        </header>
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
