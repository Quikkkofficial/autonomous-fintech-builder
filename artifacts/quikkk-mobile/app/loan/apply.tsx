import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMatchLoans, useCreateLoanApplication, useListLenders } from "@workspace/api-client-react";
import type { LoanOffer } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const LOAN_TYPES = [
  { key: "personal", label: "Personal" },
  { key: "home", label: "Home" },
  { key: "auto", label: "Auto" },
  { key: "business", label: "Business" },
  { key: "education", label: "Education" },
];

function fmtInr(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ApplyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type: initialType } = useLocalSearchParams<{ type: string }>();

  const [loanType, setLoanType] = useState(initialType ?? "personal");
  const [amountText, setAmountText] = useState("500000");
  const [tenure, setTenure] = useState("36");
  const [step, setStep] = useState<"form" | "offers">("form");
  const [applying, setApplying] = useState<string | null>(null);

  const matchMutation = useMatchLoans();
  const applyMutation = useCreateLoanApplication();

  const amount = parseInt(amountText.replace(/\D/g, "")) || 0;
  const tenureMonths = parseInt(tenure) || 36;

  const handleMatch = async () => {
    if (amount < 10000) {
      Alert.alert("Invalid Amount", "Minimum loan amount is ₹10,000");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await matchMutation.mutateAsync({
        data: {
          type: loanType as "personal" | "home" | "auto" | "business" | "education",
          amount,
          tenureMonths,
        },
      });
      setStep("offers");
    } catch {
      Alert.alert("Error", "Could not find offers. Please try again.");
    }
  };

  const handleApply = async (offer: LoanOffer) => {
    if (applying) return;
    setApplying(offer.lenderId);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await applyMutation.mutateAsync({
        data: {
          lenderId: offer.lenderId,
          type: loanType as "personal" | "home" | "auto" | "business" | "education",
          amount,
          tenureMonths,
        },
      });
      Alert.alert(
        "Application Submitted!",
        `Your ${loanType} loan application with ${offer.lenderName} has been submitted.`,
        [{ text: "View Applications", onPress: () => router.replace("/(tabs)/loans") }],
      );
    } catch {
      Alert.alert("Error", "Could not submit application. Please try again.");
    } finally {
      setApplying(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
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
          <Pressable style={styles.backBtn} onPress={() => (step === "offers" ? setStep("form") : router.back())}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {step === "form" ? "Apply for Loan" : "Choose Offer"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {step === "form" ? (
          <>
            {/* Loan Type */}
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Loan Type</Text>
            <View style={styles.typeGrid}>
              {LOAN_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: loanType === t.key ? colors.primary : colors.muted,
                      borderColor: loanType === t.key ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setLoanType(t.key); }}
                >
                  <Text style={[styles.typeChipText, { color: loanType === t.key ? "#fff" : colors.foreground }]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Loan Amount</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border }]}>
              <Text style={[styles.rupeeSign, { color: colors.mutedForeground }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.foreground }]}
                value={amountText}
                onChangeText={(t) => setAmountText(t.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholder="500000"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={styles.amountHints}>
              {[100000, 500000, 1000000, 2000000].map((v) => (
                <Pressable
                  key={v}
                  style={[styles.amountHint, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => setAmountText(String(v))}
                >
                  <Text style={[styles.amountHintText, { color: colors.foreground }]}>{fmtInr(v)}</Text>
                </Pressable>
              ))}
            </View>

            {/* Tenure */}
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Tenure (months)</Text>
            <View style={styles.tenureGrid}>
              {[12, 24, 36, 48, 60, 84].map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.tenureChip,
                    {
                      backgroundColor: tenure === String(m) ? colors.primary : colors.muted,
                      borderColor: tenure === String(m) ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setTenure(String(m)); }}
                >
                  <Text style={[styles.tenureText, { color: tenure === String(m) ? "#fff" : colors.foreground }]}>
                    {m}m
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.matchBtn,
                { backgroundColor: pressed ? "#C91212" : colors.primary, opacity: matchMutation.isPending ? 0.7 : 1 },
              ]}
              onPress={handleMatch}
              disabled={matchMutation.isPending}
            >
              {matchMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="search" size={18} color="#fff" />
                  <Text style={styles.matchBtnText}>Find Best Offers</Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <>
            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                {loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loan
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.foreground }]}>{fmtInr(amount)}</Text>
              <Text style={[styles.summaryTenure, { color: colors.mutedForeground }]}>{tenureMonths} months</Text>
            </View>

            {(matchMutation.data ?? []).length === 0 ? (
              <View style={[styles.noOffers, { backgroundColor: colors.muted }]}>
                <Feather name="frown" size={28} color={colors.mutedForeground} />
                <Text style={[styles.noOffersText, { color: colors.foreground }]}>No offers available</Text>
                <Text style={[styles.noOffersSub, { color: colors.mutedForeground }]}>
                  Try a different amount or improve your credit profile
                </Text>
              </View>
            ) : (
              (matchMutation.data ?? []).map((offer, idx) => (
                <View
                  key={offer.lenderId}
                  style={[
                    styles.offerCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: idx === 0 ? colors.primary : colors.border,
                      borderWidth: idx === 0 ? 2 : 1,
                    },
                  ]}
                >
                  {idx === 0 && (
                    <View style={[styles.bestBadge, { backgroundColor: colors.primary }]}>
                      <Feather name="star" size={11} color="#fff" />
                      <Text style={styles.bestBadgeText}>Best Match</Text>
                    </View>
                  )}
                  {offer.preApproved && (
                    <View style={[styles.preAppBadge, { backgroundColor: "#F0FDF4" }]}>
                      <Text style={[styles.preAppText, { color: "#16A34A" }]}>Pre-Approved</Text>
                    </View>
                  )}
                  <Text style={[styles.offerLender, { color: colors.foreground }]}>{offer.lenderName}</Text>
                  <View style={styles.offerStats}>
                    <View style={styles.offerStat}>
                      <Text style={[styles.offerStatVal, { color: colors.primary }]}>{offer.interestRate}%</Text>
                      <Text style={[styles.offerStatLabel, { color: colors.mutedForeground }]}>Rate p.a.</Text>
                    </View>
                    <View style={styles.offerStat}>
                      <Text style={[styles.offerStatVal, { color: colors.foreground }]}>{fmtInr(offer.emi)}</Text>
                      <Text style={[styles.offerStatLabel, { color: colors.mutedForeground }]}>Monthly EMI</Text>
                    </View>
                    <View style={styles.offerStat}>
                      <Text style={[styles.offerStatVal, { color: colors.foreground }]}>{offer.approvalHours}h</Text>
                      <Text style={[styles.offerStatLabel, { color: colors.mutedForeground }]}>Approval</Text>
                    </View>
                  </View>
                  <View style={styles.offerFooter}>
                    <Text style={[styles.processingFee, { color: colors.mutedForeground }]}>
                      Processing: {offer.processingFee > 0 ? fmtInr(offer.processingFee) : "Nil"}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.applyBtn,
                        { backgroundColor: pressed ? "#C91212" : colors.primary, opacity: applying === offer.lenderId ? 0.7 : 1 },
                      ]}
                      onPress={() => handleApply(offer)}
                      disabled={!!applying}
                    >
                      {applying === offer.lenderId ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.applyBtnText}>Apply Now</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 10, marginTop: 16 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    gap: 4,
  },
  rupeeSign: { fontSize: 20, fontFamily: "Inter_500Medium" },
  amountInput: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  amountHints: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  amountHint: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  amountHintText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tenureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tenureChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tenureText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  matchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    marginTop: 28,
  },
  matchBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryAmount: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  summaryTenure: { fontSize: 13, fontFamily: "Inter_400Regular" },
  noOffers: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  noOffersText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  noOffersSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  offerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  bestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bestBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  preAppBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  preAppText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  offerLender: { fontSize: 18, fontFamily: "Inter_700Bold" },
  offerStats: { flexDirection: "row", gap: 24 },
  offerStat: { gap: 2 },
  offerStatVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  offerStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  offerFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  processingFee: { fontSize: 12, fontFamily: "Inter_400Regular" },
  applyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
