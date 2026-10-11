// Profile — account details, verification status, sign out.

import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Card, Screen } from "../src/components/ui";
import { colors, fontSize, fontWeight, radius, spacing } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";

function roleLabel(role?: string): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "sales_partner":
      return "Channel Partner";
    case "collection_partner":
      return "Collection Partner";
    default:
      return "Customer";
  }
}

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [loading, user]);

  if (loading || !user) return null;

  async function onSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.name?.[0] ?? user.phone?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.name ?? "Quikkk user"}</Text>
        <Text style={styles.role}>{roleLabel(user.role)}</Text>

        <Card style={styles.card}>
          <InfoRow label="Mobile" value={`+91 ${user.phone}`} />
          <InfoRow label="Email" value={user.email ?? "Not added"} />
          <InfoRow
            label="Phone verified"
            value={user.phoneVerifiedAt ? "Yes ✓" : "No"}
            valueColor={user.phoneVerifiedAt ? colors.success : colors.warning}
          />
          <InfoRow
            label="Email verified"
            value={user.emailVerifiedAt ? "Yes ✓" : "No"}
            valueColor={user.emailVerifiedAt ? colors.success : colors.warning}
          />
        </Card>

        <Pressable style={styles.link} onPress={() => router.push("/emi-calculator")}>
          <Text style={styles.linkText}>EMI calculator</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push("/dashboard")}>
          <Text style={styles.linkText}>My applications</Text>
        </Pressable>

        <Pressable style={styles.signOut} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.version}>Quikkk v1.0.0 · quikkk.com</Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, alignItems: "center" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: fontWeight.bold },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  role: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.lg },
  card: { width: "100%", marginBottom: spacing.lg },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: fontSize.md, color: colors.textMuted },
  rowValue: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  link: {
    width: "100%",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.medium },
  signOut: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  signOutText: { color: colors.danger, fontWeight: fontWeight.semibold, fontSize: fontSize.md },
  version: { marginTop: spacing.lg, fontSize: fontSize.xs, color: colors.textMuted },
});
