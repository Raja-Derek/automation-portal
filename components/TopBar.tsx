"use client";

// Navbar aplikasi: brand, navigasi, status akses, dan aksi login.
// Hanya menampilkan tautan yang benar-benar ada — tidak ada link mati.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/components/AuthContext";
import LoginForm from "@/components/LoginForm";
import {
  BoltIcon,
  CloseIcon,
  LockIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";

export default function TopBar() {
  const { user, isLoading, login, logout } = useSession();
  const [showLogin, setShowLogin] = useState(false);

  const isAdmin = user?.role === "admin";

  // Tutup panel login dengan Escape saat terbuka.
  useEffect(() => {
    if (!showLogin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogin(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogin]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <a href="#main-content" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
            <BoltIcon className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-sm font-bold tracking-tight text-slate-900">
              Automation Portal
            </span>
            <span className="mt-1 hidden truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:block">
              Quality Assurance Hub
            </span>
          </span>
        </a>

        {/* Navigasi — hanya halaman yang benar-benar ada */}
        <nav aria-label="Navigasi utama" className="ml-2 hidden md:block">
          <ul className="flex items-center gap-1">
            <li>
              <span
                aria-current="page"
                className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700"
              >
                Katalog Project
              </span>
            </li>
          </ul>
        </nav>

        {/* Aksi di kanan */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!isLoading && (
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex ${
                isAdmin
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : user
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  isAdmin ? "bg-indigo-500" : user ? "bg-slate-400" : "bg-emerald-500"
                }`}
              />
              {isAdmin ? "Mode admin" : user ? "Mode pengguna" : "Akses Publik"}
            </span>
          )}

          {!isLoading && !user && (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="btn btn-primary whitespace-nowrap px-3.5 py-2"
            >
              <LockIcon className="h-4 w-4" />
              Masuk Admin
            </button>
          )}

          {!isLoading && user && (
            <>
              <span className="hidden max-w-40 truncate text-xs font-medium text-slate-500 lg:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn btn-secondary whitespace-nowrap px-3.5 py-2"
              >
                {isAdmin ? (
                  <ShieldIcon className="h-4 w-4" />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
                Keluar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dialog login — portal ke body agar tidak terkurung oleh backdrop-blur header */}
      {showLogin &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px] sm:p-6"
            onClick={() => setShowLogin(false)}
            role="presentation"
          >
            <div className="flex min-h-full items-center justify-center py-8">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Masuk Admin"
                className="relative w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  aria-label="Tutup"
                  className="btn btn-ghost absolute -top-2 right-0 z-10 -translate-y-full rounded-lg bg-white/90 text-slate-500 shadow-sm hover:text-slate-800"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
                <LoginForm
                  onLogin={async (email, password) => {
                    const res = await login(email, password);
                    if (res.ok) setShowLogin(false);
                    return res;
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
