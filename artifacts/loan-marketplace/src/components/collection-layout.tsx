import { BarChart3, AlertTriangle, ListChecks, PhoneCall, KeyRound } from "lucide-react";
import { PanelLayout, PanelNavItem } from "./panel-layout";

const items: PanelNavItem[] = [
  { href: "/collection", label: "Overview", icon: BarChart3 },
  { href: "/collection/cases", label: "My Cases", icon: AlertTriangle },
  { href: "/collection/followups", label: "Follow-ups Log", icon: ListChecks },
  { href: "/collection/omni-channel", label: "Omni-Channel", icon: PhoneCall },
  { href: "/collection/api-integration", label: "API Integration", icon: KeyRound },
];

export function CollectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout title="Collection Partner" navItems={items} brandHref="/collection" accent="amber">
      {children}
    </PanelLayout>
  );
}
