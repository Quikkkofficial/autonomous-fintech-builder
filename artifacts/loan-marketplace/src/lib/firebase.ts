import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase web config for Quikkk (project: quikkk-d0a52).
 * These values are public by design (they ship in client-side JS).
 * Env vars (VITE_FIREBASE_CONFIG or VITE_FIREBASE_*) override this default.
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAyuvjsZDQeiLTiHboOPyYL360I1d0_pYs",
  authDomain: "quikkk-d0a52.firebaseapp.com",
  projectId: "quikkk-d0a52",
  storageBucket: "quikkk-d0a52.firebasestorage.app",
  messagingSenderId: "806570646256",
  appId: "1:806570646256:web:f84b472e6a467a4ad88035",
};

function readConfig(): Record<string, string> | null {
  // Preferred: single JSON blob in VITE_FIREBASE_CONFIG
  const raw = import.meta.env.VITE_FIREBASE_CONFIG as string | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    } catch {
      // fall through to individual vars
    }
  }
  // Fallback: individual VITE_FIREBASE_* vars
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
      projectId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    };
  }
  // Built-in default: Quikkk Firebase project (public client config)
  return DEFAULT_FIREBASE_CONFIG;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/** Returns true when a Firebase web config is available (built-in default or env override). */
export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}

/** Lazily initialize Firebase. Throws with a friendly message if not configured. */
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Firebase is not configured. Set the VITE_FIREBASE_CONFIG environment variable " +
        "(Firebase console → Project settings → Your apps → Web app config)."
    );
  }
  app = getApps().length ? getApps()[0]! : initializeApp(config);
  auth = getAuth(app);
  return auth;
}
