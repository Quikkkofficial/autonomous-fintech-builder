import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, Home, Car, Briefcase, GraduationCap, ArrowRight, Gem, PiggyBank, TrendingUp, Shield } from "lucide-react";
import { formatINR } from "@/lib/format";

type LoanType = "personal" | "home" | "auto" | "business" | "education" | "gold" | "fd" | "mutual_fund" | "insurance";

const TYPES: { v: LoanType; label: string; icon: React.ElementType; min: number; max: number; desc: string }[] = [
  { v: "personal", label: "Personal Loan", icon: Landmark, min: 25000, max: 4000000, desc: "Quick funds for any need" },
  { v: "home", label: "Home Loan", icon: Home, min: 500000, max: 50000000, desc: "Buy or construct your home" },
  { v: "auto", label: "Auto Loan", icon: Car, min: 100000, max: 5000000, desc: "Finance your dream car" },
  { v: "business", label: "Business Loan", icon: Briefcase, min: 100000, max: 20000000, desc: "Grow your business" },
  { v: "education", label: "Education Loan", icon: GraduationCap, min: 50000, max: 10000000, desc: "Invest in your future" },
  { v: "gold", label: "Gold Loan", icon: Gem, min: 10000, max: 5000000, desc: "Instant loan against your gold" },
  { v: "fd", label: "FD Loan", icon: PiggyBank, min: 10000, max: 100000000, desc: "Loan against fixed deposit" },
  { v: "mutual_fund", label: "Mutual Fund Loan", icon: TrendingUp, min: 50000, max: 50000000, desc: "Pledge your MF units for credit" },
  { v: "insurance", label: "Insurance Loan", icon: Shield, min: 10000, max: 5000000, desc: "Borrow against your policy value" },
];

export default function Loans() {
  const [, setLocation] = useLocation();
  const [type, setType] = useState<LoanType>("personal");
  const [amount, setAmount] = useState(300000);
  const [tenure, setTenure] = useState(36);

  const cfg = TYPES.find((t) => t.v === type)!;

  function go() {
    const params = new URLSearchParams({ type, amount: String(amount), tenure: String(tenure) });
    setLocation(`/loans/results?${params.toString()}`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find your perfect loan</h1>
        <p className="text-muted-foreground mt-1">Compare offers from 12+ banks & NBFCs in seconds.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose loan type</CardTitle>
          <CardDescription>Select what you need money for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TYPES.map((t) => (
              <button
                key={t.v}
                onClick={() => { setType(t.v); setAmount(Math.min(Math.max(amount, t.min), t.max)); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${type === t.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <t.icon className={`w-6 h-6 mb-2 ${type === t.v ? "text-primary" : "text-muted-foreground"}`} />
                <div className="font-medium text-sm">{t.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{cfg.label} details</CardTitle>
          <CardDescription>{cfg.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <Label>Loan amount</Label>
              <span className="text-2xl font-bold text-primary">{formatINR(amount)}</span>
            </div>
            <Slider
              min={cfg.min}
              max={cfg.max}
              step={Math.max(1000, Math.round((cfg.max - cfg.min) / 200))}
              value={[amount]}
              onValueChange={(v) => setAmount(v[0]!)}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatINR(cfg.min)}</span>
              <span>{formatINR(cfg.max)}</span>
            </div>
            <Input
              type="number"
              className="mt-3"
              value={amount}
              onChange={(e) => setAmount(Math.min(cfg.max, Math.max(cfg.min, Number(e.target.value) || cfg.min)))}
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-3">
              <Label>Tenure</Label>
              <span className="text-2xl font-bold text-primary">{tenure} months</span>
            </div>
            <Slider min={6} max={360} step={6} value={[tenure]} onValueChange={(v) => setTenure(v[0]!)} />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>6 months</span>
              <span>30 years</span>
            </div>
          </div>

          <Button onClick={go} className="w-full h-12 text-base">
            See matching offers <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
