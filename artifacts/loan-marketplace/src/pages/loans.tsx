import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Landmark, Home, Car, Briefcase, GraduationCap, ArrowRight, Gem, PiggyBank, TrendingUp, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type LoanType = "personal" | "home" | "auto" | "business" | "education" | "gold" | "fd" | "mutual_fund" | "insurance";

const TYPES: { v: LoanType; label: string; icon: React.ElementType; min: number; max: number; desc: string; color: string }[] = [
  { v: "personal", label: "Personal", icon: Landmark, min: 25000, max: 4000000, desc: "Quick funds for any need", color: "bg-red-50 text-red-600 border-red-200" },
  { v: "home", label: "Home", icon: Home, min: 500000, max: 50000000, desc: "Buy or construct your home", color: "bg-zinc-50 text-zinc-700 border-zinc-200" },
  { v: "auto", label: "Auto", icon: Car, min: 100000, max: 5000000, desc: "Finance your dream car", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { v: "business", label: "Business", icon: Briefcase, min: 100000, max: 20000000, desc: "Grow your business", color: "bg-violet-50 text-violet-600 border-violet-200" },
  { v: "education", label: "Education", icon: GraduationCap, min: 50000, max: 10000000, desc: "Invest in your future", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { v: "gold", label: "Gold", icon: Gem, min: 10000, max: 5000000, desc: "Instant loan against your gold", color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  { v: "fd", label: "FD", icon: PiggyBank, min: 10000, max: 100000000, desc: "Loan against fixed deposit", color: "bg-sky-50 text-sky-600 border-sky-200" },
  { v: "mutual_fund", label: "Mutual Fund", icon: TrendingUp, min: 50000, max: 50000000, desc: "Pledge your MF units for credit", color: "bg-teal-50 text-teal-600 border-teal-200" },
  { v: "insurance", label: "Insurance", icon: Shield, min: 10000, max: 5000000, desc: "Borrow against your policy value", color: "bg-purple-50 text-purple-600 border-purple-200" },
];

export default function Loans() {
  const [, setLocation] = useLocation();
  const [type, setType] = useState<LoanType>("personal");
  const [amount, setAmount] = useState(300000);
  const [tenure, setTenure] = useState(36);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cfg = TYPES.find((t) => t.v === type)!;

  function go() {
    const params = new URLSearchParams({ type, amount: String(amount), tenure: String(tenure) });
    setLocation(`/loans/results?${params.toString()}`);
  }

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  }

  const emi = Math.round((amount * (0.11 / 12) * Math.pow(1 + 0.11 / 12, tenure)) / (Math.pow(1 + 0.11 / 12, tenure) - 1));

  return (
    <div className="max-w-2xl mx-auto md:max-w-5xl space-y-5">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Find your perfect loan</h1>
        <p className="text-muted-foreground mt-1">Compare offers from 12+ banks & NBFCs in seconds.</p>
      </div>
      <div className="md:hidden">
        <p className="text-xl font-bold tracking-tight">Find a loan</p>
        <p className="text-muted-foreground text-sm mt-0.5">Compare 12+ banks & NBFCs instantly.</p>
      </div>

      {/* Loan type selector — horizontal scroll on mobile */}
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 rounded-full bg-card border shadow items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-1 scroll-smooth no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
        >
          {TYPES.map((t) => {
            const active = type === t.v;
            return (
              <button
                key={t.v}
                onClick={() => { setType(t.v); setAmount(Math.min(Math.max(amount, t.min), t.max)); }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 md:p-4 shrink-0 transition-all active:scale-95",
                  "w-[72px] md:w-auto md:min-w-[90px]",
                  active
                    ? `border-primary bg-primary/5`
                    : "border-border hover:border-primary/30 bg-card"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", active ? t.color : "bg-muted")}>
                  <t.icon className={cn("w-4.5 h-4.5", active ? "" : "text-muted-foreground")} />
                </div>
                <div className={cn("font-medium text-[11px] md:text-xs leading-tight text-center", active ? "text-primary" : "")}>{t.label}</div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 rounded-full bg-card border shadow items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selected type info */}
      <div className={cn("rounded-2xl p-4 border", cfg.color.split(" ").map(c => c.startsWith("bg-") ? c : "").filter(Boolean).join(" ") || "bg-muted/40")}>
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cfg.color)}>
            <cfg.icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm">{cfg.label} Loan</div>
            <div className="text-xs text-muted-foreground">{cfg.desc}</div>
          </div>
        </div>
      </div>

      {/* Amount & Tenure */}
      <div className="rounded-2xl bg-card border p-5 space-y-7">
        {/* Amount */}
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <Label className="text-sm">Loan amount</Label>
            <span className="text-2xl font-bold text-primary">{formatINR(amount)}</span>
          </div>
          <Slider
            min={cfg.min}
            max={cfg.max}
            step={Math.max(1000, Math.round((cfg.max - cfg.min) / 200))}
            value={[amount]}
            onValueChange={(v) => setAmount(v[0]!)}
            className="touch-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{formatINR(cfg.min)}</span>
            <span>{formatINR(cfg.max)}</span>
          </div>
          <Input
            type="number"
            className="mt-3 text-base h-11"
            value={amount}
            onChange={(e) => setAmount(Math.min(cfg.max, Math.max(cfg.min, Number(e.target.value) || cfg.min)))}
          />
        </div>

        {/* Tenure */}
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <Label className="text-sm">Tenure</Label>
            <span className="text-2xl font-bold text-primary">{tenure >= 12 ? `${Math.round(tenure / 12 * 10) / 10} yr` : `${tenure} mo`}</span>
          </div>
          <Slider min={6} max={360} step={6} value={[tenure]} onValueChange={(v) => setTenure(v[0]!)} className="touch-none" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>6 months</span>
            <span>30 years</span>
          </div>
        </div>

        {/* Estimated EMI */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Estimated EMI</span>
          <span className="font-bold text-base">~{formatINR(emi)}/mo</span>
        </div>
      </div>

      {/* CTA — sticky on mobile */}
      <div className="sticky bottom-20 md:bottom-0 md:static">
        <Button onClick={go} className="w-full h-13 md:h-12 text-base font-semibold rounded-2xl md:rounded-lg shadow-lg md:shadow-none gap-2">
          See matching offers <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
