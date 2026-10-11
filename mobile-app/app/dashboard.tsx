// Dashboard — applications, quick actions, UPI payment entry point.

import React, { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../src/components/ui";
import { colors, fontSize, fontWeight, radius, spacing } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";
import { LoansApi } from "../src/api/client";

interface AppRow {
  id: number;
  productId: string;
  amount: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  approved: colors.success,
  rejected: colors.danger,
  pending: colors.warning,
  disbursed: colors.success,
};

export default function DashboardScreen() {
  const { user, loading } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setApps(await LoansApi.list());
    } catch {
      setApps([]);
    }
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
    else if (user) load();
  }, [loading, user]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greet}>Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</Text>
        <Text style={styles.sub}>Track your applications and manage payments.</Text>

        <View style={styles.actions}>
          <QuickAction icon="📝" label="New application" onPress={() => router.push("/apply")} />
          <QuickAction icon="🧮" label="EMI calculator" onPress={() => router.push("/emi-calculator")} />
          <QuickAction icon="💳" label="Pay via UPI" onPress={() => router.push({ pathname: "/apply", params: { upi: "1" } } as never)} />
          <QuickAction icon="👤" label="Profile" onPress={() => router.push("/profile")} />
        </View>

        <Text style={styles.sectionTitle}>My applications</Text>
        {apps.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No applications yet. Start one in under 2 minutes.</Text>
            <Pressable style={styles.startBtn} onPress={() => router.push("/apply")}>
              <Text style={styles.startText}>Start an application</Text>
            </Pressable>
          </Card>
        ) : (
          apps.map((a) => (
            <Card key={a.id} style={styles.appCard}>
              <View style={styles.appRow}>
                <View>
                  <Text style={styles.appTitle}>Application #{a.id}</Text>
                  <Text style={styles.appSub}>
                    ₹{a.amount.toLocaleString("en-IN")} · {a.productId.replace(/-/g, " ")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${STATUS_COLORS[a.status] ?? colors.textMuted}18` },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[a.status] ?? colors.textMuted }]}>
                    {a.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  greet: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  sub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  action: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { fontSize: 26, marginBottom: spacing.xs },
  actionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  empty: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  startText: { color: "#fff", fontWeight: fontWeight.semibold },
  appCard: { marginBottom: spacing.sm },
  appRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  appTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  appSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
