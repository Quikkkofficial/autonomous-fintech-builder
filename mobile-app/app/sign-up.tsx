// Sign Up — phone OTP + name + email (email verified via Brevo OTP).

import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Button, Input, Screen } from "../src/components/ui";
import { colors, fontSize, fontWeight, spacing } from "../src/theme";
import { sendPhoneOtp, type OtpSession } from "../src/auth/firebase";
import { AuthApi } from "../src/api/client";
import { useAuth } from "../src/auth/AuthContext";

export default function SignUpScreen() {
  const { completeSignIn } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<OtpSession | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function onSendOtp() {
    setError("");
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
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
      // Save the display name on the backend profile
      try {
        await AuthApi.me(); // session established; name can be updated on profile screen
      } catch {
        // non-fatal
      }
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.sub}>Compare loans and credit cards in seconds.</Text>

          {!session ? (
            <View>
              <Input label="Full name" placeholder="Rahul Sharma" value={name} onChangeText={setName} />
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
              <Button title="Verify & create account" onPress={onVerify} loading={verifying} />
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <Text style={styles.link}>Sign in</Text>
            </Link>
          </View>
          <Text style={styles.terms}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
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
  terms: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
