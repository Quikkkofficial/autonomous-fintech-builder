import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListLoanApplications } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const LOAN_TYPES = [
  { key: "personal", label: "Personal", icon: "user" as const },
  { key: "home", label: "Home", icon: "home" as const },
  { key: "auto", label: "Auto", icon: "truck" as const },
  { key: "business", label: "Business", icon: "briefcase" as const },
  { key: "education", label: "Education", icon: "book" as const },
];

const STATUS_COLOR: Record<string, string> = {
  submitted: "#2563EB",
  under_review: "#D97706",
  approved: "#16A34A",
  disbursed: "#7C3AED",
  rejected: "#DC2626",
};

const STATUS_BG: Record<string, string> = {
  submitted: "#EFF6FF",
  under_review: "#FFFBEB",
  approved: "#F0FDF4",
  disbursed: "#F5F3FF",
  rejected: "#FEF2F2",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "In Review",
  approved: "Approved",
  disbursed: "Disbursed",
  rejected: "Rejected",
};

function fmtInr(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function LoansTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: applications, isLoading, refetch } = useListLoanApplications();

  const filtered = selectedType
    ? (applications ?? []).filter((a) => a.type === selectedType)
    : (applications ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Loans</Text>
        </View>

        {/* Loan Type Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ paddingRight: 20, gap: 8 }}>
          {LOAN_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedType === t.key ? colors.primary : colors.muted,
                  borderColor: selectedType === t.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType(selectedType === t.key ? null : t.key);
              }}
            >
              <Feather
                name={t.icon}
                size={14}
                color={selectedType === t.key ? "#fff" : colors.foreground}
              />
              <Text style={[styles.chipText, { color: selectedType === t.key ? "#fff" : colors.foreground }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Apply CTA */}
        <Pressable
          style={({ pressed }) => [styles.applyCard, { backgroundColor: pressed ? "#C91212" : colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: "/loan/apply",
              params: { type: selectedType ?? "personal" },
            });
          }}
        >
          <View>
            <Text style={styles.applyTitle}>Find the Best Loan</Text>
            <Text style={styles.applySubtitle}>Compare offers from 18+ lenders</Text>
          </View>
          <View style={styles.applyIconWrap}>
            <Feather name="arrow-right" size={22} color="#fff" />
          </View>
        </Pressable>

        {/* My Applications */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          My Applications {filtered.length > 0 ? `(${filtered.length})` : ""}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No applications yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Apply for your first loan above
            </Text>
          </View>
        ) : (
          filtered.map((app) => (
            <Pressable
              key={app.id}
              style={({ pressed }) => [
                styles.appCard,
                {
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push({ pathname: "/loan/[id]", params: { id: app.id } })}
            >
              <View style={styles.appCardRow}>
                <View style={styles.appCardLeft}>
                  <Text style={[styles.appLender, { color: colors.foreground }]}>{app.lenderName}</Text>
                  <Text style={[styles.appType, { color: colors.mutedForeground }]}>
                    {app.type.charAt(0).toUpperCase() + app.type.slice(1)} Loan · {app.tenureMonths}m
                  </Text>
                </View>
                <View>
                  <Text style={[styles.appAmount, { color: colors.foreground }]}>{fmtInr(app.amount)}</Text>
                  <Text style={[styles.appRate, { color: colors.mutedForeground }]}>
                    {app.interestRate}% p.a.
                  </Text>
                </View>
              </View>
              <View style={styles.appCardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[app.status] ?? colors.muted }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[app.status] ?? colors.mutedForeground }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLOR[app.status] ?? colors.mutedForeground }]}>
                    {STATUS_LABEL[app.status] ?? app.status}
                  </Text>
                </View>
                <Text style={[styles.appDate, { color: colors.mutedForeground }]}>
                  {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Text>
              </View>
              {app.emi && Number(app.emi) > 0 && (
                <Text style={[styles.appEmi, { color: colors.mutedForeground }]}>
                  EMI: {fmtInr(app.emi)}/month
                </Text>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  chipsScroll: { marginBottom: 16, marginLeft: -20, paddingLeft: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  applyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 18,
    marginBottom: 24,
  },
  applyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  applySubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  applyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  appCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  appCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  appCardLeft: { flex: 1, marginRight: 12 },
  appLender: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  appType: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  appAmount: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "right" },
  appRate: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  appCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  appDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  appEmi: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
