import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetLoanApplication } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function fmtInr(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

const STATUS_ORDER = ["submitted", "under_review", "approved", "disbursed"];

const STATUS_COLOR: Record<string, string> = {
  submitted: "#2563EB",
  under_review: "#D97706",
  approved: "#16A34A",
  disbursed: "#7C3AED",
  rejected: "#DC2626",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  disbursed: "Disbursed",
  rejected: "Rejected",
};

const STATUS_ICON: Record<string, "upload" | "clock" | "check-circle" | "dollar-sign" | "x-circle"> = {
  submitted: "upload",
  under_review: "clock",
  approved: "check-circle",
  disbursed: "dollar-sign",
  rejected: "x-circle",
};

export default function LoanDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: app, isLoading } = useGetLoanApplication(id!);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, marginTop: 12, fontFamily: "Inter_500Medium" }}>
          Application not found
        </Text>
      </View>
    );
  }

  const isRejected = app.status === "rejected";
  const currentIdx = isRejected ? -1 : STATUS_ORDER.indexOf(app.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
          paddingBottom: insets.bottom + 32,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Application</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Card */}
      <View style={[styles.heroCard, { backgroundColor: "#141414" }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLender}>{app.lenderName}</Text>
            <Text style={styles.heroType}>{app.type.charAt(0).toUpperCase() + app.type.slice(1)} Loan</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: STATUS_COLOR[app.status] + "22" }]}>
            <Feather
              name={STATUS_ICON[app.status] ?? "circle"}
              size={13}
              color={STATUS_COLOR[app.status]}
            />
            <Text style={[styles.statusChipText, { color: STATUS_COLOR[app.status] }]}>
              {STATUS_LABEL[app.status] ?? app.status}
            </Text>
          </View>
        </View>
        <Text style={styles.heroAmount}>{fmtInr(app.amount)}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{app.interestRate}%</Text>
            <Text style={styles.heroStatLabel}>Rate p.a.</Text>
          </View>
          <View style={[styles.heroStatDivider]} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{fmtInr(app.emi)}</Text>
            <Text style={styles.heroStatLabel}>Monthly EMI</Text>
          </View>
          <View style={[styles.heroStatDivider]} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{app.tenureMonths}m</Text>
            <Text style={styles.heroStatLabel}>Tenure</Text>
          </View>
        </View>
      </View>

      {/* Status Timeline */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Status Timeline</Text>
      <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(isRejected ? ["submitted", "rejected"] : STATUS_ORDER).map((s, i, arr) => {
          const historyItem = app.statusHistory?.find((h) => h.status === s);
          const isDone = isRejected ? s === "submitted" : i <= currentIdx;
          const isCurrent = isRejected ? s === "rejected" : i === currentIdx;
          const isLast = i === arr.length - 1;

          return (
            <View key={s} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: isCurrent
                        ? STATUS_COLOR[s]
                        : isDone
                        ? "#16A34A"
                        : colors.border,
                      borderColor: isCurrent ? STATUS_COLOR[s] : isDone ? "#16A34A" : colors.border,
                    },
                  ]}
                >
                  {isDone && !isCurrent && <Feather name="check" size={10} color="#fff" />}
                  {isCurrent && <Feather name={STATUS_ICON[s] ?? "circle"} size={10} color="#fff" />}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: isDone ? "#16A34A" : colors.border },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineLabel,
                    {
                      color: isCurrent
                        ? STATUS_COLOR[s]
                        : isDone
                        ? colors.foreground
                        : colors.mutedForeground,
                      fontFamily: isCurrent ? "Inter_700Bold" : "Inter_500Medium",
                    },
                  ]}
                >
                  {STATUS_LABEL[s] ?? s}
                </Text>
                {historyItem ? (
                  <>
                    <Text style={[styles.timelineNote, { color: colors.mutedForeground }]}>
                      {historyItem.note}
                    </Text>
                    <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>
                      {new Date(historyItem.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.timelineNote, { color: colors.mutedForeground }]}>—</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Details */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
      <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: "Application ID", value: app.id },
          { label: "Reference", value: app.referenceCode },
          { label: "Applied On", value: new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
          { label: "Expected Disbursal", value: app.expectedDisbursalAt ? new Date(app.expectedDisbursalAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
          { label: "Purpose", value: app.purpose ?? "—" },
          { label: "Total Payable", value: app.emi && app.tenureMonths ? fmtInr(Number(app.emi) * app.tenureMonths) : "—" },
        ].map(({ label, value }) => (
          <View key={label} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  screenTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  heroCard: { borderRadius: 20, padding: 20, marginBottom: 24, gap: 12 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLender: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  heroType: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 2 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.5 },
  heroStats: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatVal: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  heroStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.15)" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  timelineCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineLeft: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  timelineLine: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineLabel: { fontSize: 14 },
  timelineNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
  timelineDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  detailsCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", padding: 14, borderBottomWidth: 1 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 16 },
});
