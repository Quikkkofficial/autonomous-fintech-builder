import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
import Svg, { Path } from "react-native-svg";
import { useGetDashboardSummary, useGetCreditScore } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function fmtInr(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toFixed(0)}`;
}

function ScoreGauge({ score, band }: { score: number; band: string }) {
  const pct = Math.min(1, Math.max(0, (score - 300) / 600));
  const arc = pct * 188.5;
  const bandColors: Record<string, string> = {
    excellent: "#16A34A",
    good: "#65A30D",
    fair: "#D97706",
    poor: "#EB1414",
  };
  const scoreColor = bandColors[band] ?? "#16A34A";

  return (
    <View style={gaugeStyles.wrap}>
      <Svg width={160} height={100} viewBox="0 0 160 100">
        <Path
          d="M 20 80 A 60 60 0 0 1 140 80"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 20 80 A 60 60 0 0 1 140 80"
          stroke={scoreColor}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arc} 188.5`}
        />
      </Svg>
      <View style={gaugeStyles.labelWrap}>
        <Text style={gaugeStyles.score}>{score}</Text>
        <Text style={[gaugeStyles.band, { color: scoreColor }]}>{band?.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap: { alignItems: "center", position: "relative" },
  labelWrap: { position: "absolute", bottom: 4, alignItems: "center" },
  score: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  band: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
});

const STATUS_COLOR: Record<string, string> = {
  submitted: "#2563EB",
  under_review: "#D97706",
  approved: "#16A34A",
  disbursed: "#7C3AED",
  rejected: "#DC2626",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "In Review",
  approved: "Approved",
  disbursed: "Disbursed",
  rejected: "Rejected",
};

export default function HomeTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useGetDashboardSummary();
  const { data: credit, isLoading: loadingCredit } = useGetCreditScore();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const isLoading = loadingSummary || loadingCredit;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
          paddingBottom: insets.bottom + 90,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetchSummary}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting()}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.name ?? `+91 ${user?.phone ?? ""}`}
          </Text>
        </View>
        <Pressable
          style={[styles.bell, { backgroundColor: colors.muted }]}
          onPress={() => {}}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Credit Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCardTop}>
          <Text style={styles.scoreCardLabel}>CIBIL Score</Text>
          <View style={[styles.bureauBadge]}>
            <Text style={styles.bureauText}>TransUnion</Text>
          </View>
        </View>
        {loadingCredit ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 32 }} />
        ) : credit ? (
          <ScoreGauge score={credit.score} band={credit.band} />
        ) : (
          <View style={styles.noScore}>
            <Feather name="shield-off" size={28} color="rgba(255,255,255,0.5)" />
            <Text style={styles.noScoreText}>Complete KYC to unlock your score</Text>
            <Pressable style={styles.kycBtn} onPress={() => router.push("/kyc" as never)}>
              <Text style={styles.kycBtnText}>Start KYC</Text>
            </Pressable>
          </View>
        )}
        {credit && (
          <Text style={styles.scoreAs}>
            As of {credit.asOf ? new Date(credit.asOf).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
          </Text>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="file-text" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {summary?.activeApplications ?? "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Apps</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="check-circle" size={18} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {summary ? fmtInr(summary.disbursedAmount) : "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Disbursed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={18} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {summary?.nextEmiAmount ? fmtInr(summary.nextEmiAmount) : "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Next EMI</Text>
        </View>
      </View>

      {/* App Breakdown */}
      {summary && summary.applicationsByStatus.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Applications</Text>
          <View style={styles.statusRow}>
            {summary.applicationsByStatus.filter((s) => s.count > 0).map((s) => (
              <View key={s.status} style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[s.status] ?? colors.muted }]} />
                <Text style={[styles.statusCount, { color: colors.foreground }]}>{s.count}</Text>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>{STATUS_LABEL[s.status] ?? s.status}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Activity */}
      {summary && summary.recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Recent Activity</Text>
          {summary.recentActivity.slice(0, 5).map((item, idx) => (
            <View key={idx} style={[styles.activityRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.muted }]}>
                <Feather name="activity" size={14} color={colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.activityDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
              </View>
              <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                {new Date(item.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [styles.cta, { backgroundColor: pressed ? "#C91212" : colors.primary }]}
        onPress={() => router.push("/(tabs)/loans" as never)}
      >
        <Feather name="search" size={18} color="#fff" />
        <Text style={styles.ctaText}>Explore Loan Offers</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  bell: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  scoreCard: {
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  scoreCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 8 },
  scoreCardLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)" },
  bureauBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  bureauText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  noScore: { alignItems: "center", paddingVertical: 20, gap: 10 },
  noScoreText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  kycBtn: { backgroundColor: "#EB1414", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  kycBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scoreAs: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  statusItem: { alignItems: "center", gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusCount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statusLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  activitySection: { marginBottom: 16 },
  sectionHeading: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  activityDetail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  activityTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    marginTop: 8,
  },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
