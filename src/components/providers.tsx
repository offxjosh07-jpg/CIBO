"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { createContext, useContext, ReactNode } from "react";
import { authApi } from "@/lib/api-client";
import type { User } from "@/lib/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const r = await authApi.me();
        return r.user;
      } catch {
        return null;
      }
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    refetch();
  };

  return (
    <Ctx.Provider
      value={{ user: data ?? null, loading: isLoading, refresh: () => refetch(), logout }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
