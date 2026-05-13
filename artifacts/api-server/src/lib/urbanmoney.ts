import { logger } from "./logger";

const UM_BASE = "https://umapi-uat.urbanmoney.com/tpapi/v1";
const CLIENT_ID = "2aee44bcb4630f5b";
const CLIENT_SECRET = "7297eb7e7624b787f077fc1c8f02484b";

export const LOAN_TYPE_TO_PRODUCT_ID: Record<string, number> = {
  personal: 2,
  home: 1,
  business: 4,
  auto: 9,
  education: 2,
  gold: 2,
  fd: 2,
  mutual_fund: 2,
  insurance: 2,
};

type TokenState = {
  token: string;
  expiresAt: number;
  generatedAt: number;
};

type PushRecord = {
  leadId: string;
  umLeadId: string | null;
  status: "success" | "error";
  message: string;
  at: number;
};

let tokenState: TokenState | null = null;
const recentPushes: PushRecord[] = [];
let totalPushed = 0;
let totalSuccess = 0;
let totalError = 0;
let lastError: string | null = null;
let serverIp: string | null = null;

async function detectIp() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const b = await r.json() as { ip: string };
    serverIp = b.ip;
  } catch {
    serverIp = null;
  }
}
detectIp();

export async function generateToken(): Promise<string> {
  const res = await fetch(`${UM_BASE}/generateToken`, {
    method: "POST",
    headers: {
      "client-id": CLIENT_ID,
      "client-secret": CLIENT_SECRET,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const msg = (body.message as string) ?? `HTTP ${res.status}`;
    lastError = msg;
    throw new Error(msg);
  }
  lastError = null;
  const token = body.access_token as string;
  const now = Date.now();
  tokenState = {
    token,
    expiresAt: now + 9 * 60 * 1000,
    generatedAt: now,
  };
  logger.info("UrbanMoney: token generated, valid until %s", new Date(tokenState.expiresAt).toISOString());
  return token;
}

async function getToken(): Promise<string> {
  if (tokenState && Date.now() < tokenState.expiresAt) {
    return tokenState.token;
  }
  return generateToken();
}

export type PushLeadInput = {
  internalLeadId: string;
  customerName?: string;
  phoneNo: string;
  loanType: string;
  loanAmount?: number;
  monthlyIncome?: number;
  creditScore?: number;
  remarks?: string;
};

export type PushLeadResult = {
  success: boolean;
  umLeadId: string | null;
  message: string;
};

export async function pushLead(input: PushLeadInput): Promise<PushLeadResult> {
  const productId = LOAN_TYPE_TO_PRODUCT_ID[input.loanType] ?? 2;
  const phone = input.phoneNo.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) {
    const rec: PushRecord = { leadId: input.internalLeadId, umLeadId: null, status: "error", message: "Invalid phone number (not 10 digits)", at: Date.now() };
    recordPush(rec);
    return { success: false, umLeadId: null, message: rec.message };
  }

  let token: string;
  try {
    token = await getToken();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Token generation failed";
    const rec: PushRecord = { leadId: input.internalLeadId, umLeadId: null, status: "error", message: `Token error: ${msg}`, at: Date.now() };
    recordPush(rec);
    return { success: false, umLeadId: null, message: rec.message };
  }

  const payload: Record<string, unknown> = {
    countryCode: "+91",
    phoneNo: phone,
    productId,
  };
  if (input.customerName) payload.customerName = input.customerName;
  if (input.loanAmount) payload.loanAmount = input.loanAmount;
  if (input.monthlyIncome) payload.monthlyIncome = input.monthlyIncome;
  if (input.creditScore) payload.creditScore = input.creditScore;

  const remarkParts: string[] = [];
  if (input.loanType && !["personal", "home", "business", "auto"].includes(input.loanType)) {
    remarkParts.push(`loanType:${input.loanType}`);
  }
  if (input.remarks) remarkParts.push(input.remarks);
  if (remarkParts.length) payload.remarks = remarkParts.join("|");

  try {
    const res = await fetch(`${UM_BASE}/lead/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json() as Record<string, unknown>;
    if (res.ok) {
      const umLeadId = (body.leadId as string) ?? null;
      const rec: PushRecord = { leadId: input.internalLeadId, umLeadId, status: "success", message: (body.message as string) ?? "Lead accepted", at: Date.now() };
      recordPush(rec);
      logger.info({ internalLeadId: input.internalLeadId, umLeadId }, "UrbanMoney: lead pushed successfully");
      return { success: true, umLeadId, message: rec.message };
    } else {
      if (res.status === 401) {
        tokenState = null;
      }
      const msg = (body.message as string) ?? `HTTP ${res.status}`;
      const rec: PushRecord = { leadId: input.internalLeadId, umLeadId: null, status: "error", message: msg, at: Date.now() };
      recordPush(rec);
      logger.warn({ internalLeadId: input.internalLeadId, status: res.status, msg }, "UrbanMoney: lead push failed");
      return { success: false, umLeadId: null, message: msg };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    const rec: PushRecord = { leadId: input.internalLeadId, umLeadId: null, status: "error", message: msg, at: Date.now() };
    recordPush(rec);
    return { success: false, umLeadId: null, message: msg };
  }
}

function recordPush(rec: PushRecord) {
  recentPushes.unshift(rec);
  if (recentPushes.length > 50) recentPushes.pop();
  totalPushed += 1;
  if (rec.status === "success") totalSuccess += 1;
  else totalError += 1;
}

export function getStatus() {
  const now = Date.now();
  const tokenValid = tokenState !== null && now < tokenState.expiresAt;
  const tokenTtlMs = tokenState ? Math.max(0, tokenState.expiresAt - now) : 0;
  const ipBlocked = lastError?.toLowerCase().includes("ip") && lastError?.toLowerCase().includes("not allowed");
  return {
    tokenValid,
    tokenTtlMs,
    tokenTtlSec: Math.floor(tokenTtlMs / 1000),
    tokenGeneratedAt: tokenState?.generatedAt ?? null,
    tokenExpiresAt: tokenState?.expiresAt ?? null,
    lastError,
    ipBlocked: ipBlocked ?? false,
    serverIp,
    stats: { totalPushed, totalSuccess, totalError },
    recentPushes: recentPushes.slice(0, 20),
    endpoint: `${UM_BASE}/lead/create`,
    clientId: CLIENT_ID,
  };
}
