import { Router, type IRouter } from "express";
import { db, kycTable, usersTable, creditScoresTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitKycBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/session";
import { maskPan, maskAadhaar, maskAccount, bandFor, genId } from "../lib/utils";

const router: IRouter = Router();

router.get("/kyc", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const k = (await db.select().from(kycTable).where(eq(kycTable.userId, userId)).orderBy(desc(kycTable.createdAt)).limit(1))[0];
  if (!k) {
    res.json({ status: "pending" });
    return;
  }
  res.json({
    status: k.status,
    fullName: k.fullName ?? undefined,
    panMasked: k.pan ? maskPan(k.pan) : undefined,
    aadhaarMasked: k.aadhaar ? maskAadhaar(k.aadhaar) : undefined,
    dob: k.dob ?? undefined,
    address: k.address ?? undefined,
    bankAccountMasked: k.bankAccount ? maskAccount(k.bankAccount) : undefined,
    ifsc: k.ifsc ?? undefined,
    monthlyIncome: k.monthlyIncome ? Number(k.monthlyIncome) : undefined,
    employmentType: k.employmentType ?? undefined,
    verifiedAt: k.verifiedAt ? k.verifiedAt.toISOString() : undefined,
  });
});

router.post("/kyc", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const parsed = SubmitKycBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
    return;
  }
  const v = parsed.data;
  const existing = (await db.select().from(kycTable).where(eq(kycTable.userId, userId)).limit(1))[0];
  const verifiedAt = new Date();
  if (existing) {
    await db.update(kycTable).set({
      status: "verified",
      fullName: v.fullName,
      pan: v.pan,
      aadhaar: v.aadhaar,
      dob: v.dob,
      address: v.address,
      bankAccount: v.bankAccount,
      ifsc: v.ifsc,
      monthlyIncome: String(v.monthlyIncome),
      employmentType: v.employmentType,
      verifiedAt,
    }).where(eq(kycTable.id, existing.id));
  } else {
    await db.insert(kycTable).values({
      userId,
      status: "verified",
      fullName: v.fullName,
      pan: v.pan,
      aadhaar: v.aadhaar,
      dob: v.dob,
      address: v.address,
      bankAccount: v.bankAccount,
      ifsc: v.ifsc,
      monthlyIncome: String(v.monthlyIncome),
      employmentType: v.employmentType,
      verifiedAt,
    });
  }
  await db.update(usersTable).set({
    kycStatus: "verified",
    name: v.fullName,
    panMasked: maskPan(v.pan),
  }).where(eq(usersTable.id, userId));

  // Generate a credit score on first KYC if none exists
  const existingScore = (await db.select().from(creditScoresTable).where(eq(creditScoresTable.userId, userId)).limit(1))[0];
  if (!existingScore) {
    const baseIncome = v.monthlyIncome;
    const score = Math.min(820, Math.max(620, Math.round(700 + (baseIncome / 1000) * 0.3 + Math.random() * 60 - 20)));
    const band = bandFor(score);
    const factors = [
      { label: "On-time bill payments", impact: "positive", detail: "Consistent payments over the last 12 months" },
      { label: "Credit utilization", impact: score > 720 ? "positive" : "neutral", detail: "Below 30% of available limit" },
      { label: "Length of credit history", impact: "neutral", detail: "Average account age 4 years" },
      { label: "Recent credit inquiries", impact: score < 700 ? "negative" : "neutral", detail: "2 inquiries in the last 6 months" },
      { label: "Credit mix", impact: "positive", detail: "Healthy mix of secured and unsecured credit" },
    ];
    await db.insert(creditScoresTable).values({ userId, score, bureau: "CIBIL", band, factors });
  }

  await db.insert(notificationsTable).values({
    id: genId("ntf"),
    userId,
    channel: "sms",
    title: "KYC verified",
    message: `Hi ${v.fullName.split(" ")[0]}, your KYC has been verified successfully. You can now apply for loans and credit cards.`,
  });
  await db.insert(notificationsTable).values({
    id: genId("ntf"),
    userId,
    channel: "email",
    title: "Welcome to Quikkk",
    message: "Your account is fully active. Explore offers from 12+ partner banks and NBFCs.",
  });

  const k = (await db.select().from(kycTable).where(eq(kycTable.userId, userId)).orderBy(desc(kycTable.createdAt)).limit(1))[0]!;
  res.json({
    status: k.status,
    fullName: k.fullName ?? undefined,
    panMasked: k.pan ? maskPan(k.pan) : undefined,
    aadhaarMasked: k.aadhaar ? maskAadhaar(k.aadhaar) : undefined,
    dob: k.dob ?? undefined,
    address: k.address ?? undefined,
    bankAccountMasked: k.bankAccount ? maskAccount(k.bankAccount) : undefined,
    ifsc: k.ifsc ?? undefined,
    monthlyIncome: k.monthlyIncome ? Number(k.monthlyIncome) : undefined,
    employmentType: k.employmentType ?? undefined,
    verifiedAt: k.verifiedAt ? k.verifiedAt.toISOString() : undefined,
  });
});

export default router;
