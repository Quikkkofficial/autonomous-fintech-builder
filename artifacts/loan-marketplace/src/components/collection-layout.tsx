import { BarChart3, AlertTriangle, ListChecks } from "lucide-react";
import { PanelLayout, PanelNavItem } from "./panel-layout";

const items: PanelNavItem[] = [
  { href: "/collection", label: "Overview", icon: BarChart3 },
  { href: "/collection/cases", label: "My Cases", icon: AlertTriangle },
  { href: "/collection/followups", label: "Follow-ups Log", icon: ListChecks },
];

export function CollectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout title="Collection Partner" navItems={items} brandHref="/collection" accent="amber">
      {children}
    </PanelLayout>
  );
}
