import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

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
  return null;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/** Firebase web config is missing until the Vercel env var is set. */
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
