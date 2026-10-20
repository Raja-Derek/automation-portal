"use client";

// Provider session untuk seluruh halaman: memuat status login sekali di
// root, lalu dipakai TopBar maupun AutomationPortal lewat useSession().

import { useMemo } from "react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "@/components/AuthContext";
import { useAuth } from "@/hooks/useAuth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, login, logout } = useAuth();

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
