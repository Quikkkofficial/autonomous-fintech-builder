// Sign In — phone OTP via Firebase (no password, no Clerk).

import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Button, Input, Screen } from "../src/components/ui";
import { colors, fontSize, fontWeight, spacing } from "../src/theme";
import { sendPhoneOtp, type OtpSession } from "../src/auth/firebase";
import { useAuth } from "../src/auth/AuthContext";

export default function SignInScreen() {
  const { completeSignIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<OtpSession | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function onSendOtp() {
    setError("");
    setSending(true);
    try {
      const s = await sendPhoneOtp(phone);
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }

  async function onVerify() {
    if (!session) return;
    setError("");
    setVerifying(true);
    try {
      await session.confirm(code);
      await completeSignIn();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Sign in with your mobile number — no password needed.</Text>

          {!session ? (
            <View>
              <Input
                label="Mobile number"
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                error={error}
              />
              <Button title="Send OTP" onPress={onSendOtp} loading={sending} />
            </View>
          ) : (
            <View>
              <Text style={styles.sentTo}>OTP sent to +91 {phone}</Text>
              <Input
                label="Enter 6-digit OTP"
                placeholder="••••••"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                error={error}
              />
              <Button title="Verify & sign in" onPress={onVerify} loading={verifying} />
              <Button
                title="Resend OTP"
                variant="ghost"
                onPress={() => {
                  setSession(null);
                  setCode("");
                  onSendOtp();
                }}
              />
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Quikkk? </Text>
            <Link href="/sign-up" asChild>
              <Text style={styles.link}>Create an account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  sub: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.xl },
  sentTo: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: fontSize.md },
  link: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.md },
});
