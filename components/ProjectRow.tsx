"use client";

// Baris project untuk tampilan daftar (mode "list").
// Informasi sama dengan ProjectCard, diratakan agar admin bisa membandingkan
// banyak project dengan cepat. URL lengkap tidak diulang: nama + hostname
// sudah mewakili tautan keluar, dan tombol aksi dibuat seringkas mungkin.

import type { CSSProperties } from "react";
import type { Project } from "@/types/project";
import { useProjectTest } from "@/hooks/useProjectTest";
import { formatRelativeTime, getEnvironmentBadge } from "@/lib/format";
import { getProjectTheme } from "@/lib/project-theme";
import {
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  LinkIcon,
  PencilIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";

interface ProjectRowProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  canTest?: boolean;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function ProjectRow({
  project,
  onEdit,
  onDelete,
  canTest,
}: ProjectRowProps) {
  const { status, busy, trigger } = useProjectTest(project);
  const envBadge = getEnvironmentBadge(project.environment);
  const lastTested = formatRelativeTime(project.testFinishedAt);
  const theme = getProjectTheme(project.name);

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
      className="project-card card group relative flex flex-col gap-3 overflow-hidden p-4 transition duration-300 ease-out sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="flex min-w-0 items-center gap-1 text-sm font-semibold text-slate-900">
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
          {project.category && (
            <span className="badge badge-neutral">{project.category}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{getHostname(project.url)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {status === "running" && (
          <span className="badge badge-amber">
            <SpinnerIcon className="h-3 w-3" />
            Menguji…
          </span>
        )}
        {status === "success" && (
          <span className="badge badge-emerald">
            <CheckIcon className="h-3 w-3" />
            Lulus
          </span>
        )}
        {status === "failed" && (
          <span className="badge badge-rose">
            <CloseIcon className="h-3 w-3" />
            Gagal
          </span>
        )}
        {lastTested && status !== "running" && (
          <span className="hidden text-xs text-slate-400 md:inline">
            {lastTested}
          </span>
        )}

        {project.testResultUrl && (
          <a
            href={project.testResultUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={project.testResultUrl}
            className="btn btn-sm relative z-10 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:ring-emerald-500"
          >
            Hasil
          </a>
        )}

        {canTest && (
          <button
            type="button"
            onClick={() => void trigger()}
            disabled={busy || status === "running"}
            className="btn btn-tint btn-sm relative z-10"
          >
            {busy || status === "running" ? (
              <SpinnerIcon className="h-3.5 w-3.5" />
            ) : (
              "Test"
            )}
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(project)}
            aria-label={`Edit ${project.name}`}
            title="Edit project"
            className="btn btn-card-action btn-sm relative z-10 px-2.5"
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
            className="btn btn-card-action btn-sm relative z-10 px-2.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-500"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}
