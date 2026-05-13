import { BarChart3, FileText, PlusCircle, Wallet, KeyRound, Upload } from "lucide-react";
import { PanelLayout, PanelNavItem } from "./panel-layout";

const items: PanelNavItem[] = [
  { href: "/partner", label: "Overview", icon: BarChart3 },
  { href: "/partner/leads", label: "My Leads", icon: FileText },
  { href: "/partner/leads/new", label: "Create Lead", icon: PlusCircle },
  { href: "/partner/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/partner/payouts", label: "Earnings", icon: Wallet },
  { href: "/partner/api-integration", label: "API Integration", icon: KeyRound },
];

export function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout title="Channel Partner" navItems={items} brandHref="/partner" accent="indigo">
      {children}
    </PanelLayout>
  );
}
