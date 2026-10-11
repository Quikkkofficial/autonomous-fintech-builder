// Home — hero + product grid (mirrors quikkk.com).

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRODUCTS } from "../src/data/products";
import { Card } from "../src/components/ui";
import { colors, fontSize, fontWeight, radius, spacing } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";

const ICONS: Record<string, string> = {
  "personal-loan": "💰",
  "home-loan": "🏠",
  "auto-loan": "🚗",
  "business-loan": "💼",
  "education-loan": "🎓",
  "gold-loan": "🪙",
  "fd-loan": "🏦",
  "mf-loan": "📈",
  "insurance-loan": "🛡️",
  "credit-cards": "💳",
};

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={PRODUCTS}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.logo}>
                Quikkk<Text style={styles.logoDot}>.</Text>
              </Text>
              {user ? (
                <Pressable onPress={() => router.push("/dashboard")}>
                  <Text style={styles.signIn}>Dashboard</Text>
                </Pressable>
              ) : (
                <Link href="/sign-in" asChild>
                  <Pressable>
                    <Text style={styles.signIn}>Sign in</Text>
                  </Pressable>
                </Link>
              )}
            </View>
            <Text style={styles.heroTitle}>Money, quikkk-ly in your account</Text>
            <Text style={styles.heroSub}>
              Compare personal loans & credit cards from 50+ RBI-regulated lenders. One
              application, best offers.
            </Text>
            <View style={styles.ctaRow}>
              <Pressable
                style={styles.ctaPrimary}
                onPress={() => router.push(user ? "/dashboard" : "/sign-in")}
              >
                <Text style={styles.ctaPrimaryText}>Check your offers →</Text>
              </Pressable>
              <Pressable style={styles.ctaGhost} onPress={() => router.push("/emi-calculator")}>
                <Text style={styles.ctaGhostText}>EMI calculator</Text>
              </Pressable>
            </View>
            <View style={styles.stats}>
              <Stat value="₹2,400Cr+" label="Disbursed" />
              <Stat value="4.5L+" label="Customers" />
              <Stat value="50+" label="Lenders" />
            </View>
            <Text style={styles.sectionTitle}>Pick your product</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.cardWrap}
            onPress={() => router.push(`/product/${item.id}` as never)}
          >
            <Card style={styles.card}>
              <View style={[styles.icon, { backgroundColor: item.iconBg }]}>
                <Text style={styles.iconText}>{ICONS[item.id] ?? "💳"}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardRange}>{item.range}</Text>
              <Text style={styles.cardRate}>{item.rate}</Text>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logo: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  logoDot: { color: colors.primary },
  signIn: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primary },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  heroSub: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 24 },
  ctaRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  ctaPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPrimaryText: { color: "#fff", fontWeight: fontWeight.semibold, fontSize: fontSize.md },
  ctaGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  ctaGhostText: { color: colors.text, fontWeight: fontWeight.semibold, fontSize: fontSize.md },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: spacing.xl },
  stat: { alignItems: "center" },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  statLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardWrap: { flex: 1, maxWidth: "50%", padding: spacing.xs },
  card: { alignItems: "flex-start", minHeight: 150 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconText: { fontSize: 22 },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  cardRange: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  cardRate: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.primary, marginTop: 4 },
});
