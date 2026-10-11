// EMI Calculator — local computation (no network needed).
// EMI = P * r * (1+r)^n / ((1+r)^n - 1), r = annualRate/12/100.

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Input, Screen } from "../src/components/ui";
import { colors, fontSize, fontWeight, radius, spacing } from "../src/theme";
import { payWithUpi, parseUpiResponse } from "../src/upi/upi";
import { PaymentsApi } from "../src/api/client";

export function calculateEmi(principal: number, annualRate: number, tenureMonths: number) {
  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  if (r === 0) return { emi: principal / n, totalInterest: 0, totalPayable: principal };
  const factor = Math.pow(1 + r, n);
  const emi = (principal * r * factor) / (factor - 1);
  const totalPayable = emi * n;
  return { emi, totalInterest: totalPayable - principal, totalPayable };
}

function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const PRESETS = [100000, 500000, 1000000, 2500000];

export default function EmiCalculatorScreen() {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("11.5");
  const [tenure, setTenure] = useState("60");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");

  const result = useMemo(() => {
    const p = Number(principal);
    const r = Number(rate);
    const n = Number(tenure);
    if (!p || !r || !n) return null;
    return calculateEmi(p, r, n);
  }, [principal, rate, tenure]);

  const interestPct = result ? Math.round((result.totalInterest / result.totalPayable) * 100) : 0;

  async function onPayFirstEmi() {
    if (!result) return;
    setPayMsg("");
    setPaying(true);
    try {
      // 1. Create a UPI order on the backend (returns merchant VPA + order id)
      const order = await PaymentsApi.createUpiOrder(Math.round(result.emi), "First EMI payment");
      // 2. Open the user's UPI app via deep link
      await payWithUpi({
        payeeVpa: order.upiId,
        payeeName: "Quikkk",
        amount: order.amount,
        note: order.note,
        txnRef: order.orderId,
      });
      setPayMsg("Payment opened in your UPI app. Complete it there — we'll verify automatically.");
    } catch (e) {
      setPayMsg(e instanceof Error ? e.message : "Could not start UPI payment.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>EMI Calculator</Text>
        <Text style={styles.sub}>Plan your repayments before you apply.</Text>

        <Input
          label="Loan amount (₹)"
          keyboardType="number-pad"
          value={principal}
          onChangeText={setPrincipal}
        />
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Button
              key={p}
              title={inr(p)}
              variant="outline"
              onPress={() => setPrincipal(String(p))}
              style={styles.preset}
            />
          ))}
        </View>
        <Input label="Interest rate (% p.a.)" keyboardType="decimal-pad" value={rate} onChangeText={setRate} />
        <Input label="Tenure (months)" keyboardType="number-pad" value={tenure} onChangeText={setTenure} />

        {result ? (
          <Card style={styles.result}>
            <ResultRow label="Monthly EMI" value={inr(result.emi)} big />
            <ResultRow label="Total interest" value={inr(result.totalInterest)} />
            <ResultRow label="Total payable" value={inr(result.totalPayable)} />
            <View style={styles.bar}>
              <View style={[styles.barPrincipal, { flex: 100 - interestPct }]} />
              <View style={[styles.barInterest, { flex: interestPct }]} />
            </View>
            <View style={styles.legend}>
              <LegendDot color={colors.primary} label="Principal" />
              <LegendDot color={colors.warning} label="Interest" />
            </View>
            <Button
              title="Pay first EMI via UPI"
              onPress={onPayFirstEmi}
              loading={paying}
              style={{ marginTop: spacing.md }}
            />
            {payMsg ? <Text style={styles.payMsg}>{payMsg}</Text> : null}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ResultRow({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.rowValueBig]}>{value}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// re-export for the UPI callback route (deep link quikkk://upi-callback?response=...)
export function handleUpiCallback(response: string) {
  return parseUpiResponse(response);
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 4 },
  sub: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.lg },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  preset: { paddingVertical: 8, paddingHorizontal: 12 },
  result: { marginTop: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  rowLabel: { fontSize: fontSize.md, color: colors.textMuted },
  rowValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  rowValueBig: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.bold },
  bar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", marginTop: spacing.md },
  barPrincipal: { backgroundColor: colors.primary },
  barInterest: { backgroundColor: colors.warning },
  legend: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  payMsg: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
});
