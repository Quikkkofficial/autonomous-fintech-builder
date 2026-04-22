export function formatINR(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(Number(n))) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatINRDetailed(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(Number(n))) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function statusColor(status: string): string {
  switch (status) {
    case "approved":
    case "disbursed":
    case "verified":
    case "dispatched":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "under_review":
    case "submitted":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "rejected":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}
