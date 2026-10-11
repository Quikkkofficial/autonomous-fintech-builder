// Auth state for the mobile app.
// Flow: Firebase phone OTP → POST /api/auth/session with the Firebase ID token
// → backend returns a Quikkk session token → stored in SecureStore.

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthApi, Me, clearToken, getToken, setToken } from "../api/client";
import { getIdToken, signOutFirebase } from "./firebase";

interface AuthState {
  user: Me | null;
  loading: boolean;
  /** Complete sign-in after Firebase OTP confirmation: exchange ID token for session. */
  completeSignIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  completeSignIn: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await AuthApi.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completeSignIn = useCallback(async () => {
    const idToken = await getIdToken();
    const { token } = await AuthApi.session(idToken);
    await setToken(token);
    const me = await AuthApi.me();
    setUser(me);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch {
      // ignore — still clear local state
    }
    await clearToken();
    await signOutFirebase();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, completeSignIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
