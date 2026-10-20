"use client";

// Auth state dipakai bersama oleh TopBar (navbar) dan halaman katalog.
// Tanpa context, dua `useAuth()` terpisah akan memegang state sendiri
// sehingga login di navbar tidak langsung mengubah isi halaman.

import { createContext, useContext } from "react";
import type { SafeUser } from "@/types/user";

export interface AuthContextValue {
  user: SafeUser | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession harus dipakai di dalam <AuthProvider>.");
  }
  return ctx;
}
