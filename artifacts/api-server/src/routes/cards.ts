import { Router, type IRouter } from "express";
import { db, creditCardsTable, cardApplicationsTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCardApplicationBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/session";
import { genId } from "../lib/utils";

const router: IRouter = Router();

router.get("/credit-cards", async (_req, res) => {
  const cards = await db.select().from(creditCardsTable);
  res.json(cards.map((c) => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    network: c.network,
    category: c.category ?? undefined,
    annualFee: Number(c.annualFee),
    joiningFee: Number(c.joiningFee),
    rewardsRate: c.rewardsRate,
    minIncome: Number(c.minIncome),
    minCreditScore: c.minCreditScore,
    perks: c.perks,
    color: c.color,
  })));
});

router.get("/credit-card-applications", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const apps = await db.select().from(cardApplicationsTable).where(eq(cardApplicationsTable.userId, userId)).orderBy(desc(cardApplicationsTable.createdAt));
  res.json(apps.map((a) => ({
    id: a.id,
    cardId: a.cardId,
    cardName: a.cardName,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    referenceCode: a.referenceCode ?? undefined,
  })));
});

router.post("/credit-card-applications", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const parsed = CreateCardApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const card = (await db.select().from(creditCardsTable).where(eq(creditCardsTable.id, parsed.data.cardId)).limit(1))[0];
  if (!card) {
    res.status(404).json({ error: "card_not_found" });
    return;
  }
  const id = genId("CC");
  const refCode = `CB${Date.now().toString(36).toUpperCase()}`;
  await db.insert(cardApplicationsTable).values({
    id,
    userId,
    cardId: card.id,
    cardName: card.name,
    status: "under_review",
    referenceCode: refCode,
  });
  await db.insert(notificationsTable).values({
    id: genId("ntf"),
    userId,
    channel: "app",
    title: "Credit card application received",
    message: `Your application for ${card.name} is under review. Reference: ${refCode}.`,
  });
  const a = (await db.select().from(cardApplicationsTable).where(eq(cardApplicationsTable.id, id)).limit(1))[0]!;
  res.json({
    id: a.id,
    cardId: a.cardId,
    cardName: a.cardName,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    referenceCode: a.referenceCode ?? undefined,
  });
});

export default router;
