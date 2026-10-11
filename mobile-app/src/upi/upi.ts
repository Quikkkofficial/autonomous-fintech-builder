// Bharat UPI deep-linking for the mobile app.
// Builds a standard upi://pay intent and opens the user's UPI app
// (GPay, PhonePe, Paytm, BHIM...). After payment, the txn ref returned
// by the UPI app is sent to the backend for verification.

import { Alert, Linking } from "react-native";

export interface UpiPaymentParams {
  payeeVpa: string; // merchant UPI ID, e.g. "quikkk@hdfcbank"
  payeeName: string; // merchant display name, e.g. "Quikkk"
  amount: number; // in INR
  note: string; // transaction note shown in the UPI app
  txnRef: string; // our order id — echoed back for verification
}

export function buildUpiUri(p: UpiPaymentParams): string {
  const q = (s: string | number) => encodeURIComponent(String(s));
  return (
    `upi://pay?pa=${q(p.payeeVpa)}` +
    `&pn=${q(p.payeeName)}` +
    `&am=${q(p.amount.toFixed(2))}` +
    `&cu=${q("INR")}` +
    `&tn=${q(p.note)}` +
    `&tr=${q(p.txnRef)}`
  );
}

/** Check whether any UPI app is available on this device. */
export async function canPayWithUpi(): Promise<boolean> {
  try {
    return await Linking.canOpenURL("upi://pay?pa=test@upi");
  } catch {
    return false;
  }
}

/**
 * Open the UPI payment flow. Resolves with the raw response string
 * from the UPI app (contains txnRef / Status), or null if cancelled.
 */
export async function payWithUpi(params: UpiPaymentParams): Promise<string | null> {
  const uri = buildUpiUri(params);
  const supported = await Linking.canOpenURL(uri).catch(() => false);
  if (!supported) {
    Alert.alert(
      "No UPI app found",
      "Please install GPay, PhonePe, Paytm or BHIM to pay via UPI."
    );
    return null;
  }
  await Linking.openURL(uri);
  // NOTE: UPI apps return via deep link to the app scheme (quikkk://upi-callback).
  // Register the callback route in app.json scheme handling and parse txnRef there.
  return null;
}

/** Parse a UPI response string like "txnId=...&responseCode=00&Status=SUCCESS&txnRef=...". */
export function parseUpiResponse(response: string): { success: boolean; txnRef?: string } {
  const pairs = Object.fromEntries(
    response.split("&").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.toLowerCase(), decodeURIComponent(v ?? "")];
    })
  );
  const status = (pairs["status"] || "").toUpperCase();
  return {
    success: status === "SUCCESS" || pairs["responsecode"] === "00",
    txnRef: pairs["txnref"],
  };
}
