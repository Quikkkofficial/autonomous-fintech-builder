// Firebase phone-OTP for React Native.
// Uses @react-native-firebase/auth (native, no reCAPTCHA needed on device).
// IMPORTANT: requires a dev build (`npx expo run:android` / `run:ios`) —
// Firebase phone auth does NOT work in Expo Go.
//
// Setup (one-time, by the developer):
//  1. Firebase console → create project → enable Phone sign-in provider
//  2. Add Android app (package com.quikkk.app) with SHA-256 from Play signing
//  3. Add iOS app (bundle com.quikkk.app), upload APNs key for silent push
//  4. Download google-services.json → android/app/, GoogleService-Info.plist → ios/
// The @react-native-firebase/app + auth Expo config plugins wire them in.

import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

export interface OtpSession {
  confirm: (code: string) => Promise<FirebaseAuthTypes.UserCredential>;
}

/**
 * Send an OTP to an Indian phone number.
 * @param phone 10-digit mobile number, e.g. "9876543210"
 */
export async function sendPhoneOtp(phone: string): Promise<OtpSession> {
  const digits = phone.replace(/\D/g, "").replace(/^91/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error("Enter a valid 10-digit Indian mobile number");
  }
  const confirmation = await auth().signInWithPhoneNumber(`+91${digits}`);
  return { confirm: (code: string) => confirmation.confirm(code.trim()) };
}

/** Get the Firebase ID token for the currently signed-in user. */
export async function getIdToken(): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error("No Firebase user signed in");
  return user.getIdToken(true);
}

export async function signOutFirebase(): Promise<void> {
  await auth().signOut();
}
