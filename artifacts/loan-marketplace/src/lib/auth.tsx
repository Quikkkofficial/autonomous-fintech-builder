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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const me = await api<AuthUser>("/me");
      setUser(me);
    } catch (e: any) {
      // 401 = not signed in; anything else is a real error
      if (e?.status === 401 || /401/.test(String(e?.message))) {
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
