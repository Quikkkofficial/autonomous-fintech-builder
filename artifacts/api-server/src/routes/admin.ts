import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  loanApplicationsTable,
  cardApplicationsTable,
  lendersTable,
  notificationsTable,
  partnerPayoutsTable,
  collectionFollowupsTable,
} from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { requireRole } from "../lib/session";
import { genId } from "../lib/utils";

const router: IRouter = Router();
router.use("/admin", requireRole("admin"));

router.get("/admin/stats", async (_req, res) => {
  const [users, customers, partners, collectors, loanApps, cardApps] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ c: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "customer")),
    db.select({ c: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "sales_partner")),
    db.select({ c: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "collection_partner")),
    db.select().from(loanApplicationsTable),
    db.select({ c: sql<number>`count(*)::int` }).from(cardApplicationsTable),
  ]);
  const disbursed = loanApps.filter((a) => a.status === "disbursed");
  const approved = loanApps.filter((a) => a.status === "approved" || a.status === "disbursed");
  const overdue = loanApps.filter((a) => (a.dpd ?? 0) > 0);
  const totalDisbursedAmt = disbursed.reduce((s, a) => s + Number(a.amount), 0);
  const totalOutstanding = overdue.reduce((s, a) => s + Number(a.outstandingAmount ?? a.amount), 0);
  res.json({
    users: { total: users[0]!.c, customers: customers[0]!.c, salesPartners: partners[0]!.c, collectionPartners: collectors[0]!.c },
    loans: {
      total: loanApps.length,
      submitted: loanApps.filter((a) => a.status === "submitted").length,
      approved: approved.length,
      rejected: loanApps.filter((a) => a.status === "rejected").length,
      disbursed: disbursed.length,
      totalDisbursedAmt,
    },
    cards: { total: cardApps[0]!.c },
    collections: { overdueCount: overdue.length, outstandingAmt: totalOutstanding },
    statusBreakdown: ["submitted", "under_review", "approved", "disbursed", "rejected"].map((s) => ({
      status: s,
      count: loanApps.filter((a) => a.status === s).length,
    })),
  });
});

router.get("/admin/users", async (req, res) => {
  const role = (req.query["role"] as string) || undefined;
  const search = (req.query["q"] as string) || undefined;
  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  let rows;
  if (conditions.length > 0) {
    rows = await db.select().from(usersTable).where(and(...conditions)).orderBy(desc(usersTable.createdAt)).limit(200);
  } else {
    rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(200);
  }
  let filtered = rows;
  if (search) {
    const s = search.toLowerCase();
    filtered = rows.filter(
      (u) =>
        u.phone.toLowerCase().includes(s) ||
        (u.name ?? "").toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s) ||
        (u.partnerCode ?? "").toLowerCase().includes(s),
    );
  }
  res.json(filtered.map((u) => ({
    id: u.id,
    phone: u.phone,
    name: u.name,
    email: u.email,
    role: u.role,
    partnerCode: u.partnerCode,
    kycStatus: u.kycStatus,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.patch("/admin/users/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_id" });
  const { role, name, email, partnerCode } = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (role) update["role"] = role;
  if (name !== undefined) update["name"] = name;
  if (email !== undefined) update["email"] = email;
  if (partnerCode !== undefined) update["partnerCode"] = partnerCode;
  const updated = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
  res.json(updated[0]);
});

router.get("/admin/applications", async (req, res) => {
  const status = (req.query["status"] as string) || undefined;
  const rows = status
    ? await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.status, status)).orderBy(desc(loanApplicationsTable.createdAt)).limit(300)
    : await db.select().from(loanApplicationsTable).orderBy(desc(loanApplicationsTable.createdAt)).limit(300);
  res.json(rows);
});

router.patch("/admin/applications/:id", async (req, res) => {
  const id = req.params["id"];
  const { status, note } = req.body ?? {};
  if (!status) return res.status(400).json({ error: "status_required" });
  const existing = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, id!)).limit(1))[0];
  if (!existing) return res.status(404).json({ error: "not_found" });
  const history = [...(existing.statusHistory ?? []), { status, at: new Date().toISOString(), note: note || `Status changed to ${status} by admin` }];
  const update: Record<string, unknown> = { status, statusHistory: history };
  if (status === "disbursed") {
    update["outstandingAmount"] = existing.amount;
    update["expectedDisbursalAt"] = new Date();
    if (existing.referredByPartnerId && !existing.commissionAmount) {
      const commission = (Number(existing.amount) * 0.012).toFixed(2);
      update["commissionAmount"] = commission;
      await db.insert(partnerPayoutsTable).values({
        partnerId: existing.referredByPartnerId,
        applicationId: existing.id,
        amount: commission,
        status: "pending",
      });
    }
  }
  const updated = await db.update(loanApplicationsTable).set(update).where(eq(loanApplicationsTable.id, id!)).returning();
  await db.insert(notificationsTable).values({
    id: genId("NOTIF"),
    userId: existing.userId,
    channel: "system",
    title: `Application ${status}`,
    message: `Your loan application ${id} status: ${status}.`,
  });
  res.json(updated[0]);
});

router.get("/admin/lenders", async (_req, res) => {
  const rows = await db.select().from(lendersTable);
  res.json(rows);
});

router.patch("/admin/lenders/:id", async (req, res) => {
  const id = req.params["id"];
  const update = req.body ?? {};
  const allowed = ["name", "tagline", "minRate", "maxRate", "minAmount", "maxAmount", "processingFeePct", "minIncome", "minCreditScore", "approvalHours", "rating"];
  const safe: Record<string, unknown> = {};
  for (const k of allowed) if (update[k] !== undefined) safe[k] = update[k];
  const updated = await db.update(lendersTable).set(safe).where(eq(lendersTable.id, id!)).returning();
  res.json(updated[0]);
});

router.get("/admin/payouts", async (_req, res) => {
  const payouts = await db.select().from(partnerPayoutsTable).orderBy(desc(partnerPayoutsTable.createdAt)).limit(200);
  res.json(payouts);
});

router.patch("/admin/payouts/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const { status } = req.body ?? {};
  const update: Record<string, unknown> = { status };
  if (status === "paid") update["paidAt"] = new Date();
  const updated = await db.update(partnerPayoutsTable).set(update).where(eq(partnerPayoutsTable.id, id)).returning();
  res.json(updated[0]);
});

router.get("/admin/collections", async (_req, res) => {
  const overdue = await db.select().from(loanApplicationsTable)
    .where(sql`${loanApplicationsTable.dpd} > 0`)
    .orderBy(desc(loanApplicationsTable.dpd)).limit(200);
  res.json(overdue);
});

router.get("/admin/recent-activity", async (_req, res) => {
  const recentNotifs = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)).limit(20);
  res.json(recentNotifs);
});

router.get("/admin/timeseries", async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const apps = await db.select().from(loanApplicationsTable).where(gte(loanApplicationsTable.createdAt, since));
  const buckets: Record<string, { date: string; count: number; amount: number }> = {};
  for (const a of apps) {
    const d = a.createdAt.toISOString().slice(0, 10);
    buckets[d] ??= { date: d, count: 0, amount: 0 };
    buckets[d].count += 1;
    buckets[d].amount += Number(a.amount);
  }
  const out: Array<{ date: string; count: number; amount: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
    out.push(buckets[d] ?? { date: d, count: 0, amount: 0 });
  }
  res.json(out);
});

router.get("/admin/followups", async (_req, res) => {
  const rows = await db.select().from(collectionFollowupsTable).orderBy(desc(collectionFollowupsTable.createdAt)).limit(100);
  res.json(rows);
});

export default router;
