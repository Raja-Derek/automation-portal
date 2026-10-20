"use client";

// Kartu project individual.
// Hierarki informasi dibuat sekali saja:
// - Nama (sekaligus tautan keluar) + environment
// - Deskripsi + kategori
// - Hostname + repo uji
// - Status/hasil testing
// - Aksi admin yang ringkas (test, edit, hapus)
// URL lengkap tidak diulang karena nama dan hostname sudah mewakilinya.
//
// - Nama project adalah <a> asli (stretched link) yang membuka tab baru.
// - Tombol aksi memakai `relative z-10` agar berada di atas overlay link.
// - Untuk pengguna non-admin, onEdit/onDelete tidak diberikan sehingga
//   tombol admin tidak dirender. Keamanan tetap di server.

import type { CSSProperties } from "react";
import type { Project } from "@/types/project";
import { useProjectTest } from "@/hooks/useProjectTest";
import { formatRelativeTime, getEnvironmentBadge } from "@/lib/format";
import { getProjectTheme } from "@/lib/project-theme";
import {
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  GearIcon,
  PencilIcon,
  PlayIcon,
  RefreshIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";

interface ProjectCardProps {
  project: Project;
  // Opsional: jika tidak diberikan, card menjadi read-only (mode pengguna biasa).
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  // Tampilkan tombol Test GitHub Action (hanya diberikan untuk admin).
  canTest?: boolean;
}

/** Ambil hostname untuk ditampilkan sebagai chip. */
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

  const initial = project.name.trim().charAt(0).toUpperCase() || "?";
  const envBadge = getEnvironmentBadge(project.environment);
  const lastTested = formatRelativeTime(project.testFinishedAt);
  const theme = getProjectTheme(project.name);
  const showStatusRow =
    testStatus !== "idle" ||
    lastTested !== null ||
    Boolean(project.testResultUrl);

  const cardStyle = {
    "--card-from": theme.from,
    "--card-to": theme.to,
    "--card-glow": theme.glow,
    "--card-accent": theme.accent,
    "--card-accent-2": theme.accent2,
  } as CSSProperties;

  return (
    <article
      style={cardStyle}
      className="project-card group card relative flex h-full flex-col overflow-hidden p-5 transition duration-300 ease-out has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-indigo-500 has-[a:focus-visible]:ring-offset-2 hover:-translate-y-1"
    >
      {/* Identitas project */}
      <div className="flex min-w-0 items-start gap-3">
        <div
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(145deg, ${theme.avatarFrom}, ${theme.avatarTo})`,
            color: theme.accent,
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm ring-1 ring-white/70"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="flex min-w-0 items-center gap-1">
              {/* Stretched link: <a> asli + overlay `after` menutupi card. */}
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Buka ${project.name} di tab baru`}
                className="min-w-0 truncate rounded-sm after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus:outline-none"
              >
                {project.name}
              </a>
              <ExternalLinkIcon
                aria-hidden="true"
                className="h-3 w-3 shrink-0 text-slate-400 transition group-hover:text-indigo-500"
              />
            </h3>
            {envBadge && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${envBadge.className}`}
              >
                {envBadge.label}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {project.description}
            </p>
          )}
          {project.category && (
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {project.category}
            </p>
          )}
        </div>
      </div>

      {/* Metadata ringkas: hostname + repo uji (tanpa URL lengkap) */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <p
          title={project.url}
          className="inline-flex min-w-0 max-w-full items-center rounded-md bg-white/70 px-2 py-1 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200/70"
        >
          <span className="truncate">{getHostname(project.url)}</span>
        </p>
        {project.testOwner && project.testRepo && (
          <span
            title={`Workflow: ${project.testWorkflow ?? "default"} @ ${project.testRef ?? "default"}`}
            className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100"
          >
            <GearIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {project.testOwner}/{project.testRepo}
            </span>
          </span>
        )}
      </div>

      {/* Status + hasil testing dalam satu baris yang sama */}
      {showStatusRow && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {testStatus === "running" && (
            <span className="badge badge-amber">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
              />
              Menguji…
            </span>
          )}
          {testStatus === "success" && (
            <span className="badge badge-emerald">
              <CheckIcon className="h-3 w-3" />
              Lulus
            </span>
          )}
          {testStatus === "failed" && (
            <span className="badge badge-rose">
              <CloseIcon className="h-3 w-3" />
              Gagal
            </span>
          )}
          {lastTested && testStatus !== "running" && (
            <span className="text-xs text-slate-400">{lastTested}</span>
          )}
          {project.testResultUrl && (
            <a
              href={project.testResultUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={project.testResultUrl}
              className="relative z-10 inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <CheckIcon className="h-3 w-3" />
              Hasil testing
            </a>
          )}
          {testHtmlUrl && testStatus !== "idle" && (
            <a
              href={testHtmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ExternalLinkIcon className="h-3 w-3" />
              Run
            </a>
          )}
        </div>
      )}
      {testError && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {testError}
        </p>
      )}

      {/* Footer aksi admin — ringkas, tanpa label berulang */}
      {(canTest || onEdit || onDelete) && (
        <div className="relative z-10 mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
            {canTest ? (
              <button
                type="button"
                onClick={() => void triggerTest()}
                disabled={testBusy || testStatus === "running"}
                className="btn btn-tint btn-sm"
              >
                {testStatus === "running" || testBusy ? (
                  <>
                    <SpinnerIcon className="h-3.5 w-3.5" />
                    Menguji…
                  </>
                ) : testStatus === "success" || testStatus === "failed" ? (
                  <>
                    <RefreshIcon className="h-3.5 w-3.5" />
                    Test ulang
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-3 w-3" />
                    Test
                  </>
                )}
              </button>
            ) : (
              <span />
            )}

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(project)}
                    aria-label={`Edit ${project.name}`}
                    title="Edit project"
                    className="btn btn-card-action btn-sm px-2.5"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(project)}
                    aria-label={`Hapus ${project.name}`}
                    title="Hapus project"
                    className="btn btn-card-action btn-sm px-2.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-500"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
