/**
 * Bharat UPI payments — Cashfree PG.
 *
 * Customer (authenticated):
 *   POST /api/payments/order            create a one-time UPI payment order
 *   GET  /api/payments/order/:reference check + sync order status
 *   POST /api/payments/vpa/verify       verify a UPI ID (VPA)
 *   GET  /api/payments/history          list own transactions
 *   POST /api/payments/autopay/setup    create a UPI Autopay e-mandate (recurring EMI)
 *   GET  /api/payments/autopay          list own mandates
 *   POST /api/payments/autopay/:reference/cancel   cancel a mandate
 *   POST /api/payments/autopay/:reference/pause    pause a mandate
 *
 * Webhook (public, HMAC-verified):
 *   POST /api/payments/webhook          Cashfree payment / subscription events
 *
 * Admin:
 *   GET  /api/admin/payments            all transactions
 *   POST /api/admin/payments/order/:reference/refund
 *   GET  /api/admin/payments/autopay    all mandates
 *   POST /api/admin/payouts             initiate a payout (disbursal / commission / refund)
 *   GET  /api/admin/payouts            list payouts
 */
import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  usersTable,
  upiTransactionsTable,
  upiAutopayMandatesTable,
  upiPayoutsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/session";
import { genId } from "../lib/utils";
import { logger } from "../lib/logger";
import {
  isCashfreeConfigured,
  cfCreateOrder,
  cfGetOrder,
  cfCreateRefund,
  cfVerifyVpa,
  cfCreateSubscription,
  cfGetSubscription,
  cfCancelSubscription,
  cfPauseSubscription,
  cfCreatePayout,
  verifyWebhookSignature,
  buildUpiQrString,
  mdrBucketFor,
  type CfMandateFrequency,
} from "../lib/cashfree";

const router: IRouter = Router();

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "https://quikkk.com";
// Merchant VPA shown in QR strings. Set CASHFREE_MERCHANT_VPA in production.
const MERCHANT_VPA = process.env.CASHFREE_MERCHANT_VPA ?? "quikkk@cashfree";
const MERCHANT_NAME = "Quikkk";

type AuthedReq = Request & { userId: number };

function requireCashfree(res: Response): boolean {
  if (!isCashfreeConfigured()) {
    res.status(503).json({
      error: "payments_unavailable",
      message:
        "UPI payments are not configured yet. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
    });
    return false;
  }
  return true;
}

const VALID_PURPOSES = new Set([
  "emi",
  "processing_fee",
  "platform_fee",
  "other",
]);

/* ---------------- Customer: one-time UPI orders ---------------- */

router.post("/payments/order", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const userId = (req as AuthedReq).userId;
  const { amount, purpose, applicationId, upiId, method } = req.body as {
    amount?: number;
    purpose?: string;
    applicationId?: string;
    upiId?: string;
    method?: "upi_collect" | "upi_qr" | "upi_intent";
  };

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 1 || amt > 100000) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }
  if (!purpose || !VALID_PURPOSES.has(purpose)) {
    res.status(400).json({ error: "invalid_purpose" });
    return;
  }
  if (upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
    res.status(400).json({ error: "invalid_upi_id" });
    return;
  }

  const user = (
    await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)
  )[0];
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }

  const reference = genId("UPI");
  const orderId = `quikkk_${reference}`;

  try {
    const order = await cfCreateOrder({
      orderId,
      amount: amt,
      customer: {
        customer_id: `user_${userId}`,
        customer_name: user.name ?? undefined,
        customer_email: user.email ?? undefined,
        customer_phone: user.phone?.replace(/\D/g, "").slice(-10) ?? "9999999999",
      },
      returnUrl: `${PUBLIC_BASE_URL}/payments?ref=${reference}`,
      notifyUrl: `${PUBLIC_BASE_URL}/api/payments/webhook`,
    });

    const payMethod = method ?? "upi_collect";
    const qrString =
      payMethod === "upi_qr"
        ? buildUpiQrString({
            payeeVpa: MERCHANT_VPA,
            payeeName: MERCHANT_NAME,
            amount: amt,
            txnRef: reference,
            note: `Quikkk ${purpose} ${reference}`,
          })
        : null;

    await db.insert(upiTransactionsTable).values({
      userId,
      applicationId: applicationId ?? null,
      reference,
      cfOrderId: order.order_id,
      amount: amt.toFixed(2),
      currency: "INR",
      purpose,
      status: "created",
      method: payMethod,
      upiId: upiId ?? null,
      paymentSessionId: order.payment_session_id ?? null,
      paymentLink: order.payment_link ?? null,
      upiQrString: qrString,
      mdrBucket: mdrBucketFor(amt),
    });

    res.json({
      reference,
      orderId: order.order_id,
      paymentSessionId: order.payment_session_id ?? null,
      paymentLink: order.payment_link ?? null,
      qrString,
      amount: amt,
    });
  } catch (err) {
    logger.error({ err, userId }, "cfCreateOrder failed");
    res.status(502).json({ error: "provider_error", message: (err as Error).message });
  }
});

router.get("/payments/order/:reference", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const userId = (req as AuthedReq).userId;
  const reference = req.params["reference"]!;

  const row = (
    await db
      .select()
      .from(upiTransactionsTable)
      .where(
        and(
          eq(upiTransactionsTable.reference, reference),
          eq(upiTransactionsTable.userId, userId),
        ),
      )
      .limit(1)
  )[0];
  if (!row) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  if (!row.cfOrderId) {
    res.json(row);
    return;
  }

  // Sync with provider.
  try {
    const details = await cfGetOrder(row.cfOrderId);
    const paid = details.order_status === "PAID";
    const failed =
      details.order_status === "EXPIRED" || details.order_status === "CANCELLED";
    const status = paid ? "success" : failed ? "failed" : "pending";
    const firstPayment = details.payments?.[0];
    await db
      .update(upiTransactionsTable)
      .set({
        status,
        cfPaymentId: firstPayment?.cf_payment_id
          ? String(firstPayment.cf_payment_id)
          : row.cfPaymentId,
        upiId:
          firstPayment?.payment_method?.upi?.upi_id ?? row.upiId,
        paidAt: paid ? new Date() : row.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(upiTransactionsTable.id, row.id));
    const updated = (
      await db
        .select()
        .from(upiTransactionsTable)
        .where(eq(upiTransactionsTable.id, row.id))
        .limit(1)
    )[0];
    res.json(updated);
  } catch (err) {
    logger.error({ err, reference }, "cfGetOrder failed");
    res.json(row); // fall back to stored state
  }
});

router.post("/payments/vpa/verify", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const { vpa } = req.body as { vpa?: string };
  if (!vpa || !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(vpa)) {
    res.status(400).json({ error: "invalid_upi_id" });
    return;
  }
  try {
    const result = await cfVerifyVpa(vpa);
    res.json(result);
  } catch (err) {
    logger.error({ err, vpa }, "cfVerifyVpa failed");
    res.status(502).json({ error: "provider_error", message: (err as Error).message });
  }
});

router.get("/payments/history", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthedReq).userId;
  const rows = await db
    .select()
    .from(upiTransactionsTable)
    .where(eq(upiTransactionsTable.userId, userId))
    .orderBy(desc(upiTransactionsTable.createdAt))
    .limit(100);
  res.json(rows);
});

/* ---------------- Customer: UPI Autopay (recurring EMI) ---------------- */

const VALID_FREQUENCIES = new Set([
  "ON_DEMAND",
  "DAILY",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "YEARLY",
]);

router.post("/payments/autopay/setup", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const userId = (req as AuthedReq).userId;
  const {
    applicationId,
    amount,
    maxAmount,
    frequency,
    totalDebits,
    startDate,
    upiId,
  } = req.body as {
    applicationId?: string;
    amount?: number;
    maxAmount?: number;
    frequency?: string;
    totalDebits?: number;
    startDate?: string;
    upiId?: string;
  };

  const amt = Number(amount);
  const max = Number(maxAmount ?? amount);
  const debits = Number(totalDebits);
  if (!Number.isFinite(amt) || amt < 1 || amt > 15000) {
    // RBI: UPI Autopay per-debit limit without additional factor auth is ₹15,000
    res.status(400).json({ error: "invalid_amount", message: "EMI amount must be between ₹1 and ₹15,000 for UPI Autopay." });
    return;
  }
  if (!Number.isFinite(max) || max < amt) {
    res.status(400).json({ error: "invalid_max_amount" });
    return;
  }
  if (!frequency || !VALID_FREQUENCIES.has(frequency)) {
    res.status(400).json({ error: "invalid_frequency" });
    return;
  }
  if (!Number.isInteger(debits) || debits < 1 || debits > 360) {
    res.status(400).json({ error: "invalid_total_debits" });
    return;
  }

  const user = (
    await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)
  )[0];
  if (!user) {
    res.status(404).json({ error: "user_not_found" });
    return;
  }

  const reference = genId("AMD");
  const subscriptionId = `quikkk_${reference}`;
  const start = startDate ?? new Date().toISOString().slice(0, 10);

  try {
    const sub = await cfCreateSubscription({
      subscriptionId,
      customer: {
        customer_id: `user_${userId}`,
        customer_name: user.name ?? undefined,
        customer_email: user.email ?? undefined,
        customer_phone: user.phone?.replace(/\D/g, "").slice(-10) ?? "9999999999",
      },
      amount: amt,
      maxAmount: max,
      frequency: frequency as CfMandateFrequency,
      totalDebits: debits,
      startDate: start,
      returnUrl: `${PUBLIC_BASE_URL}/payments/autopay?ref=${reference}`,
      notifyUrl: `${PUBLIC_BASE_URL}/api/payments/webhook`,
    });

    await db.insert(upiAutopayMandatesTable).values({
      userId,
      applicationId: applicationId ?? null,
      reference,
      cfSubscriptionId: sub.subscription_id,
      amount: amt.toFixed(2),
      maxAmount: max.toFixed(2),
      frequency,
      totalDebits: debits,
      status: "pending_auth",
      upiId: upiId ?? null,
      authLink: sub.auth_link ?? null,
      startDate: new Date(start),
    });

    res.json({
      reference,
      subscriptionId: sub.subscription_id,
      authLink: sub.auth_link ?? null,
      amount: amt,
      frequency,
      totalDebits: debits,
    });
  } catch (err) {
    logger.error({ err, userId }, "cfCreateSubscription failed");
    res.status(502).json({ error: "provider_error", message: (err as Error).message });
  }
});

router.get("/payments/autopay", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthedReq).userId;
  const rows = await db
    .select()
    .from(upiAutopayMandatesTable)
    .where(eq(upiAutopayMandatesTable.userId, userId))
    .orderBy(desc(upiAutopayMandatesTable.createdAt))
    .limit(100);
  res.json(rows);
});

router.post("/payments/autopay/:reference/cancel", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const userId = (req as AuthedReq).userId;
  const reference = req.params["reference"]!;
  const row = (
    await db
      .select()
      .from(upiAutopayMandatesTable)
      .where(
        and(
          eq(upiAutopayMandatesTable.reference, reference),
          eq(upiAutopayMandatesTable.userId, userId),
        ),
      )
      .limit(1)
  )[0];
  if (!row) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  try {
    if (row.cfSubscriptionId) await cfCancelSubscription(row.cfSubscriptionId);
  } catch (err) {
    logger.error({ err, reference }, "cfCancelSubscription failed");
  }
  await db
    .update(upiAutopayMandatesTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(upiAutopayMandatesTable.id, row.id));
  res.json({ ok: true });
});

router.post("/payments/autopay/:reference/pause", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const userId = (req as AuthedReq).userId;
  const reference = req.params["reference"]!;
  const row = (
    await db
      .select()
      .from(upiAutopayMandatesTable)
      .where(
        and(
          eq(upiAutopayMandatesTable.reference, reference),
          eq(upiAutopayMandatesTable.userId, userId),
        ),
      )
      .limit(1)
  )[0];
  if (!row) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  try {
    if (row.cfSubscriptionId) await cfPauseSubscription(row.cfSubscriptionId);
  } catch (err) {
    logger.error({ err, reference }, "cfPauseSubscription failed");
  }
  await db
    .update(upiAutopayMandatesTable)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(upiAutopayMandatesTable.id, row.id));
  res.json({ ok: true });
});

/* ---------------- Webhook (public, HMAC-verified) ---------------- */

router.post("/payments/webhook", async (req: Request, res: Response): Promise<void> => {
  const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? "";
  const signature = req.headers["x-webhook-signature"] as string | undefined;
  const timestamp = req.headers["x-webhook-timestamp"] as string | undefined;

  if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
    logger.warn("Cashfree webhook signature mismatch");
    res.status(401).json({ error: "bad_signature" });
    return;
  }

  const event = req.body as {
    type?: string;
    event?: string;
    data?: Record<string, unknown>;
  };
  const eventType = event.type ?? event.event ?? "";
  const data = (event.data ?? {}) as Record<string, unknown>;

  try {
    await handleCashfreeEvent(eventType, data);
  } catch (err) {
    logger.error({ err, eventType }, "webhook handler failed");
    // Return 200 so Cashfree doesn't retry a poison event forever;
    // the failure is logged for manual reconciliation.
  }
  res.json({ ok: true });
});

async function handleCashfreeEvent(
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  const orderId = data["order_id"] as string | undefined;
  const subscriptionId = data["subscription_id"] as string | undefined;

  if (orderId) {
    const row = (
      await db
        .select()
        .from(upiTransactionsTable)
        .where(eq(upiTransactionsTable.cfOrderId, orderId))
        .limit(1)
    )[0];
    if (row) {
      const payment = (data["payment"] ?? {}) as Record<string, unknown>;
      const status = String(data["order_status"] ?? data["payment_status"] ?? "");
      const success =
        eventType.includes("SUCCESS") || status === "PAID" || status === "SUCCESS";
      const failed =
        eventType.includes("FAILED") ||
        status === "FAILED" ||
        status === "CANCELLED" ||
        status === "EXPIRED";
      await db
        .update(upiTransactionsTable)
        .set({
          status: success ? "success" : failed ? "failed" : "pending",
          cfPaymentId:
            (payment["cf_payment_id"] as string | undefined) ?? row.cfPaymentId,
          webhookPayload: data,
          paidAt: success ? new Date() : row.paidAt,
          updatedAt: new Date(),
        })
        .where(eq(upiTransactionsTable.id, row.id));
      logger.info({ reference: row.reference, status: success ? "success" : "other" }, "UPI payment webhook");
      return;
    }
  }

  if (subscriptionId) {
    const row = (
      await db
        .select()
        .from(upiAutopayMandatesTable)
        .where(eq(upiAutopayMandatesTable.cfSubscriptionId, subscriptionId))
        .limit(1)
    )[0];
    if (row) {
      let status = row.status;
      if (eventType.includes("SUBSCRIPTION_AUTHORIZED")) status = "active";
      else if (eventType.includes("SUBSCRIPTION_CANCELLED")) status = "cancelled";
      else if (eventType.includes("SUBSCRIPTION_PAUSED")) status = "paused";
      else if (eventType.includes("SUBSCRIPTION_EXPIRED")) status = "expired";
      else if (eventType.includes("SUBSCRIPTION_PAYMENT_SUCCESS")) {
        await db
          .update(upiAutopayMandatesTable)
          .set({
            debitsExecuted: row.debitsExecuted + 1,
            lastDebitAt: new Date(),
            lastDebitStatus: "success",
            webhookPayload: data,
            updatedAt: new Date(),
          })
          .where(eq(upiAutopayMandatesTable.id, row.id));
        logger.info({ reference: row.reference }, "Autopay debit success");
        return;
      } else if (eventType.includes("SUBSCRIPTION_PAYMENT_FAILED")) {
        await db
          .update(upiAutopayMandatesTable)
          .set({
            lastDebitAt: new Date(),
            lastDebitStatus: "failed",
            failureReason: (data["error"] as string | undefined) ?? null,
            webhookPayload: data,
            updatedAt: new Date(),
          })
          .where(eq(upiAutopayMandatesTable.id, row.id));
        logger.warn({ reference: row.reference }, "Autopay debit failed");
        return;
      }
      await db
        .update(upiAutopayMandatesTable)
        .set({ status, webhookPayload: data, updatedAt: new Date() })
        .where(eq(upiAutopayMandatesTable.id, row.id));
      logger.info({ reference: row.reference, status }, "Autopay webhook");
    }
  }
}

/* ---------------- Admin ---------------- */

router.get("/admin/payments", requireRole("admin"), async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(upiTransactionsTable)
    .orderBy(desc(upiTransactionsTable.createdAt))
    .limit(200);
  res.json(rows);
});

router.get("/admin/payments/autopay", requireRole("admin"), async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(upiAutopayMandatesTable)
    .orderBy(desc(upiAutopayMandatesTable.createdAt))
    .limit(200);
  res.json(rows);
});

router.post("/admin/payments/order/:reference/refund", requireRole("admin"), async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const reference = req.params["reference"]!;
  const { amount } = req.body as { amount?: number };
  const row = (
    await db
      .select()
      .from(upiTransactionsTable)
      .where(eq(upiTransactionsTable.reference, reference))
      .limit(1)
  )[0];
  if (!row || !row.cfOrderId) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const amt = Number(amount ?? row.amount);
  if (!Number.isFinite(amt) || amt <= 0 || amt > Number(row.amount)) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }
  try {
    const refund = await cfCreateRefund(row.cfOrderId, amt, genId("RFD"));
    await db
      .update(upiTransactionsTable)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(upiTransactionsTable.id, row.id));
    res.json(refund);
  } catch (err) {
    logger.error({ err, reference }, "cfCreateRefund failed");
    res.status(502).json({ error: "provider_error", message: (err as Error).message });
  }
});

router.post("/admin/payouts", requireRole("admin"), async (req: Request, res: Response): Promise<void> => {
  if (!requireCashfree(res)) return;
  const adminId = (req as AuthedReq).userId;
  const {
    userId,
    amount,
    mode,
    beneficiaryUpiId,
    beneficiaryAccount,
    beneficiaryIfsc,
    beneficiaryName,
    beneficiaryPhone,
    purpose,
    applicationId,
  } = req.body as {
    userId?: number;
    amount?: number;
    mode?: "upi" | "banktransfer";
    beneficiaryUpiId?: string;
    beneficiaryAccount?: string;
    beneficiaryIfsc?: string;
    beneficiaryName?: string;
    beneficiaryPhone?: string;
    purpose?: "disbursal" | "commission" | "refund";
    applicationId?: string;
  };

  const amt = Number(amount);
  if (!Number.isInteger(userId) || !Number.isFinite(amt) || amt < 1) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  if (mode === "upi" && !beneficiaryUpiId) {
    res.status(400).json({ error: "upi_id_required" });
    return;
  }
  if (mode === "banktransfer" && (!beneficiaryAccount || !beneficiaryIfsc)) {
    res.status(400).json({ error: "bank_details_required" });
    return;
  }
  if (!beneficiaryName || !beneficiaryPhone) {
    res.status(400).json({ error: "beneficiary_required" });
    return;
  }

  const reference = genId("PO");
  const transferId = `quikkk_${reference}`;
  try {
    const payout = await cfCreatePayout({
      transferId,
      amount: amt,
      mode: mode ?? "upi",
      upiId: beneficiaryUpiId,
      accountNumber: beneficiaryAccount,
      ifsc: beneficiaryIfsc,
      beneficiaryName,
      beneficiaryPhone,
      remarks: `Quikkk ${purpose ?? "payout"} ${reference}`,
    });
    await db.insert(upiPayoutsTable).values({
      userId,
      applicationId: applicationId ?? null,
      reference,
      cfTransferId: payout.transfer_id,
      amount: amt.toFixed(2),
      mode: mode ?? "upi",
      beneficiaryUpiId: beneficiaryUpiId ?? null,
      beneficiaryAccount: beneficiaryAccount ?? null,
      beneficiaryIfsc: beneficiaryIfsc ?? null,
      beneficiaryName,
      purpose: purpose ?? "disbursal",
      status: payout.status === "SUCCESS" ? "success" : "pending",
      utr: payout.utr ?? null,
      processedAt: payout.status === "SUCCESS" ? new Date() : null,
    });
    logger.info({ adminId, reference, amount: amt }, "payout initiated");
    res.json({ reference, transferId: payout.transfer_id, status: payout.status });
  } catch (err) {
    logger.error({ err, adminId }, "cfCreatePayout failed");
    res.status(502).json({ error: "provider_error", message: (err as Error).message });
  }
});

router.get("/admin/payouts", requireRole("admin"), async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(upiPayoutsTable)
    .orderBy(desc(upiPayoutsTable.createdAt))
    .limit(200);
  res.json(rows);
});

export default router;
