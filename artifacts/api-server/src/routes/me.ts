import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1))[0];
  if (!user) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({
    id: String(user.id),
    phone: user.phone,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    kycStatus: user.kycStatus,
    panMasked: user.panMasked ?? undefined,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
