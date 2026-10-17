"use client";

// Kartu project individual.
// - Nama project adalah <a> asli (stretched link) yang membuka tab baru,
//   sehingga bisa di-middle-click / "open in new tab" & ramah screen reader.
// - Tombol Edit/Hapus/Test memakai `relative z-10` agar berada di atas
//   overlay link, dan tidak perlu stopPropagation.
// - Untuk pengguna non-admin, onEdit/onDelete tidak diberikan sehingga
//   tombol disembunyikan (read-only). Keamanan tetap di server.
// - Tombol Test (admin saja, via canTest) memicu GitHub Action
//   workflow_dispatch; status dipolling dan label "Tested" tampil publik.

import type { Project } from "@/types/project";
import { useProjectTest } from "@/hooks/useProjectTest";
import {
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  GearIcon,
  LinkIcon,
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

/** Ambil hostname untuk ditampilkan sebagai badge kecil. */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Warna avatar deterministik dari nama (tinted, bukan gradient). */
const AVATAR_TINTS = [
  "bg-blue-50 text-blue-700",
  "bg-sky-50 text-sky-700",
  "bg-teal-50 text-teal-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
];

function getAvatarTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
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

  return (
    <article className="group card relative flex h-full flex-col p-5 transition has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blue-500 has-[a:focus-visible]:ring-offset-2 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Header: avatar + nama + badge target */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ring-1 ring-black/5 ${getAvatarTint(project.name)}`}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {/* Stretched link: <a> asli + overlay `after` menutupi seluruh card. */}
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Buka ${project.name} di tab baru`}
                className="rounded-sm after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus:outline-none"
              >
                {project.name}
              </a>
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="badge badge-neutral max-w-full min-w-0">
                <span className="truncate">{getHostname(project.url)}</span>
              </span>
              {project.testOwner && project.testRepo ? (
                <span
                  title={`Workflow: ${project.testWorkflow ?? "default"} @ ${project.testRef ?? "default"}`}
                  className="badge badge-blue max-w-full min-w-0"
                >
                  <GearIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {project.testOwner}/{project.testRepo}
                  </span>
                </span>
              ) : (
                canTest && (
                  <span className="badge badge-neutral">
                    <GearIcon className="h-3 w-3" />
                    repo default
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Ikon eksternal */}
        <span
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-slate-400 transition group-hover:text-blue-600"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </span>
      </div>

      {/* URL lengkap, dipotong jika terlalu panjang (metadata, bukan link terpisah). */}
      <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{project.url}</span>
      </div>

      {/* Link halaman hasil testing — dibuka di tab baru */}
      {project.testResultUrl && (
        <a
          href={project.testResultUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={project.testResultUrl}
          className="btn btn-sm relative z-10 mt-3 w-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Lihat Hasil Testing
        </a>
      )}

      {/* Status uji GitHub Action — terlihat publik */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {testStatus === "running" && (
          <span className="badge badge-amber">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
            />
            Testing…
          </span>
        )}
        {testStatus === "success" && (
          <span className="badge badge-emerald">
            <CheckIcon className="h-3 w-3" />
            Tested
          </span>
        )}
        {testStatus === "failed" && (
          <span className="badge badge-rose">
            <CloseIcon className="h-3 w-3" />
            Test gagal
          </span>
        )}
        {testHtmlUrl && testStatus !== "idle" && (
          <a
            href={testHtmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-blue-600 hover:underline"
          >
            <ExternalLinkIcon className="h-3 w-3" />
            Lihat run
          </a>
        )}
      </div>
      {testStatus === "running" && (
        <p role="status" className="mt-1.5 text-xs text-amber-700">
          GitHub Action sedang berlangsung — status diperbarui otomatis.
        </p>
      )}
      {testError && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {testError}
        </p>
      )}

      {/* Footer — didorong ke bawah agar card sejajar */}
      <div className="relative z-10 mt-auto pt-4">
        {/* Tombol Test — hanya untuk admin. Tinted agar tidak menyaingi primary. */}
        {canTest && (
          <button
            type="button"
            onClick={() => void triggerTest()}
            disabled={testBusy || testStatus === "running"}
            className="btn btn-tint w-full"
          >
            {testStatus === "running" || testBusy ? (
              <>
                <SpinnerIcon className="h-3.5 w-3.5" />
                Menjalankan…
              </>
            ) : testStatus === "success" || testStatus === "failed" ? (
              <>
                <RefreshIcon className="h-3.5 w-3.5" />
                Test ulang
              </>
            ) : (
              <>
                <PlayIcon className="h-3 w-3" />
                Test via GitHub Action
              </>
            )}
          </button>
        )}

        {/* Aksi Edit & Hapus — hanya untuk admin. Disembunyikan untuk user biasa. */}
        {onEdit || onDelete ? (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="btn btn-secondary btn-sm flex-1"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="btn btn-secondary btn-sm flex-1 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-500"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Hapus
              </button>
            )}
          </div>
        ) : (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Mode lihat saja — hanya admin yang dapat mengubah.
          </p>
        )}
      </div>
    </article>
  );
}
