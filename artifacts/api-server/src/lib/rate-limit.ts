/**
 * Rate limiting for auth endpoints — DB-backed (serverless-safe).
 *
 * Limits:
 * - OTP sends: ≤3 per identifier (phone/email) per hour
 * - OTP verify attempts: ≤5 per OTP row (enforced in routes/auth.ts via `attempts`)
 * - OTP sends per IP: ≤10 per hour (tracked via a lightweight in-memory
 *   window as a best-effort extra; the per-identifier DB limit is the
 *   authoritative one)
 */
import { db, otpsTable } from "@workspace/db";
import { and, eq, gte } from "drizzle-orm";

export const OTP_SENDS_PER_IDENTIFIER_PER_HOUR = 3;
export const OTP_SENDS_PER_IP_PER_HOUR = 10;

/** DB-backed: how many OTPs were created for this identifier+purpose in the last hour. */
export async function countRecentOtpSends(
  identifier: string,
  purpose: string,
): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db
    .select({ id: otpsTable.id })
    .from(otpsTable)
    .where(
      and(
        eq(otpsTable.identifier, identifier),
        eq(otpsTable.purpose, purpose),
        gte(otpsTable.createdAt, oneHourAgo),
      ),
    );
  return rows.length;
}

export async function isOtpSendAllowed(
  identifier: string,
  purpose: string,
): Promise<boolean> {
  const count = await countRecentOtpSends(identifier, purpose);
  return count < OTP_SENDS_PER_IDENTIFIER_PER_HOUR;
}

// Best-effort per-IP window (in-memory; resets on cold start — acceptable
// as a secondary throttle behind the DB-backed per-identifier limit).
const ipHits = new Map<string, number[]>();

export function isIpAllowed(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const hits = (ipHits.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= OTP_SENDS_PER_IP_PER_HOUR) {
    ipHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  // Opportunistic cleanup to bound memory.
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (v.every((t) => t <= windowStart)) ipHits.delete(k);
    }
  }
  return true;
}
