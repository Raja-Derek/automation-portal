"use client";

// Footer ringkas. Hanya menampilkan informasi yang benar-benar tersedia —
// tidak ada tautan ke halaman yang belum dibuat.

import { useEffect, useState, useSyncExternalStore } from "react";
import { BoltIcon } from "@/components/icons";

const COMPANY = "PT Lintas Cakrawiapta";
const subscribeToNothing = () => () => {};

export default function SiteFooter() {
  // Tahun dibaca hanya di klien: `new Date()` saat render memblokir prerender
  // pada Next.js 16 (cache components).
  const year = useSyncExternalStore(
    subscribeToNothing,
    () => new Date().getFullYear(),
    () => null,
  );
  const [serverState, setServerState] = useState<"checking" | "ok" | "down">(
    "checking",
  );

  // Cek kesehatan server lewat endpoint publik yang memang dipakai halaman.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects", { cache: "no-store" })
      .then((res) => {
        if (!cancelled) setServerState(res.ok ? "ok" : "down");
      })
      .catch(() => {
        if (!cancelled) setServerState("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <BoltIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="whitespace-nowrap font-semibold text-slate-700">
            Automation Portal
          </span>
          {year !== null && (
            <span>
              © {year} {COMPANY}. All rights reserved.
            </span>
          )}
        </p>

        <p
          role="status"
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium"
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              serverState === "ok"
                ? "bg-emerald-500"
                : serverState === "down"
                  ? "bg-rose-500"
                  : "bg-slate-300"
            }`}
          />
          {serverState === "ok"
            ? "Status server: normal"
            : serverState === "down"
              ? "Status server: tidak terjangkau"
              : "Memeriksa status server…"}
        </p>
      </div>
    </footer>
  );
}
