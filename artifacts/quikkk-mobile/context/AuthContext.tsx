import React, { createContext, useCallback, useContext } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextType = {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  isError: false,
  refetch: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, refetch } = useGetMe();

  const logoutMutation = useLogout();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    queryClient.clear();
  }, [logoutMutation, queryClient]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isError, refetch, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
