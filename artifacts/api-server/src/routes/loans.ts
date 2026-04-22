import { Router, type IRouter } from "express";
import { db, lendersTable, loanApplicationsTable, creditScoresTable, kycTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { MatchLoansBody, CreateLoanApplicationBody, GetLoanApplicationParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/session";
import { calcEmi, round2, genId } from "../lib/utils";

const router: IRouter = Router();

router.post("/loans/match", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const parsed = MatchLoansBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { type, amount, tenureMonths } = parsed.data;
  const score = (await db.select().from(creditScoresTable).where(eq(creditScoresTable.userId, userId)).orderBy(desc(creditScoresTable.asOf)).limit(1))[0];
  const userScore = score?.score ?? 700;
  const k = (await db.select().from(kycTable).where(eq(kycTable.userId, userId)).limit(1))[0];
  const userIncome = k?.monthlyIncome ? Number(k.monthlyIncome) : 50000;

  const lenders = await db.select().from(lendersTable);
  const offers = lenders
    .filter((l) =>
      (l.supportedTypes as string[]).includes(type) &&
      amount >= Number(l.minAmount) &&
      amount <= Number(l.maxAmount) &&
      tenureMonths >= l.minTenureMonths &&
      tenureMonths <= l.maxTenureMonths &&
      userIncome >= Number(l.minIncome) &&
      userScore >= l.minCreditScore - 30,
    )
    .map((l) => {
      const minR = Number(l.minRate);
      const maxR = Number(l.maxRate);
      const scoreAdv = Math.max(0, Math.min(1, (userScore - l.minCreditScore) / 100));
      const interestRate = round2(maxR - (maxR - minR) * scoreAdv);
      const emi = round2(calcEmi(amount, interestRate, tenureMonths));
      const processingFee = round2(amount * (Number(l.processingFeePct) / 100));
      const totalPayable = round2(emi * tenureMonths + processingFee);
      const matchScore = Math.min(100, Math.round(60 + scoreAdv * 35 + (Number(l.rating) - 4) * 10));
      return {
        lenderId: l.id,
        lenderName: l.name,
        lenderType: l.type,
        amount,
        tenureMonths,
        interestRate,
        emi,
        processingFee,
        totalPayable,
        matchScore,
        preApproved: userScore >= l.minCreditScore + 20 && userIncome >= Number(l.minIncome) * 1.5,
        approvalHours: l.approvalHours,
        rating: Number(l.rating),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.interestRate - b.interestRate);

  res.json(offers);
});

router.get("/loan-applications", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const apps = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.userId, userId)).orderBy(desc(loanApplicationsTable.createdAt));
  res.json(apps.map(serializeApp));
});

router.post("/loan-applications", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const parsed = CreateLoanApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { lenderId, type, amount, tenureMonths, purpose } = parsed.data;
  const lender = (await db.select().from(lendersTable).where(eq(lendersTable.id, lenderId)).limit(1))[0];
  if (!lender) {
    res.status(404).json({ error: "lender_not_found" });
    return;
  }
  const score = (await db.select().from(creditScoresTable).where(eq(creditScoresTable.userId, userId)).orderBy(desc(creditScoresTable.asOf)).limit(1))[0];
  const userScore = score?.score ?? 700;
  const minR = Number(lender.minRate);
  const maxR = Number(lender.maxRate);
  const scoreAdv = Math.max(0, Math.min(1, (userScore - lender.minCreditScore) / 100));
  const interestRate = round2(maxR - (maxR - minR) * scoreAdv);
  const emi = round2(calcEmi(amount, interestRate, tenureMonths));
  const id = genId("LN");
  const refCode = `CB${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();
  const expectedDisbursal = new Date(now.getTime() + lender.approvalHours * 60 * 60 * 1000);
  const history = [
    { status: "submitted", at: now.toISOString(), note: "Application received by CreditBridge" },
    { status: "under_review", at: new Date(now.getTime() + 60_000).toISOString(), note: `Forwarded to ${lender.name} underwriting` },
  ];
  await db.insert(loanApplicationsTable).values({
    id,
    userId,
    lenderId: lender.id,
    lenderName: lender.name,
    type,
    amount: String(amount),
    tenureMonths,
    interestRate: String(interestRate),
    emi: String(emi),
    purpose: purpose ?? null,
    status: "under_review",
    referenceCode: refCode,
    expectedDisbursalAt: expectedDisbursal,
    statusHistory: history,
  });
  await db.insert(notificationsTable).values({
    id: genId("ntf"),
    userId,
    channel: "whatsapp",
    title: "Loan application submitted",
    message: `Your ${type} loan application of ₹${amount.toLocaleString("en-IN")} with ${lender.name} is under review. Reference: ${refCode}.`,
  });
  const created = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, id)).limit(1))[0]!;
  res.json(serializeApp(created));
});

router.get("/loan-applications/:id", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const params = GetLoanApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }
  const app = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, params.data.id)).limit(1))[0];
  if (!app || app.userId !== userId) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(serializeApp(app));
});

function serializeApp(a: typeof loanApplicationsTable.$inferSelect) {
  return {
    id: a.id,
    lenderId: a.lenderId,
    lenderName: a.lenderName,
    type: a.type,
    amount: Number(a.amount),
    tenureMonths: a.tenureMonths,
    interestRate: Number(a.interestRate),
    emi: Number(a.emi),
    purpose: a.purpose ?? undefined,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    expectedDisbursalAt: a.expectedDisbursalAt ? a.expectedDisbursalAt.toISOString() : undefined,
    referenceCode: a.referenceCode ?? undefined,
    statusHistory: a.statusHistory,
  };
}

export default router;
