import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import type { User as BaseUser } from "@workspace/api-client-react";

export type AuthUser = BaseUser & {
  role?: "customer" | "admin" | "sales_partner" | "collection_partner";
  partnerCode?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  signOut: async () => {},
  refresh: async () => {},
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// How long we wait for /me before giving up and treating the visitor as
// signed out. Without this, a stalled request leaves isLoading true forever
// and protected routes spin indefinitely.
const AUTH_CHECK_TIMEOUT_MS = 5000;

// Session cookies the backend sets. If none is present the visitor cannot
// be authenticated, so we skip the /me network call entirely and redirect
// immediately instead of waiting on it.
const SESSION_COOKIE_NAMES = ["quikkk_session", "quikkk_demo"];

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  const names = document.cookie.split(";").map((c) => c.trim().split("=")[0]);
  return SESSION_COOKIE_NAMES.some((n) => names.includes(n));
}

async function fetchMeWithTimeout(): Promise<AuthUser> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_CHECK_TIMEOUT_MS);
  try {
    return await api<AuthUser>("/me", { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Fast path: no session cookie => definitely signed out. Skip the /me
    // call so unauthenticated users redirect instantly and can never hang.
    if (!hasSessionCookie()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await fetchMeWithTimeout();
      setUser(me);
    } catch (e: any) {
      // AbortError = /me timed out. Fail closed: treat as signed out so the
      // guard redirects to /sign-in instead of spinning forever.
      if (e?.name === "AbortError" || /abort/i.test(String(e?.message))) {
        setUser(null);
      } else if (e?.status === 401 || /401/.test(String(e?.message))) {
        // 401 = not signed in; anything else is a real error
        setUser(null);
      } else {
        setError(e instanceof Error ? e : new Error(String(e)));
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // logout best-effort; still clear local state
    }
    queryClient.clear();
    setUser(null);
    setLocation(`${basePath}/` || "/");
  }, [queryClient, setLocation]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
