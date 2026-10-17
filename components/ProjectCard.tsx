"use client";

// Kartu project individual.
// - Klik di mana saja pada card (kecuali tombol) membuka link di tab baru.
// - Tombol Edit & Hapus memakai stopPropagation agar tidak ikut membuka link.
// - Untuk pengguna non-admin, onEdit/onDelete tidak diberikan sehingga
//   tombol disembunyikan (read-only). Keamanan tetap di server.
// - Tombol Test (admin saja, via canTest) memicu GitHub Action
//   workflow_dispatch; status dipolling dan label "Tested" tampil publik.

import type { MouseEvent } from "react";
import type { Project } from "@/types/project";
import { useProjectTest } from "@/hooks/useProjectTest";

interface ProjectCardProps {
  project: Project;
  // Opsional: jika tidak diberikan, card menjadi read-only (mode pengguna biasa).
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  // Tampilkan tombol Test GitHub Action (hanya diberikan untuk admin).
  canTest?: boolean;
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
  canTest,
}: ProjectCardProps) {
  const {
    status: testStatus,
    htmlUrl: testHtmlUrl,
    busy: testBusy,
    error: testError,
    trigger: triggerTest,
  } = useProjectTest(project);
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

  const handleTestClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    void triggerTest();
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
            {project.testOwner && project.testRepo ? (
              <span
                title={`Workflow: ${project.testWorkflow ?? "default"} @ ${project.testRef ?? "default"}`}
                className="mt-0.5 ml-1 inline-block max-w-full truncate rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-600"
              >
                ⚙ {project.testOwner}/{project.testRepo}
              </span>
            ) : (
              canTest && (
                <span className="mt-0.5 ml-1 inline-block rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
                  ⚙ repo default
                </span>
              )
            )}
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

      {/* Status uji GitHub Action — terlihat publik */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {testStatus === "running" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
            />
            Testing…
          </span>
        )}
        {testStatus === "success" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            ✓ Tested
          </span>
        )}
        {testStatus === "failed" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
            ✕ Test gagal
          </span>
        )}
        {testHtmlUrl && testStatus !== "idle" && (
          <a
            href={testHtmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-semibold text-slate-400 underline-offset-2 hover:text-blue-600 hover:underline"
          >
            Lihat run
          </a>
        )}
      </div>
      {testStatus === "running" && (
        <p role="status" className="mt-1.5 text-[11px] text-amber-600">
          GitHub Action sedang berlangsung — status diperbarui otomatis.
        </p>
      )}
      {testError && (
        <p role="alert" className="mt-1.5 text-[11px] text-rose-600">
          {testError}
        </p>
      )}

      {/* Link halaman hasil testing — dibuka di tab baru */}
      {project.testResultUrl && (
        <a
          href={project.testResultUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={project.testResultUrl}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span aria-hidden="true">🔗</span>
          Lihat Hasil Testing
        </a>
      )}

      {/* Tombol Test — hanya untuk admin */}
      {canTest && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleTestClick}
            disabled={testBusy || testStatus === "running"}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            {testStatus === "running" || testBusy
              ? "⏳ Menjalankan…"
              : testStatus === "success" || testStatus === "failed"
                ? "↻ Test ulang"
                : "▶ Test via GitHub Action"}
          </button>
        </div>
      )}

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
