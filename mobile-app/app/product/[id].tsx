// Product Detail — features, rates, apply CTA.

import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getProduct } from "../../src/data/products";
import { Card } from "../../src/components/ui";
import { colors, fontSize, fontWeight, radius, spacing } from "../../src/theme";
import { useAuth } from "../../src/auth/AuthContext";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const product = getProduct(id ?? "");

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={[styles.banner, { backgroundColor: product.iconBg }]}>
        <Text style={styles.bannerTitle}>{product.name}</Text>
        <Text style={styles.bannerSub}>{product.range}</Text>
      </View>

      <Card style={styles.rateCard}>
        <Text style={styles.rateLabel}>Starting interest rate</Text>
        <Text style={styles.rateValue}>{product.rate}</Text>
      </Card>

      <Text style={styles.desc}>{product.description}</Text>

      <Text style={styles.sectionTitle}>Why choose this</Text>
      {product.features.map((f) => (
        <View key={f} style={styles.featureRow}>
          <View style={styles.check}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}

      <Pressable
        style={styles.applyBtn}
        onPress={() =>
          router.push(user ? ({ pathname: "/apply", params: { productId: product.id } } as never) : "/sign-in")
        }
      >
        <Text style={styles.applyText}>Apply now →</Text>
      </Pressable>
      <Text style={styles.fineprint}>
        Loans subject to lender approval. Quikkk is a marketplace operated by Mekyek Global
        Services Pvt Ltd.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted },
  banner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bannerTitle: { color: "#fff", fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  bannerSub: { color: "#ffffffcc", fontSize: fontSize.md, marginTop: 4 },
  rateCard: { marginBottom: spacing.md },
  rateLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rateValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary, marginTop: 4 },
  desc: { fontSize: fontSize.md, color: colors.text, lineHeight: 24, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  checkText: { color: colors.primary, fontWeight: fontWeight.bold },
  featureText: { fontSize: fontSize.md, color: colors.text },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  applyText: { color: "#fff", fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  fineprint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
