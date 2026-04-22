import { Router, type IRouter } from "express";
import { db, creditScoresTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { bandFor } from "../lib/utils";

const router: IRouter = Router();

router.get("/credit-score", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const s = (await db.select().from(creditScoresTable).where(eq(creditScoresTable.userId, userId)).orderBy(desc(creditScoresTable.asOf)).limit(1))[0];
  if (!s) {
    res.status(404).json({ error: "complete_kyc_to_fetch_score" });
    return;
  }
  res.json({
    score: s.score,
    bureau: s.bureau,
    asOf: s.asOf.toISOString(),
    band: bandFor(s.score),
    factors: s.factors,
  });
});

export default router;
