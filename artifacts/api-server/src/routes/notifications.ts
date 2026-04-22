import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const list = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId)).orderBy(desc(notificationsTable.createdAt));
  res.json(list.map((n) => ({
    id: n.id,
    channel: n.channel,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt.toISOString(),
    read: n.read,
  })));
});

export default router;
