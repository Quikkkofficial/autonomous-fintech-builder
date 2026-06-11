import { Router, type IRouter } from "express";
import { db, loanApplicationsTable, lenderIntegrationsTable, leadDispatchesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireRole } from "../lib/session";
import { generateToken, getStatus, pushLead, LOAN_TYPE_TO_PRODUCT_ID } from "../lib/urbanmoney";

const router: IRouter = Router();

router.get("/um/status", requireRole("admin"), (_req, res): void => {
  res.json(getStatus());
});

router.post("/um/token/refresh", requireRole("admin"), async (_req, res): Promise<void> => {
  try {
    await generateToken();
    res.json({ ok: true, status: getStatus() });
  } catch (err: unknown) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Token generation failed" });
  }
});

router.post("/um/push/:leadId", requireRole("admin"), async (req, res): Promise<void> => {
  const leadId = String(req.params["leadId"] ?? "");
  if (!leadId) { res.status(400).json({ error: "missing_lead_id" }); return; }

  const lead = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, leadId)).limit(1))[0];
  if (!lead) { res.status(404).json({ error: "lead_not_found" }); return; }
  if (!lead.customerPhone) { res.status(400).json({ error: "lead_has_no_phone" }); return; }

  const result = await pushLead({
    internalLeadId: lead.id,
    customerName: lead.customerName ?? undefined,
    phoneNo: lead.customerPhone,
    loanType: lead.type,
    loanAmount: lead.amount ? Number(lead.amount) : undefined,
  });

  const now = new Date();
  await db.update(loanApplicationsTable)
    .set({
      umLeadId: result.umLeadId ?? undefined,
      umStatus: result.success ? "pushed" : "failed",
      umPushedAt: now,
    })
    .where(eq(loanApplicationsTable.id, leadId));

  const umIntg = (await db.select().from(lenderIntegrationsTable).where(eq(lenderIntegrationsTable.slug, "urbanmoney")).limit(1))[0];
  if (umIntg) {
    const dispatchStatus = result.success ? "accepted" : "error";
    await db.insert(leadDispatchesTable).values({
      leadId,
      integrationId: umIntg.id,
      integrationName: umIntg.name,
      status: dispatchStatus,
      externalId: result.umLeadId ?? null,
      responseMessage: result.message ?? (result.success ? "Lead accepted by Urban Money" : "Push failed"),
      dispatchedAt: now,
      updatedAt: now,
    });
    if (result.success) {
      await db.update(lenderIntegrationsTable).set({
        totalSent: sql`${lenderIntegrationsTable.totalSent} + 1`,
        totalAccepted: sql`${lenderIntegrationsTable.totalAccepted} + 1`,
      }).where(eq(lenderIntegrationsTable.id, umIntg.id));
    } else {
      await db.update(lenderIntegrationsTable).set({
        totalSent: sql`${lenderIntegrationsTable.totalSent} + 1`,
        totalRejected: sql`${lenderIntegrationsTable.totalRejected} + 1`,
      }).where(eq(lenderIntegrationsTable.id, umIntg.id));
    }
  }

  res.json({ ok: result.success, ...result });
});

router.get("/um/products", requireRole("admin"), (_req, res): void => {
  const products = [
    { name: "Personal Loan", productId: 2, loanTypes: ["personal", "education", "gold", "fd", "mutual_fund", "insurance"] },
    { name: "Home Loan", productId: 1, loanTypes: ["home"] },
    { name: "Business Loan", productId: 4, loanTypes: ["business"] },
    { name: "Car Loan", productId: 9, loanTypes: ["auto"] },
    { name: "Loan Against Property", productId: 3, loanTypes: [] },
  ];
  res.json({ products, mapping: LOAN_TYPE_TO_PRODUCT_ID });
});

export default router;
