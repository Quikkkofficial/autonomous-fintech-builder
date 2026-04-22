import { useEffect, useState } from "react";
import { useCalculateEmi } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator } from "lucide-react";
import { formatINR, formatINRDetailed } from "@/lib/format";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function EmiCalculator() {
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(11.5);
  const [tenure, setTenure] = useState(60);
  const calc = useCalculateEmi();

  useEffect(() => {
    const t = setTimeout(() => {
      calc.mutate({ data: { principal, annualRate: rate, tenureMonths: tenure } });
    }, 250);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal, rate, tenure]);

  const result = calc.data;
  const pieData = result ? [
    { name: "Principal", value: principal, color: "hsl(var(--primary))" },
    { name: "Interest", value: result.totalInterest, color: "hsl(var(--accent))" },
  ] : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" /> EMI Calculator
        </h1>
        <p className="text-muted-foreground mt-1">Plan your loan repayments before you apply.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Loan details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2"><Label>Principal</Label><span className="font-bold">{formatINR(principal)}</span></div>
              <Slider min={50000} max={20000000} step={50000} value={[principal]} onValueChange={(v) => setPrincipal(v[0]!)} />
              <Input type="number" className="mt-2" value={principal} onChange={(e) => setPrincipal(Math.max(10000, Number(e.target.value) || 10000))} />
            </div>
            <div>
              <div className="flex justify-between mb-2"><Label>Interest rate</Label><span className="font-bold">{rate}% p.a.</span></div>
              <Slider min={5} max={30} step={0.1} value={[rate]} onValueChange={(v) => setRate(v[0]!)} />
            </div>
            <div>
              <div className="flex justify-between mb-2"><Label>Tenure</Label><span className="font-bold">{tenure} months</span></div>
              <Slider min={6} max={360} step={6} value={[tenure]} onValueChange={(v) => setTenure(v[0]!)} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Result</CardTitle></CardHeader>
          <CardContent>
            {!result ? <Skeleton className="h-64 w-full" /> : (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <Stat label="Monthly EMI" value={formatINRDetailed(result.emi)} big />
                  <Stat label="Total interest" value={formatINRDetailed(result.totalInterest)} />
                  <Stat label="Total payable" value={formatINRDetailed(result.totalPayable)} />
                </div>
                <div className="h-56">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader><CardTitle>Yearly balance projection</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={yearlyData(result.schedule)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="principal" stackId="a" fill="hsl(var(--primary))" name="Principal paid" />
                  <Bar dataKey="interest" stackId="a" fill="hsl(var(--accent))" name="Interest paid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader><CardTitle>Repayment schedule (first 12 months)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>EMI</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.schedule.slice(0, 12).map((s) => (
                  <TableRow key={s.month}>
                    <TableCell>{s.month}</TableCell>
                    <TableCell>{formatINRDetailed(result.emi)}</TableCell>
                    <TableCell>{formatINRDetailed(s.principal)}</TableCell>
                    <TableCell>{formatINRDetailed(s.interest)}</TableCell>
                    <TableCell>{formatINRDetailed(s.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-bold ${big ? "text-3xl text-primary" : "text-lg"}`}>{value}</div>
    </div>
  );
}

function yearlyData(schedule: Array<{ month: number; principal: number; interest: number; balance: number }>) {
  const years = new Map<number, { year: number; principal: number; interest: number }>();
  for (const s of schedule) {
    const y = Math.ceil(s.month / 12);
    const cur = years.get(y) ?? { year: y, principal: 0, interest: 0 };
    cur.principal += s.principal;
    cur.interest += s.interest;
    years.set(y, cur);
  }
  return Array.from(years.values());
}
