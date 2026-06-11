import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useGetMe, useGetKyc, useGetCreditScore } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function ScoreMini({ score, band }: { score: number; band: string }) {
  const pct = Math.min(1, Math.max(0, (score - 300) / 600));
  const bandColors: Record<string, string> = {
    excellent: "#16A34A", good: "#65A30D", fair: "#D97706", poor: "#EB1414",
  };
  const sc = bandColors[band] ?? "#16A34A";
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={100} height={62} viewBox="0 0 100 62">
        <Path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#E8E8E8" strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path
          d="M 10 50 A 40 40 0 0 1 90 50"
          stroke={sc}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${pct * 125.7} 125.7`}
        />
      </Svg>
      <View style={{ position: "absolute", bottom: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: "#141414" }}>{score}</Text>
        <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: sc, letterSpacing: 0.5 }}>
          {band.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const KYC_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  verified: { bg: "#F0FDF4", fg: "#16A34A", label: "Verified" },
  submitted: { bg: "#FEF3C7", fg: "#D97706", label: "Pending Review" },
  pending: { bg: "#F5F5F5", fg: "#737373", label: "Incomplete" },
  rejected: { bg: "#FEF2F2", fg: "#DC2626", label: "Rejected" },
};

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const { data: kyc, isLoading: loadingKyc } = useGetKyc();
  const { data: credit, isLoading: loadingCredit } = useGetCreditScore();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const kycBadge = KYC_BADGE[kyc?.status ?? user?.kycStatus ?? "pending"];
  const initials = (user?.name ?? user?.phone ?? "Q").slice(0, 2).toUpperCase();

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
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      {/* User Card */}
      <View style={[styles.userCard, { backgroundColor: "#141414" }]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: "#EB1414" }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {kycBadge && (
            <View style={[styles.kycBadge, { backgroundColor: kycBadge.bg }]}>
              <Text style={[styles.kycBadgeText, { color: kycBadge.fg }]}>{kycBadge.label}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name ?? "—"}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone ?? "—"}</Text>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
        </View>
      </View>

      {/* Credit Score */}
      {credit && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Credit Score</Text>
          <View style={styles.scoreRow}>
            <ScoreMini score={credit.score} band={credit.band} />
            <View style={styles.scoreFactors}>
              {credit.factors.slice(0, 3).map((f, i) => (
                <View key={i} style={styles.factorRow}>
                  <Feather
                    name={f.impact === "positive" ? "arrow-up-circle" : f.impact === "negative" ? "arrow-down-circle" : "minus-circle"}
                    size={14}
                    color={f.impact === "positive" ? "#16A34A" : f.impact === "negative" ? "#EB1414" : "#D97706"}
                  />
                  <Text style={[styles.factorText, { color: colors.foreground }]}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={[styles.bureauNote, { color: colors.mutedForeground }]}>
            Bureau: {credit.bureau} · As of {credit.asOf ? new Date(credit.asOf).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
          </Text>
        </View>
      )}

      {/* KYC Details */}
      {loadingKyc ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : kyc && kyc.status !== "pending" ? (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>KYC Details</Text>
          {[
            { label: "Full Name", value: kyc.fullName },
            { label: "PAN", value: kyc.panMasked },
            { label: "Aadhaar", value: kyc.aadhaarMasked },
            { label: "Date of Birth", value: kyc.dob },
            { label: "Bank Account", value: kyc.bankAccountMasked },
            { label: "IFSC", value: kyc.ifsc },
            { label: "Monthly Income", value: kyc.monthlyIncome ? `₹${kyc.monthlyIncome.toLocaleString("en-IN")}` : undefined },
            { label: "Employment", value: kyc.employmentType?.replace(/_/g, " ") },
          ].filter(r => r.value).map(({ label, value }) => (
            <View key={label} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.kycPrompt, { backgroundColor: pressed ? "#C91212" : "#EB1414" }]}
          onPress={() => router.push("/kyc" as never)}
        >
          <Feather name="shield" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.kycPromptTitle}>Complete Your KYC</Text>
            <Text style={styles.kycPromptSubtitle}>Unlock loans, cards & your CIBIL score</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#fff" />
        </Pressable>
      )}

      {/* Actions */}
      <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, { backgroundColor: pressed ? colors.muted : "transparent", borderBottomColor: colors.border }]}
          onPress={() => router.push("/(tabs)" as never)}
        >
          <Feather name="bell" size={18} color={colors.foreground} />
          <Text style={[styles.actionLabel, { color: colors.foreground }]}>Notifications</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionRow, { backgroundColor: pressed ? colors.muted : "transparent", borderBottomColor: "transparent" }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={18} color="#EB1414" />
          <Text style={[styles.actionLabel, { color: "#EB1414" }]}>Sign Out</Text>
          <Feather name="chevron-right" size={16} color="#EB1414" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  userCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  avatarWrap: { alignItems: "center", gap: 8 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  kycBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  kycBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  userPhone: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 2 },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 12 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  scoreFactors: { flex: 1, gap: 8 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  factorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  bureauNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 16 },
  kycPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  kycPromptTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  kycPromptSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  actionsCard: { borderRadius: 16, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1 },
  actionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
