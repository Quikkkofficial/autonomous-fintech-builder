/**
 * Email sender via Brevo REST API (free tier: 300 emails/day).
 *
 * Env vars (server-side only, never exposed to the client):
 *   BREVO_API_KEY      — from Brevo dashboard → SMTP & API → API Keys
 *   BREVO_SENDER_EMAIL — a verified sender, e.g. noreply@quikkk.com
 *   BREVO_SENDER_NAME  — optional, defaults to "Quikkk"
 *
 * If BREVO_API_KEY is not set, sending is skipped with a logged warning
 * (so the app boots in dev without email configured).
 */
import { logger } from "./logger";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    logger.warn(
      { to: opts.to, subject: opts.subject },
      "BREVO_API_KEY or BREVO_SENDER_EMAIL not set — skipping email send",
    );
    return false;
  }

  const senderName = process.env.BREVO_SENDER_NAME ?? "Quikkk";
  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error(
        { status: res.status, body: body.slice(0, 500), to: opts.to },
        "Brevo email send failed",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to }, "Brevo email send threw");
    return false;
  }
}

export function otpEmailHtml(code: string): string {
  const safe = escapeHtml(code);
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#141414;">
<h2 style="margin:0 0 8px;">Your Quikkk verification code</h2>
<p style="color:#6B7280;">Use this code to verify your email. It expires in 10 minutes.</p>
<div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 24px;text-align:center;margin:24px 0;">${safe}</div>
<p style="color:#6B7280;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
</body></html>`;
}
