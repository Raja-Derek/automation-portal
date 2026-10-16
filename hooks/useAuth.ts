"use client";

// Hook auth client: cek session, login, register (user biasa), logout.
// Session disimpan di cookie HttpOnly oleh server, jadi JS tidak pegang token.

import { useCallback, useEffect, useState } from "react";
import type { SafeUser } from "@/types/user";

interface AuthState {
  user: SafeUser | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || `Gagal (${res.status}).`;
  } catch {
    return `Gagal (${res.status}).`;
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: SafeUser };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch session awal dari server (sistem eksternal) — pola yang sah.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { ok: false, message: await readError(res) };
    const data = (await res.json()) as { user: SafeUser };
    setUser(data.user);
    return { ok: true };
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Sengaja TIDAK mengirim role — server selalu memaksa role "user".
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { ok: false, message: await readError(res) };
    const data = (await res.json()) as { user: SafeUser };
    setUser(data.user);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  return { user, isLoading, login, register, logout, refresh };
}
