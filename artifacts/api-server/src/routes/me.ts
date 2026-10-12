import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  // Demo mode: return mock user without DB query
  if (userId >= 90001 && userId <= 90003) {
    const demoUsers: Record<number, any> = {
      90001: { id: "90001", phone: "9000000001", name: "Admin Demo", role: "admin" },
      90002: { id: "90002", phone: "9000000002", name: "Sales Partner Demo", role: "sales_partner", partnerCode: "QSP-00001" },
      90003: { id: "90003", phone: "9000000003", name: "Collection Demo", role: "collection_partner", partnerCode: "QCP-00001" },
    };
    const demo = demoUsers[userId];
    if (demo) {
      res.json({ ...demo, kycStatus: "verified", demo: true, createdAt: new Date().toISOString() });
      return;
    }
  }
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
    role: user.role,
    partnerCode: user.partnerCode ?? undefined,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/me/role", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const { role } = req.body ?? {};
  // SECURITY: Users cannot self-assign admin role. Only customer/partner roles allowed via self-service.
  // Admin role must be assigned by an existing admin via /admin/users/:id
  const validRoles = ["customer", "sales_partner", "collection_partner"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: "invalid_role" });
    return;
  }
  const update: Record<string, unknown> = { role };
  if ((role === "sales_partner" || role === "collection_partner")) {
    const existing = (await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1))[0];
    if (!existing?.partnerCode) {
      update["partnerCode"] = `${role === "sales_partner" ? "QSP" : "QCP"}-${userId.toString().padStart(5, "0")}`;
    }
  }
  const updated = await db.update(usersTable).set(update).where(eq(usersTable.id, userId)).returning();
  const u = updated[0]!;
  res.json({
    id: String(u.id),
    phone: u.phone,
    name: u.name ?? undefined,
    email: u.email ?? undefined,
    role: u.role,
    partnerCode: u.partnerCode ?? undefined,
    kycStatus: u.kycStatus,
    panMasked: u.panMasked ?? undefined,
    createdAt: u.createdAt.toISOString(),
  });
});

export default router;
