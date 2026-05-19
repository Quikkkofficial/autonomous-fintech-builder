import { Users, FileText, Landmark, BarChart3, Wallet, AlertTriangle, KeyRound, Building2, ArrowRightLeft, Upload, Radio } from "lucide-react";
import { PanelLayout, PanelNavItem } from "./panel-layout";

const items: PanelNavItem[] = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/applications", label: "Loan Applications", icon: FileText },
  { href: "/admin/lead-upload", label: "Lead Upload", icon: Upload },
  { href: "/admin/omni-channel", label: "Omni-Channel", icon: Radio },
  { href: "/admin/lenders", label: "Lenders", icon: Landmark },
  { href: "/admin/bank-integrations", label: "Bank Integrations", icon: Building2 },
  { href: "/admin/dispatch-log", label: "Dispatch Log", icon: ArrowRightLeft },
  { href: "/admin/payouts", label: "Partner Payouts", icon: Wallet },
  { href: "/admin/collections", label: "Collections", icon: AlertTriangle },
  { href: "/admin/api-keys", label: "UM API Keys", icon: KeyRound },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout title="Admin Panel" navItems={items} brandHref="/admin" accent="red">
      {children}
    </PanelLayout>
  );
}
