"use client";

// Form login.
// - Menampilkan kredensial demo agar penguji mudah mencoba kedua peran.

import { useState } from "react";
import type { FormEvent } from "react";

// Disalin dari lib/users.ts agar bundle client tidak ikut membawa bcrypt.
// Nilainya harus sama dengan ADMIN_EMAIL / DEMO_USER_EMAIL di server.
const ADMIN_EMAIL = "admin@lcc.com";
const DEMO_USER_EMAIL = "user@lcc.com";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const res = await onLogin(email, password);
      if (!res.ok) setError(res.message ?? "Gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const fill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Masuk</h2>
      <p className="mt-1 text-sm text-slate-500">
        Daftar project hanya bisa dilihat setelah login.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </form>

      {/* Kredensial demo — aman untuk tugas, GANTI di produksi */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Akun demo:</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => fill(ADMIN_EMAIL, "tahubulat")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-medium hover:border-blue-300 hover:text-blue-700"
          >
            Isi admin ({ADMIN_EMAIL})
          </button>
          <button
            type="button"
            onClick={() => fill(DEMO_USER_EMAIL, "user123")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-medium hover:border-blue-300 hover:text-blue-700"
          >
            Isi user ({DEMO_USER_EMAIL})
          </button>
        </div>
      </div>
    </div>
  );
}
