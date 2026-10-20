// Util tampilan client-side: format waktu relatif & warna badge environment.

import type { ProjectEnvironment } from "@/types/project";

/**
 * Waktu relatif dalam bahasa Indonesia, mis. "5 mnt lalu".
 * Nilai tidak valid (atau belum ada) menghasilkan null agar UI bisa
 * menampilkan fallback alih-alih teks menyesatkan.
 */
export function formatRelativeTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;

  return `${Math.floor(days / 365)} tahun lalu`;
}

interface EnvBadge {
  label: string;
  className: string;
}

const ENV_BADGES: Record<ProjectEnvironment, EnvBadge> = {
  dev: { label: "Dev", className: "bg-blue-50 text-blue-700 ring-blue-100" },
  staging: {
    label: "Staging",
    className: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
  },
  production: {
    label: "Production",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  sandbox: {
    label: "Prod Sandbox",
    className: "bg-teal-50 text-teal-700 ring-teal-100",
  },
};

/** Badge environment siap pakai; null bila project tidak punya environment. */
export function getEnvironmentBadge(
  environment: ProjectEnvironment | undefined,
): EnvBadge | null {
  if (!environment) return null;
  return ENV_BADGES[environment] ?? null;
}
