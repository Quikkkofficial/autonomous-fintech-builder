import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListCreditCards, useListCardApplications, useCreateCardApplication } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const CARD_GRADIENTS: Record<string, [string, string]> = {
  gold: ["#B8860B", "#FFD700"],
  platinum: ["#4A4A4A", "#9E9E9E"],
  blue: ["#1565C0", "#42A5F5"],
  black: ["#1A1A1A", "#444444"],
  green: ["#1B5E20", "#4CAF50"],
  purple: ["#4A148C", "#9C27B0"],
  red: ["#B71C1C", "#EF5350"],
  teal: ["#006064", "#26C6DA"],
};

function getGradient(color: string): [string, string] {
  const lower = color.toLowerCase();
  for (const [key, grad] of Object.entries(CARD_GRADIENTS)) {
    if (lower.includes(key)) return grad;
  }
  return ["#1A1A1A", "#444444"];
}

const NETWORK_ICON: Record<string, string> = {
  visa: "V",
  mastercard: "MC",
  rupay: "Ru",
  amex: "Ax",
};

function CreditCardVisual({ card }: { card: { name: string; issuer: string; network: string; color: string } }) {
  const grad = getGradient(card.color);
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={cardStyles.visual}
    >
      <View style={cardStyles.topRow}>
        <Text style={cardStyles.issuer}>{card.issuer}</Text>
        <Text style={cardStyles.network}>{NETWORK_ICON[card.network] ?? card.network}</Text>
      </View>
      <View style={cardStyles.chipRow}>
        <View style={cardStyles.chip} />
      </View>
      <Text style={cardStyles.cardNumber}>•••• •••• •••• ••••</Text>
      <Text style={cardStyles.cardName}>{card.name}</Text>
    </LinearGradient>
  );
}

const cardStyles = StyleSheet.create({
  visual: { borderRadius: 16, padding: 20, height: 180, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  issuer: { fontSize: 16, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.9)" },
  network: { fontSize: 14, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.8)" },
  chipRow: { marginTop: 8 },
  chip: { width: 36, height: 28, borderRadius: 4, backgroundColor: "rgba(255,215,0,0.6)" },
  cardNumber: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", letterSpacing: 2 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
});

const STATUS_COLOR: Record<string, string> = {
  submitted: "#2563EB",
  under_review: "#D97706",
  approved: "#16A34A",
  dispatched: "#7C3AED",
  rejected: "#DC2626",
};

export default function CardsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [applying, setApplying] = useState<string | null>(null);

  const { data: cards, isLoading: loadingCards } = useListCreditCards();
  const { data: applications, isLoading: loadingApps, refetch } = useListCardApplications();
  const applyMutation = useCreateCardApplication();

  const featuredCard = cards?.[featuredIdx];

  const handleApply = async (cardId: string, cardName: string) => {
    if (applying) return;
    const already = applications?.find((a) => a.cardId === cardId && a.status !== "rejected");
    if (already) {
      Alert.alert("Already Applied", `You already have an application for ${cardName}.`);
      return;
    }
    setApplying(cardId);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await applyMutation.mutateAsync({ data: { cardId } });
      await refetch();
      Alert.alert("Applied!", `Your application for ${cardName} has been submitted.`);
    } catch {
      Alert.alert("Error", "Could not apply right now. Please try again.");
    } finally {
      setApplying(null);
    }
  };

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
      <Text style={[styles.title, { color: colors.foreground }]}>Credit Cards</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Hand-picked offers for you
      </Text>

      {loadingCards ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Featured Card Carousel */}
          {featuredCard && (
            <View style={styles.featuredSection}>
              <CreditCardVisual card={featuredCard} />
              <View style={styles.dotsRow}>
                {(cards ?? []).slice(0, 5).map((_, i) => (
                  <Pressable key={i} onPress={() => setFeaturedIdx(i)}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: i === featuredIdx ? colors.primary : colors.border },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Cards List */}
          {(cards ?? []).map((card) => {
            const app = applications?.find((a) => a.cardId === card.id);
            return (
              <View key={card.id} style={[styles.cardItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardItemLeft}>
                  <View style={[styles.colorDot, { backgroundColor: getGradient(card.color)[0] }]} />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: colors.foreground }]}>{card.name}</Text>
                    <Text style={[styles.cardIssuer, { color: colors.mutedForeground }]}>
                      {card.issuer} · {card.network.toUpperCase()}
                    </Text>
                    <Text style={[styles.cardRewards, { color: colors.primary }]}>{card.rewardsRate}</Text>
                  </View>
                </View>
                <View style={styles.cardItemRight}>
                  {card.annualFee === 0 ? (
                    <View style={[styles.freeTag, { backgroundColor: "#F0FDF4" }]}>
                      <Text style={[styles.freeTagText, { color: "#16A34A" }]}>Free</Text>
                    </View>
                  ) : (
                    <Text style={[styles.feeText, { color: colors.mutedForeground }]}>
                      ₹{card.annualFee}/yr
                    </Text>
                  )}
                  {app ? (
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[app.status] + "20" }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[app.status] }]}>
                        {app.status.replace("_", " ")}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.applyBtn,
                        { backgroundColor: pressed ? "#C91212" : colors.primary, opacity: applying === card.id ? 0.7 : 1 },
                      ]}
                      onPress={() => handleApply(card.id, card.name)}
                      disabled={!!applying}
                    >
                      {applying === card.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.applyBtnText}>Apply</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {/* Perks section for featured */}
          {featuredCard && featuredCard.perks.length > 0 && (
            <View style={[styles.perksCard, { backgroundColor: colors.muted }]}>
              <Text style={[styles.perksTitle, { color: colors.foreground }]}>
                {featuredCard.name} Perks
              </Text>
              {featuredCard.perks.map((perk, i) => (
                <View key={i} style={styles.perkRow}>
                  <View style={[styles.perkDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.perkText, { color: colors.foreground }]}>{perk}</Text>
                </View>
              ))}
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
  featuredSection: { marginBottom: 24 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardItemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardIssuer: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  cardRewards: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  cardItemRight: { alignItems: "flex-end", gap: 8 },
  freeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  freeTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  feeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  applyBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  perksCard: { borderRadius: 16, padding: 16, marginTop: 8, gap: 10 },
  perksTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  perkDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  perkText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
});
