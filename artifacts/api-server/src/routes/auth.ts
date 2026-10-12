/**
 * Free OTP + email auth routes (replaces Clerk).
 *
 *   POST /api/auth/session       — verify Firebase ID token → mint cookie session
 *   POST /api/auth/logout        — destroy session, clear cookie
 *   POST /api/auth/email/request — send 6-digit email OTP (Brevo)
 *   POST /api/auth/email/verify  — verify email OTP → mark emailVerifiedAt
 *
 * All responses use the same user JSON shape as GET /api/me.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, otpsTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  otpExpiryDate,
  OTP_MAX_ATTEMPTS,
} from "../lib/otp";
import { sendEmail, otpEmailHtml } from "../lib/mail";
import { verifyFirebaseIdToken } from "../lib/firebase";
import { isOtpSendAllowed, isIpAllowed } from "../lib/rate-limit";
import {
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "../lib/session";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type UserRow = typeof usersTable.$inferSelect;

function publicUser(u: UserRow) {
  return {
    id: String(u.id),
    phone: u.phone,
    name: u.name ?? undefined,
    email: u.email ?? undefined,
    kycStatus: u.kycStatus,
    panMasked: u.panMasked ?? undefined,
    role: u.role,
    partnerCode: u.partnerCode ?? undefined,
    emailVerified: Boolean(u.emailVerifiedAt),
    phoneVerified: Boolean(u.phoneVerifiedAt),
    createdAt: u.createdAt.toISOString(),
  };
}

function clientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  return raw?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || "unknown";
}

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  if (e.length < 5 || e.length > 200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
  return e;
}

/**
 * POST /api/auth/session
 * Body: { idToken } — Firebase ID token from client-side phone OTP flow.
 * Finds or creates the user by phone, links firebaseUid, mints a session cookie.
 */
router.post("/auth/session", async (req: Request, res: Response) => {
  const { idToken } = req.body ?? {};
  if (typeof idToken !== "string" || !idToken) {
    res.status(400).json({ error: "idToken_required" });
    return;
  }

  let verified;
  try {
    verified = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verify_failed";
    if (msg.includes("not configured")) {
      res.status(503).json({ error: "phone_auth_not_configured" });
      return;
    }
    logger.warn({ msg }, "Firebase ID token verification failed");
    res.status(401).json({ error: "invalid_id_token" });
    return;
  }

  const phone = verified.phoneNumber;
  if (!phone) {
    res.status(400).json({ error: "phone_number_required" });
    return;
  }
  const now = new Date();

  // Find-or-create user by phone.
  let user = (
    await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1)
  )[0];

  if (!user) {
    const name =
      typeof req.body?.name === "string" && req.body.name.trim()
        ? req.body.name.trim().slice(0, 200)
        : null;
    const inserted = await db
      .insert(usersTable)
      .values({
        phone,
        name,
        firebaseUid: verified.uid,
        phoneVerifiedAt: now,
      })
      .returning();
    user = inserted[0]!;
  } else if (!user.firebaseUid || !user.phoneVerifiedAt) {
    const updated = await db
      .update(usersTable)
      .set({ firebaseUid: user.firebaseUid ?? verified.uid, phoneVerifiedAt: user.phoneVerifiedAt ?? now })
      .where(eq(usersTable.id, user.id))
      .returning();
    user = updated[0]!;
  }

  const token = await createSession(user.id, {
    userAgent: req.headers["user-agent"],
    ip: clientIp(req),
  });
  setSessionCookie(res, token);
  res.json(publicUser(user));
});

/**
 * POST /api/auth/logout
 * Destroys the session and clears the cookie.
 */
router.post("/auth/logout", async (req: Request, res: Response) => {
  await destroySession(req.cookies?.[SESSION_COOKIE_NAME]);
  clearSessionCookie(res);
  res.json({ ok: true });
});

/**
 * POST /api/auth/demo-login
 * Demo mode: login as a demo user without Firebase (for testing/preview).
 * Only works for hardcoded demo phones: 9000000001 (admin), 9000000002 (partner), 9000000003 (collector).
 * Body: { phone } — must be one of the demo phones.
 */
router.post("/auth/demo-login", async (req: Request, res: Response) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const DEMO_CONFIG: Record<string, { name: string; role: string; partnerCode?: string; id: number }> = {
    "9000000001": { name: "Admin Demo", role: "admin", id: 90001 },
    "9000000002": { name: "Sales Partner Demo", role: "sales_partner", partnerCode: "QSP-00001", id: 90002 },
    "9000000003": { name: "Collection Demo", role: "collection_partner", partnerCode: "QCP-00001", id: 90003 },
  };
  const config = DEMO_CONFIG[phone];
  if (!config) {
    res.status(400).json({ error: "invalid_demo_phone" });
    return;
  }
  // Demo mode: use mock session without DB (for preview when DB is unavailable)
  // Create a simple signed token with demo user info
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("hex");
  const payload = JSON.stringify({ id: config.id, phone, role: config.role, demo: true, t: Date.now() });
  const signature = createHash("sha256").update(payload + token).digest("hex").slice(0, 16);
  const demoToken = Buffer.from(payload).toString("base64") + "." + token + "." + signature;
  
  res.cookie("quikkk_demo", demoToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  
  res.json({
    id: String(config.id),
    phone,
    name: config.name,
    role: config.role,
    partnerCode: config.partnerCode ?? undefined,
    demo: true,
  });
});

/**
 * POST /api/auth/email/request
 * Body: { email } — generates a 6-digit OTP, stores only its hash, sends via Brevo.
 */
router.post("/auth/email/request", async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }
  const ip = clientIp(req);
  if (!isIpAllowed(ip)) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }
  if (!(await isOtpSendAllowed(email, "email_verify"))) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }

  const code = generateOtp();
  await db.insert(otpsTable).values({
    identifier: email,
    channel: "email",
    purpose: "email_verify",
    codeHash: hashOtp(code),
    expiresAt: otpExpiryDate(),
  });

  // Never reveal whether the email belongs to an account (enumeration-safe).
  const sent = await sendEmail({
    to: email,
    subject: "Your Quikkk verification code",
    html: otpEmailHtml(code),
    text: `Your Quikkk verification code is ${code}. It expires in 10 minutes.`,
  });
  if (!sent) {
    logger.warn({ email }, "email OTP generated but not sent (Brevo not configured)");
  }
  res.json({ ok: true });
});

/**
 * POST /api/auth/email/verify
 * Body: { email, code } — verifies the OTP, marks emailVerifiedAt, links email to session user.
 */
router.post("/auth/email/verify", async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  // Latest unused, unexpired OTP for this identifier+purpose.
  const otp = (
    await db
      .select()
      .from(otpsTable)
      .where(
        and(
          eq(otpsTable.identifier, email),
          eq(otpsTable.purpose, "email_verify"),
          isNull(otpsTable.usedAt),
        ),
      )
      .orderBy(desc(otpsTable.createdAt))
      .limit(1)
  )[0];

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "code_expired" });
    return;
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ error: "too_many_attempts" });
    return;
  }
  if (!verifyOtpHash(code, otp.codeHash)) {
    await db
      .update(otpsTable)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpsTable.id, otp.id));
    res.status(400).json({ error: "invalid_code" });
    return;
  }

  await db
    .update(otpsTable)
    .set({ usedAt: new Date(), attempts: otp.attempts + 1 })
    .where(eq(otpsTable.id, otp.id));

  // Link the verified email to the logged-in user if there is one.
  const sessionToken: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionToken) {
    const { getSession } = await import("../lib/session");
    const session = await getSession(sessionToken);
    if (session) {
      await db
        .update(usersTable)
        .set({ email, emailVerifiedAt: new Date() })
        .where(eq(usersTable.id, session.userId));
    }
  }
  res.json({ ok: true, email });
});

export default router;
