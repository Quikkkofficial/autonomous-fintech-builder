import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useCalculateEmi } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function fmtInr(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total === 0) return null;
  const pPct = principal / total;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  const pOffset = circumference * (1 - pPct);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={140} height={140} viewBox="0 0 140 140">
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#F5F5F5" strokeWidth={18} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#EB1414"
          strokeWidth={18}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={pOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#141414"
          strokeWidth={18}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - (circumference - pOffset)}
          strokeLinecap="round"
          transform={`rotate(${(pPct * 360) - 90} ${cx} ${cy})`}
        />
      </Svg>
    </View>
  );
}

export default function CalculatorTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(12);
  const [tenure, setTenure] = useState(36);

  const calcMutation = useCalculateEmi();

  const calculate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await calcMutation.mutateAsync({
        data: { principal, annualRate: rate, tenureMonths: tenure },
      });
    } catch {}
  };

  const result = calcMutation.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>EMI Calculator</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Plan your loan repayment
      </Text>

      {/* Input Card */}
      <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Principal */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <Text style={[styles.sliderLabel, { color: colors.foreground }]}>Loan Amount</Text>
            <Text style={[styles.sliderValue, { color: colors.primary }]}>{fmtInr(principal)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={50000}
            maximumValue={5000000}
            step={50000}
            value={principal}
            onValueChange={setPrincipal}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderRange}>
            <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>₹50K</Text>
            <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>₹50L</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Rate */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <Text style={[styles.sliderLabel, { color: colors.foreground }]}>Interest Rate</Text>
            <Text style={[styles.sliderValue, { color: colors.primary }]}>{rate.toFixed(1)}% p.a.</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={7}
            maximumValue={24}
            step={0.5}
            value={rate}
            onValueChange={setRate}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderRange}>
            <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>7%</Text>
            <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>24%</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Tenure */}
        <View style={styles.sliderRow}>
          <View style={styles.sliderLabelRow}>
            <Text style={[styles.sliderLabel, { color: colors.foreground }]}>Loan Tenure</Text>
            <Text style={[styles.sliderValue, { color: colors.primary }]}>{tenure} months</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={6}
            maximumValue={84}
            step={6}
            value={tenure}
            onValueChange={setTenure}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderRange}>
            <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>6m</Text>
            <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>84m</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.calcBtn,
            { backgroundColor: pressed ? "#C91212" : colors.primary, opacity: calcMutation.isPending ? 0.7 : 1 },
          ]}
          onPress={calculate}
          disabled={calcMutation.isPending}
        >
          {calcMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="zap" size={16} color="#fff" />
              <Text style={styles.calcBtnText}>Calculate EMI</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Results */}
      {result && (
        <>
          {/* EMI Hero */}
          <View style={[styles.emiHero, { backgroundColor: "#141414" }]}>
            <Text style={styles.emiLabel}>Monthly EMI</Text>
            <Text style={styles.emiValue}>{fmtInr(result.emi)}</Text>
            <Text style={styles.emiSub}>for {tenure} months</Text>
          </View>

          {/* Breakdown */}
          <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Breakdown</Text>
            <View style={styles.breakdownRow}>
              <DonutChart principal={principal} interest={result.totalInterest} />
              <View style={styles.breakdownLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#EB1414" }]} />
                  <View>
                    <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Principal</Text>
                    <Text style={[styles.legendValue, { color: colors.foreground }]}>{fmtInr(principal)}</Text>
                  </View>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#141414" }]} />
                  <View>
                    <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Interest</Text>
                    <Text style={[styles.legendValue, { color: colors.foreground }]}>{fmtInr(result.totalInterest)}</Text>
                  </View>
                </View>
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Total Payable</Text>
                  <Text style={[styles.totalValue, { color: colors.foreground }]}>{fmtInr(result.totalPayable)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Amortization Preview */}
          {result.schedule && result.schedule.length > 0 && (
            <View style={[styles.schedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Schedule Preview</Text>
              <View style={styles.schedHeader}>
                {["Month", "Principal", "Interest", "Balance"].map((h) => (
                  <Text key={h} style={[styles.schedHeaderCell, { color: colors.mutedForeground }]}>{h}</Text>
                ))}
              </View>
              {result.schedule.slice(0, 6).map((row) => (
                <View key={row.month} style={[styles.schedRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.schedCell, { color: colors.foreground }]}>{row.month}</Text>
                  <Text style={[styles.schedCell, { color: colors.foreground }]}>{fmtInr(row.principal)}</Text>
                  <Text style={[styles.schedCell, { color: colors.foreground }]}>{fmtInr(row.interest)}</Text>
                  <Text style={[styles.schedCell, { color: colors.foreground }]}>{fmtInr(row.balance)}</Text>
                </View>
              ))}
              {result.schedule.length > 6 && (
                <Text style={[styles.moreRows, { color: colors.mutedForeground }]}>
                  + {result.schedule.length - 6} more months
                </Text>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  inputCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    marginBottom: 16,
  },
  sliderRow: { gap: 8 },
  sliderLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliderLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sliderValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  slider: { marginHorizontal: -8, height: 36 },
  sliderRange: { flexDirection: "row", justifyContent: "space-between" },
  rangeText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  calcBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 4,
  },
  calcBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emiHero: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  emiLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)" },
  emiValue: { fontSize: 40, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1, marginVertical: 4 },
  emiSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  breakdownCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  breakdownTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  breakdownLegend: { flex: 1, gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  legendValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  totalRow: { borderTopWidth: 1, paddingTop: 10, gap: 2 },
  totalValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  schedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  schedHeader: { flexDirection: "row", marginBottom: 8 },
  schedHeaderCell: { flex: 1, fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  schedRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 10 },
  schedCell: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  moreRows: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
});
