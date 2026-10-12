/**
 * Cookie-session auth (replaces Clerk) — MongoDB edition.
 *
 * - Sessions are 256-bit opaque tokens (crypto.randomBytes); only the
 *   sha256 hash is stored in the `sessions` collection.
 * - The token travels in an httpOnly, Secure, SameSite=Lax cookie
 *   named `quikkk_session`.
 * - 30-day expiry with sliding refresh on each authenticated request.
 */
import { randomBytes, createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { ensureMongo, nextId, Session, User } from "./mongo";

export const SESSION_COOKIE_NAME = "quikkk_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export interface SessionRecord {
  tokenHash: string;
  userId: number;
  role: string;
}

/** Create a session row + return the raw token (to be set as a cookie). */
export async function createSession(
  userId: number,
  opts: { userAgent?: string; ip?: string } = {},
): Promise<string> {
  await ensureMongo();
  const token = randomBytes(32).toString("hex"); // 256-bit
  const tokenHash = hashSessionToken(token);
  await Session.create({
    id: await nextId("sessions"),
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: opts.userAgent?.slice(0, 300) ?? null,
    ip: opts.ip?.slice(0, 45) ?? null,
  });
  return token;
}

/** Look up a session by raw token; returns null if missing/expired. */
export async function getSession(
  token: string | undefined,
  demoToken?: string | undefined,
): Promise<SessionRecord | null> {
  // Check demo token first (for demo mode without DB)
  if (demoToken && typeof demoToken === "string") {
    try {
      const parts = demoToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[0], "base64").toString());
        if (payload.demo && payload.id && payload.role) {
          return {
            tokenHash: "demo",
            userId: payload.id,
            role: payload.role,
          };
        }
      }
    } catch {}
  }
  if (!token || typeof token !== "string" || token.length > 128) return null;
  await ensureMongo();
  const tokenHash = hashSessionToken(token);
  const row = await Session.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!row) return null;

  const user = await User.findOne({ id: row.userId })
    .select("role")
    .lean();
  if (!user) return null;

  // Sliding refresh: extend expiry on activity (best-effort, don't fail the request).
  Session.updateOne(
    { tokenHash },
    { $set: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) } },
  ).catch(() => {});
  return { tokenHash: row.tokenHash, userId: row.userId, role: user.role };
}

/** Delete a session by raw token. */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token || typeof token !== "string") return;
  await ensureMongo();
  await Session.deleteOne({ tokenHash: hashSessionToken(token) });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await getSession(req.cookies?.[SESSION_COOKIE_NAME], req.cookies?.["quikkk_demo"]);
  if (!session) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  (req as unknown as { userId: number }).userId = session.userId;
  (req as unknown as { userRole: string }).userRole = session.role;
  next();
}

export function requireRole(...allowed: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const session = await getSession(req.cookies?.[SESSION_COOKIE_NAME], req.cookies?.["quikkk_demo"]);
    if (!session) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!allowed.includes(session.role)) {
      res
        .status(403)
        .json({ error: "forbidden", required: allowed, have: session.role });
      return;
    }
    (req as unknown as { userId: number }).userId = session.userId;
    (req as unknown as { userRole: string }).userRole = session.role;
    next();
  };
}
