// Loan Application — product picker, amount, tenure, submit.

import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Input, Screen } from "../src/components/ui";
import { colors, fontSize, fontWeight, radius, spacing } from "../src/theme";
import { PRODUCTS, getProduct } from "../src/data/products";
import { LoansApi } from "../src/api/client";
import { useAuth } from "../src/auth/AuthContext";

export default function ApplyScreen() {
  const { user, loading } = useAuth();
  const params = useLocalSearchParams<{ productId?: string }>();
  const [productId, setProductId] = useState(params.productId ?? "personal-loan");
  const [amount, setAmount] = useState("500000");
  const [tenure, setTenure] = useState("36");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [loading, user]);

  async function onSubmit() {
    setError("");
    const amt = Number(amount);
    const ten = Number(tenure);
    if (!amt || amt < 10000) {
      setError("Enter a loan amount of at least ₹10,000");
      return;
    }
    if (!ten || ten < 6) {
      setError("Tenure must be at least 6 months");
      return;
    }
    setSubmitting(true);
    try {
      const res = await LoansApi.apply({
        productId,
        amount: amt,
        tenureMonths: ten,
        purpose: purpose || undefined,
      });
      Alert.alert(
        "Application submitted",
        `Application #${res.id} is ${res.status}. We'll match you with the best lenders.`,
        [{ text: "View dashboard", onPress: () => router.replace("/dashboard") }]
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const product = getProduct(productId);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Apply for a loan</Text>
        <Text style={styles.sub}>One application — offers from 50+ lenders.</Text>

        <Text style={styles.label}>Product</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {PRODUCTS.filter((p) => p.id !== "credit-cards").map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setProductId(p.id)}
              style={[styles.chip, productId === p.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, productId === p.id && styles.chipTextActive]}>
                {p.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {product ? (
          <Text style={styles.productRate}>
            {product.range} · {product.rate}
          </Text>
        ) : null}

        <Input
          label="Loan amount (₹)"
          placeholder="500000"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <Input
          label="Tenure (months)"
          placeholder="36"
          keyboardType="number-pad"
          value={tenure}
          onChangeText={setTenure}
        />
        <Input
          label="Purpose (optional)"
          placeholder="e.g. Home renovation"
          value={purpose}
          onChangeText={setPurpose}
          error={error}
        />

        <Button title="Submit application" onPress={onSubmit} loading={submitting} />
        <Text style={styles.fineprint}>
          Submitting does not affect your credit score. Final approval is by the lender.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 4 },
  sub: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chips: { marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  chipTextActive: { color: "#fff" },
  productRate: { fontSize: fontSize.sm, color: colors.primary, marginBottom: spacing.md },
  fineprint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
