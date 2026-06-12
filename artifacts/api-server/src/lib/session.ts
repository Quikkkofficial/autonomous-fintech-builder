import { getAuth, createClerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const clerkBackend = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function getOrProvisionDbUser(
  req: Request,
): Promise<{ id: number; role: string } | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return null;

  const existing = (
    await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUserId))
      .limit(1)
  )[0];
  if (existing) return existing;

  try {
    const clerkUser = await clerkBackend.users.getUser(clerkUserId);
    const email =
      clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const name =
      [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ") || null;
    const phone =
      clerkUser.phoneNumbers[0]?.phoneNumber ?? null;

    const inserted = await db
      .insert(usersTable)
      .values({ clerkId: clerkUserId, phone, email, name })
      .returning({ id: usersTable.id, role: usersTable.role });
    return inserted[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const dbUser = await getOrProvisionDbUser(req);
  if (!dbUser) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  (req as unknown as { userId: number }).userId = dbUser.id;
  next();
}

export function requireRole(...allowed: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const dbUser = await getOrProvisionDbUser(req);
    if (!dbUser) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!allowed.includes(dbUser.role)) {
      res
        .status(403)
        .json({ error: "forbidden", required: allowed, have: dbUser.role });
      return;
    }
    (req as unknown as { userId: number }).userId = dbUser.id;
    (req as unknown as { userRole: string }).userRole = dbUser.role;
    next();
  };
}
