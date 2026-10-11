/**
 * OTP utilities — free email/phone OTP without any vendor.
 *
 * Security rules:
 * - Codes are 6 digits from crypto.randomInt (CSPRNG).
 * - ONLY the sha256 hash is stored in the DB — never the plaintext code.
 * - Codes expire after 10 minutes.
 * - Max 5 verification attempts per OTP, then it is invalidated.
 * - Comparison uses timingSafeEqual to avoid timing attacks.
 */
import { randomInt, createHash, timingSafeEqual } from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

/** Constant-time comparison of a candidate code against a stored hash. */
export function verifyOtpHash(candidate: string, storedHash: string): boolean {
  const candidateHash = hashOtp(candidate);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}
