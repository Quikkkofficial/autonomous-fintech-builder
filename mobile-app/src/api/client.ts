// Shared API client for the Quikkk backend.
// Base: https://quikkk.com/api  (same backend as the web platform)
// Auth: session token from SecureStore, sent as Authorization: Bearer.
// NOTE: the web platform uses httpOnly cookies; mobile uses Bearer tokens.
// The backend's POST /api/auth/session must accept the mobile flow and
// return a token the mobile client can store (see README).

import * as SecureStore from "expo-secure-store";

export const API_BASE = "https://quikkk.com/api";
const TOKEN_KEY = "quikkk_session_token";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // already gone
  }
}

interface ApiOptions {
  method?: string;
  json?: unknown;
  headers?: Record<string, string>;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
  });

  if (res.status === 401) {
    await clearToken();
    throw new Error("UNAUTHENTICATED");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Typed endpoints (mirror the web platform's API surface) ----

export interface Me {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "customer" | "admin" | "sales_partner" | "collection_partner";
  phoneVerifiedAt?: string;
  emailVerifiedAt?: string;
}

export const AuthApi = {
  me: () => api<Me>("/auth/me"),
  /** Exchange a Firebase ID token for a Quikkk session token (mobile flow). */
  session: (idToken: string) =>
    api<{ token: string }>("/auth/session", { method: "POST", json: { idToken } }),
  logout: () => api("/auth/logout", { method: "POST" }),
  emailRequest: (email: string) =>
    api("/auth/email/request", { method: "POST", json: { email } }),
  emailVerify: (email: string, code: string) =>
    api("/auth/email/verify", { method: "POST", json: { email, code } }),
};

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayable: number;
}

export const ToolsApi = {
  calculateEmi: (principal: number, annualRate: number, tenureMonths: number) =>
    api<EmiResult>("/tools/emi", {
      method: "POST",
      json: { principal, annualRate, tenureMonths },
    }),
};

export interface LoanApplicationPayload {
  productId: string;
  amount: number;
  tenureMonths: number;
  purpose?: string;
}

export const LoansApi = {
  apply: (payload: LoanApplicationPayload) =>
    api<{ id: number; status: string }>("/applications", { method: "POST", json: payload }),
  list: () => api<Array<{ id: number; productId: string; amount: number; status: string }>>("/applications"),
};

export interface UpiOrder {
  orderId: string;
  amount: number;
  upiId: string; // merchant VPA
  note: string;
}

export const PaymentsApi = {
  createUpiOrder: (amount: number, purpose: string) =>
    api<UpiOrder>("/payments/upi/order", { method: "POST", json: { amount, purpose } }),
  verifyUpi: (orderId: string, txnRef: string) =>
    api<{ verified: boolean }>("/payments/upi/verify", {
      method: "POST",
      json: { orderId, txnRef },
    }),
};
