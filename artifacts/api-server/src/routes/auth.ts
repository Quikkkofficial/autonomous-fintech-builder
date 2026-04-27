import { Router, type IRouter } from "express";
import { db, usersTable, otpsTable } from "@workspace/db";
import { eq, and, desc, gt } from "drizzle-orm";
import { SendOtpBody, VerifyOtpBody } from "@workspace/api-zod";
import { setSession, clearSession } from "../lib/session";

const router: IRouter = Router();

router.post("/auth/otp/send", async (req, res) => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { phone } = parsed.data;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.insert(otpsTable).values({ phone, code, expiresAt });
  req.log.info({ phone, code }, "Issued demo OTP");
  res.json({ sent: true, devOtp: code });
});

router.post("/auth/otp/verify", async (req, res) => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { phone, otp } = parsed.data;
  const now = new Date();
  const matches = await db
    .select()
    .from(otpsTable)
    .where(and(eq(otpsTable.phone, phone), eq(otpsTable.code, otp), gt(otpsTable.expiresAt, now)))
    .orderBy(desc(otpsTable.createdAt))
    .limit(1);
  if (matches.length === 0) {
    res.status(401).json({ error: "invalid_otp" });
    return;
  }
  let user = (await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1))[0];
  if (!user) {
    user = (await db.insert(usersTable).values({ phone }).returning())[0]!;
  }
  setSession(res, user.id);
  res.json({
    id: String(user.id),
    phone: user.phone,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    kycStatus: user.kycStatus,
    panMasked: user.panMasked ?? undefined,
    role: user.role,
    partnerCode: user.partnerCode ?? undefined,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
