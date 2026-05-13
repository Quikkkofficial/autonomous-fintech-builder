import { Router, type IRouter } from "express";
import { db, loanApplicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../lib/session";
import { generateToken, getStatus, pushLead, LOAN_TYPE_TO_PRODUCT_ID } from "../lib/urbanmoney";

const router: IRouter = Router();

router.get("/um/status", requireRole("admin"), (_req, res) => {
  res.json(getStatus());
});

router.post("/um/token/refresh", requireRole("admin"), async (_req, res) => {
  try {
    await generateToken();
    res.json({ ok: true, status: getStatus() });
  } catch (err: unknown) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Token generation failed" });
  }
});

router.post("/um/push/:leadId", requireRole("admin"), async (req, res) => {
  const { leadId } = req.params;
  const lead = (await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, leadId)).limit(1))[0];
  if (!lead) return res.status(404).json({ error: "lead_not_found" });

  if (!lead.customerPhone) return res.status(400).json({ error: "lead_has_no_phone" });

  const result = await pushLead({
    internalLeadId: lead.id,
    customerName: lead.customerName ?? undefined,
    phoneNo: lead.customerPhone,
    loanType: lead.type,
    loanAmount: lead.amount ? Number(lead.amount) : undefined,
  });

  await db.update(loanApplicationsTable)
    .set({
      umLeadId: result.umLeadId ?? undefined,
      umStatus: result.success ? "pushed" : "failed",
      umPushedAt: new Date(),
    })
    .where(eq(loanApplicationsTable.id, leadId));

  res.json({ ok: result.success, ...result });
});

router.get("/um/products", requireRole("admin"), (_req, res) => {
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
