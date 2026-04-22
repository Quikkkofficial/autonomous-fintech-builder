import { Router, type IRouter } from "express";
import { db, lendersTable } from "@workspace/db";
import { ListLendersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/lenders", async (req, res) => {
  const parsed = ListLendersQueryParams.safeParse(req.query);
  const filterType = parsed.success ? parsed.data.type : undefined;
  const all = await db.select().from(lendersTable);
  const filtered = filterType ? all.filter((l) => (l.supportedTypes as string[]).includes(filterType)) : all;
  res.json(filtered.map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    tagline: l.tagline ?? undefined,
    minRate: Number(l.minRate),
    maxRate: Number(l.maxRate),
    minAmount: Number(l.minAmount),
    maxAmount: Number(l.maxAmount),
    minTenureMonths: l.minTenureMonths,
    maxTenureMonths: l.maxTenureMonths,
    processingFeePct: Number(l.processingFeePct),
    minIncome: Number(l.minIncome),
    minCreditScore: l.minCreditScore,
    approvalHours: l.approvalHours,
    rating: Number(l.rating),
    supportedTypes: l.supportedTypes,
  })));
});

export default router;
