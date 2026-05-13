import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  loanApplicationsTable,
  lendersTable,
  partnerPayoutsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireRole } from "../lib/session";
import { genId, calcEmi } from "../lib/utils";
import { pushLead } from "../lib/urbanmoney";

const router: IRouter = Router();
router.use("/partner", requireRole("sales_partner"));

router.get("/partner/stats", async (req, res) => {
  const partnerId = (req as unknown as { userId: number }).userId;
  const leads = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.referredByPartnerId, partnerId));
  const payouts = await db.select().from(partnerPayoutsTable).where(eq(partnerPayoutsTable.partnerId, partnerId));
  const disbursed = leads.filter((l) => l.status === "disbursed");
  const totalDisbursedAmt = disbursed.reduce((s, l) => s + Number(l.amount), 0);
  const earned = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  res.json({
    leads: {
      total: leads.length,
      submitted: leads.filter((l) => l.status === "submitted").length,
      approved: leads.filter((l) => l.status === "approved").length,
      disbursed: disbursed.length,
      rejected: leads.filter((l) => l.status === "rejected").length,
    },
    earnings: { totalDisbursedAmt, paid: earned, pending, conversionPct: leads.length === 0 ? 0 : Math.round((disbursed.length / leads.length) * 100) },
  });
});

router.get("/partner/leads", async (req, res) => {
  const partnerId = (req as unknown as { userId: number }).userId;
  const rows = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.referredByPartnerId, partnerId)).orderBy(desc(loanApplicationsTable.createdAt));
  res.json(rows);
});

router.post("/partner/leads", async (req, res) => {
  const partnerId = (req as unknown as { userId: number }).userId;
  const { customerName, customerPhone, lenderId, loanType, amount, tenureMonths, purpose } = req.body ?? {};
  if (!customerName || !customerPhone || !lenderId || !loanType || !amount || !tenureMonths) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const lender = (await db.select().from(lendersTable).where(eq(lendersTable.id, lenderId)).limit(1))[0];
  if (!lender) return res.status(400).json({ error: "lender_not_found" });

  // Find or create user (customer)
  let customer = (await db.select().from(usersTable).where(eq(usersTable.phone, customerPhone)).limit(1))[0];
  if (!customer) {
    customer = (await db.insert(usersTable).values({
      phone: customerPhone,
      name: customerName,
      role: "customer",
    }).returning())[0]!;
  }
  const interestRate = Number(lender.minRate) + 1;
  const emi = calcEmi(Number(amount), interestRate, Number(tenureMonths)).toFixed(2);
  const id = genId("LOAN");
  const ref = genId("REF");
  const inserted = await db.insert(loanApplicationsTable).values({
    id,
    userId: customer.id,
    lenderId,
    lenderName: lender.name,
    type: loanType,
    amount: String(amount),
    tenureMonths: Number(tenureMonths),
    interestRate: String(interestRate),
    emi,
    purpose: purpose ?? null,
    status: "submitted",
    referenceCode: ref,
    statusHistory: [{ status: "submitted", at: new Date().toISOString(), note: `Lead created by partner` }],
    referredByPartnerId: partnerId,
    customerName,
    customerPhone,
  }).returning();
  await db.insert(notificationsTable).values({
    id: genId("NOTIF"),
    userId: customer.id,
    channel: "system",
    title: "New loan application created",
    message: `A loan application ${id} for ${lender.name} was created on your behalf by Quikkk channel partner.`,
  });

  const lead = inserted[0]!;

  pushLead({
    internalLeadId: lead.id,
    customerName: customerName,
    phoneNo: customerPhone,
    loanType: loanType,
    loanAmount: Number(amount),
    remarks: `Partner referred|${purpose ?? ""}`.replace(/\|$/, ""),
  }).then(async (umResult) => {
    await db.update(loanApplicationsTable)
      .set({
        umLeadId: umResult.umLeadId ?? undefined,
        umStatus: umResult.success ? "pushed" : "failed",
        umPushedAt: new Date(),
      })
      .where(eq(loanApplicationsTable.id, lead.id));
  }).catch(() => {});

  res.json(lead);
});

router.get("/partner/payouts", async (req, res) => {
  const partnerId = (req as unknown as { userId: number }).userId;
  const rows = await db.select().from(partnerPayoutsTable).where(eq(partnerPayoutsTable.partnerId, partnerId)).orderBy(desc(partnerPayoutsTable.createdAt));
  res.json(rows);
});

router.get("/partner/lenders", async (_req, res) => {
  const rows = await db.select().from(lendersTable);
  res.json(rows);
});

router.get("/partner/timeseries", async (req, res) => {
  const partnerId = (req as unknown as { userId: number }).userId;
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const apps = await db.select().from(loanApplicationsTable)
    .where(sql`${loanApplicationsTable.referredByPartnerId} = ${partnerId} AND ${loanApplicationsTable.createdAt} >= ${since}`);
  const buckets: Record<string, { date: string; count: number }> = {};
  for (const a of apps) {
    const d = a.createdAt.toISOString().slice(0, 10);
    buckets[d] ??= { date: d, count: 0 };
    buckets[d].count += 1;
  }
  const out: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
    out.push(buckets[d] ?? { date: d, count: 0 });
  }
  res.json(out);
});

export default router;
