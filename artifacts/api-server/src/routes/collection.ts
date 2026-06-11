import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  loanApplicationsTable,
  collectionFollowupsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireRole } from "../lib/session";
import { genId } from "../lib/utils";

const router: IRouter = Router();
router.use("/collection", requireRole("collection_partner"));

router.get("/collection/stats", async (req, res): Promise<void> => {
  const collectorId = (req as unknown as { userId: number }).userId;
  const cases = await db.select().from(loanApplicationsTable)
    .where(sql`${loanApplicationsTable.dpd} > 0 AND (${loanApplicationsTable.assignedCollectorId} = ${collectorId} OR ${loanApplicationsTable.assignedCollectorId} IS NULL)`);
  const myCases = cases.filter((c) => c.assignedCollectorId === collectorId);
  const outstanding = myCases.reduce((s, c) => s + Number(c.outstandingAmount ?? c.amount) - Number(c.recoveredAmount ?? 0), 0);
  const recovered = myCases.reduce((s, c) => s + Number(c.recoveredAmount ?? 0), 0);
  const followups = await db.select({ c: sql<number>`count(*)::int` }).from(collectionFollowupsTable).where(eq(collectionFollowupsTable.collectorId, collectorId));
  res.json({
    cases: {
      assigned: myCases.length,
      unassigned: cases.length - myCases.length,
      bucket1to30: myCases.filter((c) => c.dpd > 0 && c.dpd <= 30).length,
      bucket31to60: myCases.filter((c) => c.dpd > 30 && c.dpd <= 60).length,
      bucket61to90: myCases.filter((c) => c.dpd > 60 && c.dpd <= 90).length,
      bucket90plus: myCases.filter((c) => c.dpd > 90).length,
    },
    money: { outstanding, recovered },
    followups: followups[0]?.c ?? 0,
  });
});

router.get("/collection/cases", async (req, res): Promise<void> => {
  const collectorId = (req as unknown as { userId: number }).userId;
  const filter = (req.query["filter"] as string) || "mine";
  let rows;
  if (filter === "unassigned") {
    rows = await db.select().from(loanApplicationsTable)
      .where(sql`${loanApplicationsTable.dpd} > 0 AND ${loanApplicationsTable.assignedCollectorId} IS NULL`)
      .orderBy(desc(loanApplicationsTable.dpd));
  } else if (filter === "all") {
    rows = await db.select().from(loanApplicationsTable)
      .where(sql`${loanApplicationsTable.dpd} > 0`)
      .orderBy(desc(loanApplicationsTable.dpd));
  } else {
    rows = await db.select().from(loanApplicationsTable)
      .where(sql`${loanApplicationsTable.dpd} > 0 AND ${loanApplicationsTable.assignedCollectorId} = ${collectorId}`)
      .orderBy(desc(loanApplicationsTable.dpd));
  }
  res.json(rows);
});

router.get("/collection/cases/:id", async (req, res): Promise<void> => {
  const id = req.params["id"]!;
  const cs = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, id)).limit(1))[0];
  if (!cs) { res.status(404).json({ error: "not_found" }); return; }
  const customer = (await db.select().from(usersTable).where(eq(usersTable.id, cs.userId)).limit(1))[0];
  const followups = await db.select().from(collectionFollowupsTable).where(eq(collectionFollowupsTable.applicationId, id)).orderBy(desc(collectionFollowupsTable.createdAt));
  res.json({
    ...cs,
    customer: customer ? { id: customer.id, name: customer.name ?? cs.customerName, phone: customer.phone, email: customer.email } : null,
    followups,
  });
});

router.post("/collection/cases/:id/assign", async (req, res): Promise<void> => {
  const collectorId = (req as unknown as { userId: number }).userId;
  const id = req.params["id"]!;
  const updated = await db.update(loanApplicationsTable).set({ assignedCollectorId: collectorId }).where(eq(loanApplicationsTable.id, id)).returning();
  res.json(updated[0]);
});

router.post("/collection/cases/:id/followup", async (req, res): Promise<void> => {
  const collectorId = (req as unknown as { userId: number }).userId;
  const id = req.params["id"]!;
  const { channel, outcome, notes, promisedAmount, promisedDate } = req.body ?? {};
  if (!channel || !outcome) { res.status(400).json({ error: "missing_fields" }); return; }
  const inserted = await db.insert(collectionFollowupsTable).values({
    applicationId: id,
    collectorId,
    channel,
    outcome,
    notes: notes ?? null,
    promisedAmount: promisedAmount ? String(promisedAmount) : null,
    promisedDate: promisedDate ?? null,
  }).returning();
  res.json(inserted[0]);
});

router.post("/collection/cases/:id/payment", async (req, res): Promise<void> => {
  const id = req.params["id"]!;
  const { amount } = req.body ?? {};
  if (!amount || Number(amount) <= 0) { res.status(400).json({ error: "invalid_amount" }); return; }
  const cs = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, id)).limit(1))[0];
  if (!cs) { res.status(404).json({ error: "not_found" }); return; }
  const newRecovered = (Number(cs.recoveredAmount ?? 0) + Number(amount)).toFixed(2);
  const outstanding = Number(cs.outstandingAmount ?? cs.amount);
  const newDpd = Number(newRecovered) >= outstanding ? 0 : cs.dpd;
  const updated = await db.update(loanApplicationsTable).set({
    recoveredAmount: newRecovered,
    dpd: newDpd,
  }).where(eq(loanApplicationsTable.id, id)).returning();
  await db.insert(notificationsTable).values({
    id: genId("NOTIF"),
    userId: cs.userId,
    channel: "system",
    title: "Payment received",
    message: `We've received ₹${Number(amount).toLocaleString("en-IN")} towards your loan ${id}. Thank you!`,
  });
  res.json(updated[0]);
});

router.get("/collection/followups", async (req, res): Promise<void> => {
  const collectorId = (req as unknown as { userId: number }).userId;
  const rows = await db.select().from(collectionFollowupsTable).where(eq(collectionFollowupsTable.collectorId, collectorId)).orderBy(desc(collectionFollowupsTable.createdAt)).limit(100);
  res.json(rows);
});

router.post("/collection/omni/send", async (req, res): Promise<void> => {
  const collectorId = (req as unknown as { userId: number }).userId;
  const { channel, caseId, message } = req.body ?? {};
  if (!channel || !message) { res.status(400).json({ error: "channel and message required" }); return; }
  const cases = caseId
    ? await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, caseId)).limit(1)
    : await db.select().from(loanApplicationsTable)
        .where(sql`${loanApplicationsTable.assignedCollectorId} = ${collectorId} AND ${loanApplicationsTable.dpd} > 0`)
        .limit(50);
  for (const c of cases) {
    await db.insert(notificationsTable).values({
      id: genId("NOTIF"),
      userId: c.userId,
      channel,
      title: "Collection follow-up",
      message,
    });
  }
  res.json({ ok: true, recipientCount: cases.length });
});

export default router;
