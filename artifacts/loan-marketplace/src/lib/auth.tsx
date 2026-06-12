import React, { createContext, useContext, ReactNode } from "react";
import { useAuth as useClerkAuth } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User as BaseUser } from "@workspace/api-client-react";

export type AuthUser = BaseUser & {
  role?: "customer" | "admin" | "sales_partner" | "collection_partner";
  partnerCode?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();

  const { data: user, isLoading: apiLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      enabled: clerkLoaded && !!isSignedIn,
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: (user as AuthUser) || null,
        isLoading: !clerkLoaded || (!!isSignedIn && apiLoading),
        error: error as Error | null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
