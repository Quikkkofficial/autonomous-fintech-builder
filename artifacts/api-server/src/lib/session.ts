import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-do-not-use-in-prod";
const COOKIE_NAME = "cb_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${sig}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  try {
    if (
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

export function setSession(res: Response, userId: number): void {
  const signed = sign(String(userId));
  res.cookie(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function getUserId(req: Request): number | null {
  const raw = (req as unknown as { cookies?: Record<string, string> }).cookies?.[COOKIE_NAME];
  if (!raw) return null;
  const value = verify(raw);
  if (!value) return null;
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  (req as unknown as { userId: number }).userId = userId;
  next();
}
