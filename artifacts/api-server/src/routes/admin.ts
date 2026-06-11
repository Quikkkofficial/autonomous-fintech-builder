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
  lenderIntegrationsTable,
  leadDispatchesTable,
} from "@workspace/db";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";
import { requireRole } from "../lib/session";
import { genId } from "../lib/utils";

const router: IRouter = Router();
router.use("/admin", requireRole("admin"));

router.get("/admin/stats", async (_req, res): Promise<void> => {
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

router.get("/admin/users", async (req, res): Promise<void> => {
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

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  const { role, name, email, partnerCode } = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (role) update["role"] = role;
  if (name !== undefined) update["name"] = name;
  if (email !== undefined) update["email"] = email;
  if (partnerCode !== undefined) update["partnerCode"] = partnerCode;
  const updated = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
  res.json(updated[0]);
});

router.get("/admin/applications", async (req, res): Promise<void> => {
  const status = (req.query["status"] as string) || undefined;
  const rows = status
    ? await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.status, status)).orderBy(desc(loanApplicationsTable.createdAt)).limit(300)
    : await db.select().from(loanApplicationsTable).orderBy(desc(loanApplicationsTable.createdAt)).limit(300);
  res.json(rows);
});

router.patch("/admin/applications/:id", async (req, res): Promise<void> => {
  const id = req.params["id"];
  const { status, note } = req.body ?? {};
  if (!status) { res.status(400).json({ error: "status_required" }); return; }
  const existing = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, id!)).limit(1))[0];
  if (!existing) { res.status(404).json({ error: "not_found" }); return; }
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

router.get("/admin/lenders", async (_req, res): Promise<void> => {
  const rows = await db.select().from(lendersTable);
  res.json(rows);
});

router.patch("/admin/lenders/:id", async (req, res): Promise<void> => {
  const id = req.params["id"];
  const update = req.body ?? {};
  const allowed = ["name", "tagline", "minRate", "maxRate", "minAmount", "maxAmount", "processingFeePct", "minIncome", "minCreditScore", "approvalHours", "rating"];
  const safe: Record<string, unknown> = {};
  for (const k of allowed) if (update[k] !== undefined) safe[k] = update[k];
  const updated = await db.update(lendersTable).set(safe).where(eq(lendersTable.id, id!)).returning();
  res.json(updated[0]);
});

router.get("/admin/payouts", async (_req, res): Promise<void> => {
  const payouts = await db.select().from(partnerPayoutsTable).orderBy(desc(partnerPayoutsTable.createdAt)).limit(200);
  res.json(payouts);
});

router.patch("/admin/payouts/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { status } = req.body ?? {};
  const update: Record<string, unknown> = { status };
  if (status === "paid") update["paidAt"] = new Date();
  const updated = await db.update(partnerPayoutsTable).set(update).where(eq(partnerPayoutsTable.id, id)).returning();
  res.json(updated[0]);
});

router.get("/admin/collections", async (_req, res): Promise<void> => {
  const overdue = await db.select().from(loanApplicationsTable)
    .where(sql`${loanApplicationsTable.dpd} > 0`)
    .orderBy(desc(loanApplicationsTable.dpd)).limit(200);
  res.json(overdue);
});

router.get("/admin/recent-activity", async (_req, res): Promise<void> => {
  const recentNotifs = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)).limit(20);
  res.json(recentNotifs);
});

router.get("/admin/timeseries", async (_req, res): Promise<void> => {
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

router.get("/admin/followups", async (_req, res): Promise<void> => {
  const rows = await db.select().from(collectionFollowupsTable).orderBy(desc(collectionFollowupsTable.createdAt)).limit(100);
  res.json(rows);
});

// ── Lead Upload ──────────────────────────────────────────────────────────────

router.post("/admin/lead-upload/loan", async (req, res): Promise<void> => {
  const { customerName, customerPhone, loanType, amount, tenureMonths } = req.body ?? {};
  if (!customerName || !customerPhone || !loanType || !amount) {
    res.status(400).json({ error: "missing_fields" }); return;
  }
  const lenders = await db.select().from(lendersTable).limit(1);
  const lender = lenders[0];
  if (!lender) { res.status(500).json({ error: "no_lenders" }); return; }
  const rate = Number(lender.minRate);
  const tenure = Number(tenureMonths) || 36;
  const emi = (Number(amount) * (rate / 1200) * Math.pow(1 + rate / 1200, tenure)) / (Math.pow(1 + rate / 1200, tenure) - 1);
  const app = await db.insert(loanApplicationsTable).values({
    id: genId("APP"),
    userId: 1,
    lenderId: lender.id,
    lenderName: lender.name,
    type: loanType,
    amount: String(amount),
    tenureMonths: tenure,
    interestRate: String(lender.minRate),
    emi: String(Math.round(emi)),
    status: "submitted",
    customerName,
    customerPhone,
    statusHistory: [{ status: "submitted", at: new Date().toISOString(), note: "Lead uploaded by admin" }],
  }).returning();
  res.json({ ok: true, id: app[0]?.id });
});

router.post("/admin/lead-upload/collection", async (req, res): Promise<void> => {
  const { customerName, customerPhone, outstandingAmount, dpd, loanId } = req.body ?? {};
  if (!customerName || !customerPhone || !outstandingAmount) {
    res.status(400).json({ error: "missing_fields" }); return;
  }
  if (loanId) {
    const existing = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, loanId)).limit(1))[0];
    if (existing) {
      await db.update(loanApplicationsTable).set({
        dpd: Number(dpd) || 1,
        outstandingAmount: String(outstandingAmount),
        customerName,
        customerPhone,
      }).where(eq(loanApplicationsTable.id, loanId));
      res.json({ ok: true, id: loanId }); return;
    }
  }
  const lenders = await db.select().from(lendersTable).limit(1);
  const lender = lenders[0];
  if (!lender) { res.status(500).json({ error: "no_lenders" }); return; }
  const app = await db.insert(loanApplicationsTable).values({
    id: genId("APP"),
    userId: 1,
    lenderId: lender.id,
    lenderName: lender.name,
    type: "personal",
    amount: String(outstandingAmount),
    tenureMonths: 36,
    interestRate: String(lender.minRate),
    emi: "0",
    status: "disbursed",
    customerName,
    customerPhone,
    outstandingAmount: String(outstandingAmount),
    dpd: Number(dpd) || 0,
    statusHistory: [{ status: "disbursed", at: new Date().toISOString(), note: "Collection case imported by admin" }],
  }).returning();
  res.json({ ok: true, id: app[0]?.id });
});

// ── Omni-Channel ─────────────────────────────────────────────────────────────

router.post("/admin/omni/send", async (req, res): Promise<void> => {
  const { channel, audience, message, purpose } = req.body ?? {};
  if (!channel || !message) { res.status(400).json({ error: "channel and message required" }); return; }
  let users: { id: number }[] = [];
  if (audience === "all_customers" || audience === "all_leads") {
    users = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "customer")).limit(200);
  } else if (audience === "kyc_pending") {
    users = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.kycStatus, "pending")).limit(200);
  } else {
    const statusMap: Record<string, string> = { approved: "approved", disbursed: "disbursed", overdue_1_30: "disbursed", overdue_31_60: "disbursed", overdue_60_plus: "disbursed" };
    const status = statusMap[audience];
    if (status) {
      const apps = await db.select({ userId: loanApplicationsTable.userId }).from(loanApplicationsTable).where(eq(loanApplicationsTable.status, status)).limit(200);
      users = apps.map((a) => ({ id: a.userId }));
    }
  }
  const uniqueUserIds = [...new Set(users.map((u) => u.id))];
  for (const uid of uniqueUserIds.slice(0, 100)) {
    await db.insert(notificationsTable).values({
      id: genId("NOTIF"),
      userId: uid,
      channel,
      title: purpose === "collection" ? "Payment reminder" : "Loan offer update",
      message,
    });
  }
  res.json({ ok: true, recipientCount: uniqueUserIds.length });
});

// ── Lender Integrations ──────────────────────────────────────────────────────

router.get("/admin/integrations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(lenderIntegrationsTable).orderBy(lenderIntegrationsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, clientSecret: undefined })));
});

router.post("/admin/integrations", async (req, res): Promise<void> => {
  const { name, slug, apiType, apiEndpoint, clientId, clientSecret, notes, supportedTypes } = req.body ?? {};
  if (!name || !slug) { res.status(400).json({ error: "name and slug are required" }); return; }
  const existing = await db.select().from(lenderIntegrationsTable).where(eq(lenderIntegrationsTable.slug, slug)).limit(1);
  if (existing.length > 0) { res.status(409).json({ error: "slug_already_exists" }); return; }
  const row = await db.insert(lenderIntegrationsTable).values({
    id: genId("INTG"),
    name,
    slug,
    apiType: apiType ?? "custom",
    apiEndpoint: apiEndpoint || null,
    clientId: clientId || null,
    clientSecret: clientSecret || null,
    status: "inactive",
    supportedTypes: Array.isArray(supportedTypes) ? supportedTypes : [],
    notes: notes || null,
  }).returning();
  res.json({ ...row[0], clientSecret: undefined });
});

router.patch("/admin/integrations/:id", async (req, res): Promise<void> => {
  const id = req.params["id"];
  const allowed = ["name", "status", "apiEndpoint", "clientId", "clientSecret", "notes", "supportedTypes"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
  const row = await db.update(lenderIntegrationsTable).set(update).where(eq(lenderIntegrationsTable.id, id!)).returning();
  if (!row[0]) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ ...row[0], clientSecret: undefined });
});

router.delete("/admin/integrations/:id", async (req, res): Promise<void> => {
  const id = req.params["id"];
  const intg = (await db.select().from(lenderIntegrationsTable).where(eq(lenderIntegrationsTable.id, id!)).limit(1))[0];
  if (!intg) { res.status(404).json({ error: "not_found" }); return; }
  if (intg.slug === "urbanmoney") { res.status(400).json({ error: "cannot_delete_system_integration" }); return; }
  await db.delete(lenderIntegrationsTable).where(eq(lenderIntegrationsTable.id, id!));
  res.json({ ok: true });
});

router.post("/admin/integrations/:id/push-pending", async (req, res): Promise<void> => {
  const id = req.params["id"];
  const intg = (await db.select().from(lenderIntegrationsTable).where(eq(lenderIntegrationsTable.id, id!)).limit(1))[0];
  if (!intg) { res.status(404).json({ error: "not_found" }); return; }
  if (intg.status !== "active") { res.status(400).json({ error: "integration_not_active" }); return; }
  const dispatched = await db.select({ leadId: leadDispatchesTable.leadId }).from(leadDispatchesTable).where(eq(leadDispatchesTable.integrationId, id!));
  const dispatchedIds = dispatched.map((d) => d.leadId);
  const query = dispatchedIds.length > 0
    ? db.select().from(loanApplicationsTable).where(sql`${loanApplicationsTable.id} not in (${sql.join(dispatchedIds.map((i) => sql`${i}`), sql`, `)})`)
    : db.select().from(loanApplicationsTable);
  const leads = await query.limit(50);
  let pushed = 0;
  for (const lead of leads) {
    await db.insert(leadDispatchesTable).values({
      leadId: lead.id,
      integrationId: intg.id,
      integrationName: intg.name,
      status: "sent",
      responseMessage: "Dispatched via admin bulk push",
    });
    pushed++;
  }
  if (pushed > 0) {
    await db.update(lenderIntegrationsTable).set({ totalSent: sql`${lenderIntegrationsTable.totalSent} + ${pushed}` }).where(eq(lenderIntegrationsTable.id, id!));
  }
  res.json({ ok: true, pushed });
});

// ── Lead Dispatch Log ────────────────────────────────────────────────────────

router.get("/admin/dispatches", async (_req, res): Promise<void> => {
  const dispatches = await db.select().from(leadDispatchesTable).orderBy(desc(leadDispatchesTable.dispatchedAt)).limit(500);
  const leadIds = [...new Set(dispatches.map((d) => d.leadId))];
  let leads: Array<{
    id: string; customerName: string | null; customerPhone: string | null;
    type: string; amount: string; lenderName: string; referredByPartnerId: number | null;
  }> = [];
  if (leadIds.length > 0) {
    leads = (await db.select({
      id: loanApplicationsTable.id,
      customerName: loanApplicationsTable.customerName,
      customerPhone: loanApplicationsTable.customerPhone,
      type: loanApplicationsTable.type,
      amount: loanApplicationsTable.amount,
      lenderName: loanApplicationsTable.lenderName,
      referredByPartnerId: loanApplicationsTable.referredByPartnerId,
    }).from(loanApplicationsTable).where(inArray(loanApplicationsTable.id, leadIds))).map((l) => ({
      ...l,
      amount: String(l.amount),
    }));
  }
  const leadMap = Object.fromEntries(leads.map((l) => [l.id, l]));
  res.json(dispatches.map((d) => ({ ...d, lead: leadMap[d.leadId] ?? null })));
});

router.post("/admin/dispatches/repush/:leadId", async (req, res): Promise<void> => {
  const leadId = String(req.params["leadId"] ?? "");
  const lead = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, leadId)).limit(1))[0];
  if (!lead) { res.status(404).json({ error: "lead_not_found" }); return; }
  const activeIntgs = await db.select().from(lenderIntegrationsTable).where(eq(lenderIntegrationsTable.status, "active"));
  if (activeIntgs.length === 0) { res.status(400).json({ error: "no_active_integrations" }); return; }
  const now = new Date();
  for (const intg of activeIntgs) {
    await db.insert(leadDispatchesTable).values({
      leadId: lead.id,
      integrationId: intg.id,
      integrationName: intg.name,
      status: "sent",
      responseMessage: "Admin re-dispatch",
      dispatchedAt: now,
      updatedAt: now,
    });
    await db.update(lenderIntegrationsTable).set({ totalSent: sql`${lenderIntegrationsTable.totalSent} + 1` }).where(eq(lenderIntegrationsTable.id, intg.id));
  }
  res.json({ ok: true, dispatched: activeIntgs.length });
});

export default router;
