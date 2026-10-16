"use client";

// Kartu project individual.
// - Klik di mana saja pada card (kecuali tombol) membuka link di tab baru.
// - Tombol Edit & Hapus memakai stopPropagation agar tidak ikut membuka link.
// - Untuk pengguna non-admin, onEdit/onDelete tidak diberikan sehingga
//   tombol disembunyikan (read-only). Keamanan tetap di server.

import type { MouseEvent } from "react";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  // Opsional: jika tidak diberikan, card menjadi read-only (mode pengguna biasa).
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

/** Ambil hostname untuk ditampilkan sebagai badge kecil. */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  // Buka link di tab baru dengan aman (noopener + noreferrer).
  const openProject = () => {
    window.open(project.url, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = () => {
    openProject();
  };

  // Tombol di dalam card tidak boleh memicu openProject.
  const handleEditClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete?.(project);
  };

  // Dukung keyboard: Enter / Space pada card membuka link.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      // Jangan buka link jika fokus sedang di tombol.
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      openProject();
    }
  };

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Buka ${project.name} di tab baru`}
      title={project.url}
      className="group flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Avatar huruf depan + badge hostname */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white"
          >
            {project.name.trim().charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">
              {project.name}
            </h3>
            <span className="mt-0.5 inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
              {getHostname(project.url)}
            </span>
          </div>
        </div>

        {/* Ikon eksternal */}
        <span
          aria-hidden="true"
          className="mt-1 shrink-0 text-slate-300 transition group-hover:text-blue-500"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </span>
      </div>

      {/* URL lengkap, dipotong jika terlalu panjang */}
      <p className="mt-3 truncate text-sm text-blue-600 hover:underline">
        {project.url}
      </p>

      {/* Aksi Edit & Hapus — hanya untuk admin. Disembunyikan untuk user biasa. */}
      {onEdit || onDelete ? (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          {onEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ✎ Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              🗑 Hapus
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          Mode lihat saja — hanya admin yang dapat mengubah.
        </p>
      )}
    </article>
  );
}
