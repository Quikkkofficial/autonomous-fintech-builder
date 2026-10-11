/**
 * Cashfree Payments (PG) client — Bharat UPI integration.
 *
 * Covers:
 *  - One-time UPI payments: Collect (UPI ID), QR, Intent via Orders API
 *  - Recurring EMIs: UPI Autopay e-mandates via Subscriptions API
 *  - Outbound transfers: loan disbursals / commission payouts via Payouts API
 *  - Webhook signature verification (HMAC-SHA256)
 *  - UPI VPA (Virtual Payment Address) verification
 *
 * Credentials come from env vars (placeholders until the user provides keys):
 *   CASHFREE_APP_ID        — Cashfree "App ID" (x-client-id)
 *   CASHFREE_SECRET_KEY    — Cashfree "Secret Key" (x-client-secret)
 *   CASHFREE_ENV           — "sandbox" (default) or "production"
 *   CASHFREE_WEBHOOK_SECRET— webhook signing secret (defaults to CASHFREE_SECRET_KEY)
 *
 * Docs: https://docs.cashfree.com (PG API version 2023-08-01)
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const API_VERSION = "2023-08-01";

export interface CashfreeConfig {
  appId: string;
  secretKey: string;
  env: "sandbox" | "production";
  webhookSecret: string;
}

export function cashfreeConfig(): CashfreeConfig {
  const appId = process.env.CASHFREE_APP_ID ?? "";
  const secretKey = process.env.CASHFREE_SECRET_KEY ?? "";
  const env =
    process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
  return {
    appId,
    secretKey,
    env,
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET ?? secretKey,
  };
}

export function isCashfreeConfigured(): boolean {
  const c = cashfreeConfig();
  return c.appId.length > 0 && c.secretKey.length > 0;
}

function pgBaseUrl(env: "sandbox" | "production"): string {
  return env === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function payoutBaseUrl(env: "sandbox" | "production"): string {
  return env === "production"
    ? "https://api.cashfree.com/payout"
    : "https://sandbox.cashfree.com/payout";
}

async function cfFetch<T>(
  cfg: CashfreeConfig,
  base: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": cfg.appId,
      "x-client-secret": cfg.secretKey,
      "x-api-version": API_VERSION,
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    const msg =
      data.message ?? data.error ?? `Cashfree request failed (${res.status})`;
    throw new Error(`Cashfree: ${msg}`);
  }
  return data;
}

/* ---------------- Orders (one-time UPI) ---------------- */

export interface CfCustomerDetails {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone: string;
}

export interface CfCreateOrderInput {
  orderId: string;
  amount: number; // INR
  customer: CfCustomerDetails;
  returnUrl?: string;
  notifyUrl?: string;
  /** Restrict to UPI only (upi) or allow all modes. Default: upi. */
  paymentMethods?: "upi" | "all";
}

export interface CfOrder {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  payment_session_id?: string;
  payment_link?: string;
  cf_order_id?: number;
  created_at?: string;
}

export async function cfCreateOrder(
  input: CfCreateOrderInput,
): Promise<CfOrder> {
  const cfg = cashfreeConfig();
  return cfFetch<CfOrder>(cfg, pgBaseUrl(cfg.env), "/orders", {
    method: "POST",
    body: {
      order_id: input.orderId,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.customer_id,
        customer_name: input.customer.customer_name,
        customer_email: input.customer.customer_email,
        customer_phone: input.customer.customer_phone,
      },
      order_meta: {
        ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
        ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
        // Hint the checkout to prefer UPI; the customer still picks
        // Collect vs QR vs Intent inside the Cashfree checkout.
        payment_methods: input.paymentMethods === "all" ? undefined : "upi",
      },
    },
  });
}

export interface CfOrderDetails extends CfOrder {
  order_status:
    | "ACTIVE"
    | "PAID"
    | "EXPIRED"
    | "CANCELLED"
    | "PENDING"
    | string;
  payments?: Array<{
    cf_payment_id: number;
    payment_status: string;
    payment_amount: number;
    payment_method?: { upi?: { upi_id?: string; channel?: string } };
    payment_time?: string;
  }>;
}

export async function cfGetOrder(orderId: string): Promise<CfOrderDetails> {
  const cfg = cashfreeConfig();
  return cfFetch<CfOrderDetails>(
    cfg,
    pgBaseUrl(cfg.env),
    `/orders/${encodeURIComponent(orderId)}`,
  );
}

export interface CfRefund {
  refund_id: string;
  refund_amount: number;
  refund_status: string;
}

export async function cfCreateRefund(
  orderId: string,
  amount: number,
  refundId: string,
): Promise<CfRefund> {
  const cfg = cashfreeConfig();
  return cfFetch<CfRefund>(
    cfg,
    pgBaseUrl(cfg.env),
    `/orders/${encodeURIComponent(orderId)}/refunds`,
    {
      method: "POST",
      body: {
        refund_id: refundId,
        refund_amount: Number(amount.toFixed(2)),
      },
    },
  );
}

/* ---------------- UPI VPA verification ---------------- */

export interface CfVpaVerification {
  upi_id: string;
  name?: string;
  verified: boolean;
}

export async function cfVerifyVpa(upiId: string): Promise<CfVpaVerification> {
  const cfg = cashfreeConfig();
  const data = await cfFetch<{
    upi_id?: string;
    name?: string;
    account_exists?: boolean;
    upiId?: string;
  }>(cfg, pgBaseUrl(cfg.env), "/vrs/upi/verify", {
    method: "POST",
    body: { upi_id: upiId },
  });
  const verified = data.account_exists === true;
  return {
    upi_id: data.upi_id ?? data.upiId ?? upiId,
    name: data.name,
    verified,
  };
}

/* ---------------- Subscriptions (UPI Autopay e-mandates) ---------------- */

export type CfMandateFrequency =
  | "ON_DEMAND"
  | "DAILY"
  | "WEEKLY"
  | "FORTNIGHTLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY";

export interface CfCreateSubscriptionInput {
  subscriptionId: string;
  customer: CfCustomerDetails;
  /** Amount debited per cycle (EMI amount) in INR. */
  amount: number;
  /** Max amount the mandate may debit (allows small variations). */
  maxAmount?: number;
  frequency: CfMandateFrequency;
  /** Total number of debits (EMI tenure). */
  totalDebits: number;
  startDate: string; // YYYY-MM-DD
  returnUrl?: string;
  notifyUrl?: string;
}

export interface CfSubscription {
  subscription_id: string;
  cf_subscription_id?: number;
  status: string;
  auth_link?: string;
  authorization_amount?: number;
  subscription_details?: Record<string, unknown>;
}

export async function cfCreateSubscription(
  input: CfCreateSubscriptionInput,
): Promise<CfSubscription> {
  const cfg = cashfreeConfig();
  return cfFetch<CfSubscription>(cfg, pgBaseUrl(cfg.env), "/subscriptions", {
    method: "POST",
    body: {
      subscription_id: input.subscriptionId,
      customer_details: {
        customer_id: input.customer.customer_id,
        customer_name: input.customer.customer_name,
        customer_email: input.customer.customer_email,
        customer_phone: input.customer.customer_phone,
      },
      plan_details: {
        plan_name: `EMI mandate ${input.subscriptionId}`,
        plan_type: "PERIODIC",
        plan_intervals: [
          {
            interval_type: input.frequency,
            amount: Number(input.amount.toFixed(2)),
            max_amount: Number((input.maxAmount ?? input.amount).toFixed(2)),
            intervals_count: input.totalDebits,
          },
        ],
      },
      authorization_details: {
        authorization_amount: Number((input.maxAmount ?? input.amount).toFixed(2)),
        authorization_amount_variation: "ON_DEMAND",
        frequency: input.frequency,
        auth_type: "upi",
        start_date: input.startDate,
      },
      subscription_meta: {
        ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
        ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
      },
    },
  });
}

export async function cfGetSubscription(
  subscriptionId: string,
): Promise<CfSubscription & { subscription_status?: string }> {
  const cfg = cashfreeConfig();
  return cfFetch<CfSubscription & { subscription_status?: string }>(
    cfg,
    pgBaseUrl(cfg.env),
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

export async function cfCancelSubscription(
  subscriptionId: string,
): Promise<{ status: string }> {
  const cfg = cashfreeConfig();
  return cfFetch<{ status: string }>(
    cfg,
    pgBaseUrl(cfg.env),
    `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    { method: "POST", body: {} },
  );
}

export async function cfPauseSubscription(
  subscriptionId: string,
): Promise<{ status: string }> {
  const cfg = cashfreeConfig();
  return cfFetch<{ status: string }>(
    cfg,
    pgBaseUrl(cfg.env),
    `/subscriptions/${encodeURIComponent(subscriptionId)}/pause`,
    { method: "POST", body: {} },
  );
}

/* ---------------- Payouts (disbursals / commissions) ---------------- */

export interface CfPayoutInput {
  transferId: string;
  amount: number;
  mode: "upi" | "banktransfer";
  upiId?: string;
  accountNumber?: string;
  ifsc?: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  remarks?: string;
}

export interface CfPayout {
  transfer_id: string;
  status: string;
  utr?: string;
}

export async function cfCreatePayout(input: CfPayoutInput): Promise<CfPayout> {
  const cfg = cashfreeConfig();
  const beneDetails =
    input.mode === "upi"
      ? { vpa: input.upiId }
      : { bank_account: input.accountNumber, ifsc: input.ifsc };
  return cfFetch<CfPayout>(cfg, payoutBaseUrl(cfg.env), "/v1/requestTransfer", {
    method: "POST",
    body: {
      transfer_id: input.transferId,
      amount: Number(input.amount.toFixed(2)),
      transfer_mode: input.mode,
      bene_details: {
        ...beneDetails,
        name: input.beneficiaryName,
        phone: input.beneficiaryPhone,
      },
      remarks: input.remarks ?? "Quikkk payout",
    },
  });
}

export async function cfGetPayoutStatus(transferId: string): Promise<CfPayout> {
  const cfg = cashfreeConfig();
  return cfFetch<CfPayout>(
    cfg,
    payoutBaseUrl(cfg.env),
    `/v1/getTransferStatus?transferId=${encodeURIComponent(transferId)}`,
  );
}

/* ---------------- Webhook signature verification ---------------- */

/**
 * Cashfree signs webhooks with HMAC-SHA256(secret, timestamp + rawBody).
 * Headers: x-webhook-signature, x-webhook-timestamp.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | undefined,
  timestamp: string | undefined,
): boolean {
  const cfg = cashfreeConfig();
  if (!signature || !timestamp || !cfg.webhookSecret) return false;
  const expected = createHmac("sha256", cfg.webhookSecret)
    .update(timestamp + rawBody, "utf8")
    .digest("base64");
  try {
    const a = Buffer.from(signature, "base64");
    const b = Buffer.from(expected, "base64");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/* ---------------- Helpers ---------------- */

/** Build a UPI QR/deep-link string (upi://pay?...) for display as QR. */
export function buildUpiQrString(opts: {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  txnRef: string;
  note?: string;
}): string {
  const params = new URLSearchParams({
    pa: opts.payeeVpa,
    pn: opts.payeeName,
    am: opts.amount.toFixed(2),
    cu: "INR",
    tr: opts.txnRef,
    tn: opts.note ?? `Quikkk payment ${opts.txnRef}`,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * NPCI MDR bucket for post-Oct-2026 accounting.
 * Standard P2M: 0.4% above ₹2,000 (capped ₹300); essential categories flat ₹5;
 * autopay/recurring exempt from network MDR.
 */
export function mdrBucketFor(
  amountInr: number,
  opts: { isAutopay?: boolean; category?: string } = {},
): "exempt" | "essential_flat5" | "standard_p2m" {
  if (opts.isAutopay) return "exempt";
  const essentials = new Set([
    "insurance",
    "education",
    "utility",
    "fuel",
    "credit_card_bill",
    "tax",
  ]);
  if (amountInr > 2000 && opts.category && essentials.has(opts.category))
    return "essential_flat5";
  return "standard_p2m";
}
