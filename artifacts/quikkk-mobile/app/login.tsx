import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refetch } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const otpRef = useRef<TextInput>(null);

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    if (cleaned.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await sendOtpMutation.mutateAsync({ data: { phone: cleaned } });
      setDevOtp(res.devOtp ?? null);
      setStep("otp");
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch {
      setError("Could not send OTP. Try again.");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await verifyOtpMutation.mutateAsync({ data: { phone: phone.replace(/\D/g, "").slice(-10), otp } });
      await refetch();
      router.replace("/(tabs)");
    } catch {
      setError("Invalid OTP. Please try again.");
    }
  };

  const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.brand, { color: colors.foreground }]}>Quikkk</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          India's fastest credit marketplace
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {step === "phone" ? (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Mobile Number</Text>
              <View style={[styles.phoneRow, { borderColor: colors.border }]}>
                <View style={[styles.countryCode, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.countryCodeText, { color: colors.foreground }]}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="9876543210"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setError(null); }}
                  onSubmitEditing={handleSendOtp}
                  returnKeyType="next"
                  autoFocus
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: pressed ? "#C91212" : colors.primary, opacity: isLoading ? 0.7 : 1 },
                ]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Get OTP</Text>
                )}
              </Pressable>

              <View style={styles.demoHint}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.demoHintText, { color: colors.mutedForeground }]}>
                  Try: 9000000001 (Admin) · 9000000002 (Partner)
                </Text>
              </View>
            </>
          ) : (
            <>
              <Pressable style={styles.backBtn} onPress={() => { setStep("phone"); setOtp(""); setError(null); }}>
                <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
                <Text style={[styles.backText, { color: colors.mutedForeground }]}>+91 {phone}</Text>
              </Pressable>

              <Text style={[styles.label, { color: colors.foreground }]}>Enter OTP</Text>
              <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>
                Sent to +91 {phone}
              </Text>

              <TextInput
                ref={otpRef}
                style={[styles.otpInput, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => { setOtp(t); setError(null); }}
                onSubmitEditing={handleVerifyOtp}
                returnKeyType="done"
                textAlign="center"
              />

              {devOtp && (
                <View style={[styles.devOtpBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Feather name="zap" size={13} color="#D97706" />
                  <Text style={styles.devOtpText}>Dev OTP: <Text style={{ fontWeight: "700" }}>{devOtp}</Text></Text>
                </View>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: pressed ? "#C91212" : colors.primary, opacity: isLoading ? 0.7 : 1 },
                ]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify &amp; Sign In</Text>
                )}
              </Pressable>

              <Pressable style={styles.resendBtn} onPress={() => { setStep("phone"); setOtp(""); }}>
                <Text style={[styles.resendText, { color: colors.primary }]}>Resend OTP</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={[styles.tnc, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 12 },
  brand: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 36 },
  card: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sublabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -8 },
  phoneRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    height: 52,
  },
  countryCode: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E8E8E8",
  },
  countryCodeText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 60,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 8,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  errorText: { color: "#EB1414", fontSize: 13, fontFamily: "Inter_400Regular" },
  demoHint: { flexDirection: "row", gap: 6, alignItems: "center", paddingTop: 4 },
  demoHintText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  backBtn: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  devOtpBadge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  devOtpText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#92400E" },
  resendBtn: { alignItems: "center", paddingVertical: 4 },
  resendText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  tnc: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 24, lineHeight: 16 },
});
