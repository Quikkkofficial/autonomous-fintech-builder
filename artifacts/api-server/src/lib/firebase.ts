/**
 * Firebase Admin — verifies phone-OTP ID tokens minted by the Firebase
 * client SDK. We never touch SMS ourselves; Google handles delivery + DLT.
 *
 * Env vars (server-side only):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  — the PEM string; literal "\n" sequences are
 *                           converted to real newlines.
 *
 * If the vars are missing, verification throws a clear error so the
 * /api/auth/session route can return 503 instead of crashing.
 */
import { logger } from "./logger";

export interface VerifiedFirebaseToken {
  uid: string;
  phoneNumber: string | null;
}

type AdminApp = {
  auth: () => {
    verifyIdToken: (idToken: string) => Promise<{ uid: string; phone_number?: string }>;
  };
};

let cachedApp: AdminApp | null = null;
let warnedMissing = false;

async function getAdminApp(): Promise<AdminApp> {
  if (cachedApp) return cachedApp;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin not configured (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)",
    );
  }
  // Lazy import so the server boots without firebase-admin installed/configured.
  const admin = (await import("firebase-admin")) as unknown as {
    apps: unknown[];
    initializeApp: (opts: unknown) => void;
    credential: { cert: (c: unknown) => unknown };
    auth: () => AdminApp["auth"];
  };
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  cachedApp = { auth: () => admin.auth() };
  return cachedApp;
}

/** Verify a Firebase ID token from the client; returns uid + phone_number. */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<VerifiedFirebaseToken> {
  if (!idToken || typeof idToken !== "string" || idToken.length > 4096) {
    throw new Error("invalid_id_token");
  }
  let app: AdminApp;
  try {
    app = await getAdminApp();
  } catch (err) {
    if (!warnedMissing) {
      warnedMissing = true;
      logger.warn("Firebase Admin not configured — phone OTP login unavailable");
    }
    throw err;
  }
  const decoded = await app.auth().verifyIdToken(idToken);
  if (!decoded.phone_number) {
    throw new Error("phone_number_missing");
  }
  return { uid: decoded.uid, phoneNumber: decoded.phone_number };
}
