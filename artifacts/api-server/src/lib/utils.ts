export function maskPan(pan: string): string {
  if (!pan || pan.length < 4) return "XXXXXXXXXX";
  return `${pan.slice(0, 2)}XXXXX${pan.slice(-3)}`;
}

export function maskAadhaar(a: string): string {
  const digits = a.replace(/\s+/g, "");
  if (digits.length < 4) return "XXXX XXXX XXXX";
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export function maskAccount(a: string): string {
  if (!a || a.length < 4) return "XXXXXX";
  return `${"X".repeat(Math.max(0, a.length - 4))}${a.slice(-4)}`;
}

export function calcEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return 0;
  if (annualRate <= 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, tenureMonths);
  return (principal * r * pow) / (pow - 1);
}

export function emiSchedule(principal: number, annualRate: number, tenureMonths: number) {
  const emi = calcEmi(principal, annualRate, tenureMonths);
  const r = annualRate / 12 / 100;
  let balance = principal;
  const schedule = [] as Array<{ month: number; principal: number; interest: number; balance: number }>;
  for (let m = 1; m <= tenureMonths; m++) {
    const interest = balance * r;
    const principalPay = Math.min(emi - interest, balance);
    balance = Math.max(0, balance - principalPay);
    schedule.push({
      month: m,
      principal: round2(principalPay),
      interest: round2(interest),
      balance: round2(balance),
    });
  }
  return { emi: round2(emi), schedule };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function genId(prefix: string): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${t}${r}`;
}

export function bandFor(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 780) return "excellent";
  if (score >= 720) return "good";
  if (score >= 650) return "fair";
  return "poor";
}
