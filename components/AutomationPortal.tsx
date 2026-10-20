"use client";

// Komponen utama (Client Component) dengan hak akses berbasis peran.
// - Daftar project PUBLIK: bisa dilihat tanpa login.
// - Admin (login) → tambah + edit + hapus + trigger test.
// - Pengunjung / user biasa → read-only (tombol disembunyikan,
//   server tetap menolak 403 untuk operasi tulis).
// Data project diambil dari GET /api/projects (publik, tanpa login).

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/types/project";
import type { ProjectInput } from "@/lib/projects-store";
import { useSession } from "@/components/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { formatRelativeTime } from "@/lib/format";
import AddProjectModal from "@/components/AddProjectModal";
import ProjectCard from "@/components/ProjectCard";
import ProjectRow from "@/components/ProjectRow";
import EditProjectModal from "@/components/EditProjectModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
  AlertIcon,
  BoxIcon,
  CheckIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
} from "@/components/icons";

type ViewMode = "grid" | "list";

export default function AutomationPortal() {
  const { user } = useSession();
  const {
    projects,
    isLoaded,
    error: projectsError,
    reload,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  // Modal tambah project (admin) — dibuka lewat tombol, bukan tampil permanen.
  const [showAddProject, setShowAddProject] = useState(false);
  // Project yang sedang diedit / dihapus (null = tidak ada modal terbuka).
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Pencarian client-side di daftar project.
  const [query, setQuery] = useState("");
  // Filter kategori (null = semua kategori).
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  // Tampilan kartu atau daftar.
  const [view, setView] = useState<ViewMode>("grid");
  // Umpan balik sukses singkat (tambah/hapus).
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const isLoggedIn = user !== null;

  // Auto-hilangkan umpan balik sukses.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const normalizedQuery = query.trim().toLowerCase();

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      const key = p.category?.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], "id"),
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (!normalizedQuery) return true;
      return (
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.url.toLowerCase().includes(normalizedQuery) ||
        (p.description ?? "").toLowerCase().includes(normalizedQuery) ||
        (p.category ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [projects, normalizedQuery, activeCategory]);

  const stats = useMemo(() => {
    const tested = projects.filter(
      (p) => p.testStatus === "success" || p.testStatus === "failed",
    );
    const failed = tested.filter((p) => p.testStatus === "failed").length;
    const failureRate = tested.length
      ? (failed / tested.length) * 100
      : null;
    const lastFinished = projects
      .map((p) => p.testFinishedAt)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1);
    return {
      total: projects.length,
      failureRate,
      failed,
      lastTested: formatRelativeTime(lastFinished),
    };
  }, [projects]);

  const handleAdd = async (
    name: string,
    url: string,
    input?: ProjectInput,
  ) => {
    const res = await addProject(name, url, input);
    if (res.ok) setNotice("Project berhasil ditambahkan.");
    return res;
  };

  const handleConfirmDelete = async (id: string) => {
    setDeleteError(null);
    const res = await deleteProject(id);
    if (!res.ok) {
      setDeleteError(res.message ?? "Gagal menghapus.");
      return;
    }
    setDeletingProject(null);
    setNotice("Project dihapus.");
  };

  const isFiltering = Boolean(normalizedQuery) || activeCategory !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero: judul + statistik */}
      <section className="border-b border-slate-200 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              Automated Suite Hub · {isLoggedIn ? "Portal Aktif" : "Terbuka untuk Umum"}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Daftar Project Otomasi
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Daftar project terbuka untuk umum — tanpa login bisa langsung
              melihat hasil pengujian.{" "}
              {isAdmin ? (
                <span className="text-slate-700">
                  Anda masuk sebagai <strong>{user.email}</strong> — silakan
                  atur jadwal dan eksekusi test runner.
                </span>
              ) : isLoggedIn ? (
                <span className="text-slate-700">
                  Mode lihat saja. Hanya admin yang dapat mengubah data.
                </span>
              ) : (
                "Masuk sebagai admin untuk konfigurasi jadwal dan eksekusi test runner."
              )}
            </p>
          </div>

          {/* Statistik ringkas */}
          <dl className="card grid shrink-0 grid-cols-3 divide-x divide-slate-100">
            <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-3.5">
              <dt className="text-[9px] font-semibold uppercase leading-tight tracking-wider text-slate-400 sm:text-[10px]">
                <span className="sm:hidden">Total</span>
                <span className="hidden sm:inline">Total Project</span>
              </dt>
              <dd className="mt-1 text-base font-bold leading-tight tabular-nums text-slate-900 sm:text-xl">
                {isLoaded ? stats.total : "–"}
                <span className="ml-1 text-xs font-medium text-slate-400">
                  repo
                </span>
              </dd>
            </div>
            <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-3.5">
              <dt className="text-[9px] font-semibold uppercase leading-tight tracking-wider text-slate-400 sm:text-[10px]">
                <span className="sm:hidden">Failure</span>
                <span className="hidden sm:inline">Failure Rate</span>
              </dt>
              <dd className="mt-1 text-base font-bold leading-tight tabular-nums text-slate-900 sm:text-xl">
                {stats.failureRate === null
                  ? "–"
                  : `${stats.failureRate.toFixed(1)}%`}
                <span className="ml-1 whitespace-nowrap text-xs font-medium text-slate-400">
                  ({stats.failed} gagal)
                </span>
              </dd>
            </div>
            <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-3.5">
              <dt className="text-[9px] font-semibold uppercase leading-tight tracking-wider text-slate-400 sm:text-[10px]">
                <span className="sm:hidden">Terakhir</span>
                <span className="hidden sm:inline">Testing Terakhir</span>
              </dt>
              <dd className="mt-1 break-words text-base font-bold leading-tight text-slate-900 sm:text-xl">
                {stats.lastTested ?? "Belum ada"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Umpan balik sukses */}
      {notice && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800"
        >
          <CheckIcon className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}

      {/* Daftar project — PUBLIK */}
      <section aria-label="Daftar project" className="mt-10">
        <div className="flex flex-col gap-4">
          {/* Toolbar: pencarian + aksi */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Cari project, environment, atau domain"
                placeholder="Cari project, environment, atau domain…"
                className="input py-2.5 pl-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddProject(true)}
                  className="btn btn-primary btn-sm"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Tambah Project
                </button>
              )}
              <button
                type="button"
                onClick={() => void reload()}
                className="btn btn-secondary btn-sm"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                Muat ulang
              </button>
              <div
                role="group"
                aria-label="Mode tampilan"
                className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  aria-label="Tampilan kartu"
                  className={`rounded-md p-1.5 transition ${
                    view === "grid"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                  aria-label="Tampilan daftar"
                  className={`rounded-md p-1.5 transition ${
                    view === "list"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter kategori — hanya ditampilkan bila ada data kategori */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Filter Kategori:
              </span>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                aria-pressed={activeCategory === null}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === null
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Semua ({projects.length})
              </button>
              {categories.map(([category, count]) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(active ? null : category)}
                    aria-pressed={active}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Judul daftar + jumlah */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Daftar Project
            </h2>
            <span className="badge badge-neutral">
              {isLoaded
                ? isFiltering
                  ? `${filteredProjects.length}/${projects.length}`
                  : projects.length
                : "–"}{" "}
              Aktif
            </span>
          </div>
          {projectsError && (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {projectsError}
            </p>
          )}
        </div>
        <p className="mt-2.5 text-xs text-slate-400">
          Klik nama project untuk membuka di tab baru. Akses admin diperlukan
          untuk mengubah konfigurasi.
        </p>

        {/* Konten daftar */}
        {!isLoaded ? (
          <div
            className={
              view === "grid"
                ? "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "mt-6 space-y-3"
            }
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={view === "grid" ? "skeleton h-64" : "skeleton h-20"} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          projectsError ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertIcon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold text-slate-900">
                Gagal memuat project
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-600">
                {projectsError}
              </p>
              <button
                type="button"
                onClick={() => void reload()}
                className="btn btn-secondary btn-sm mt-4"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <BoxIcon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold text-slate-900">
                Belum ada project
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {isAdmin
                  ? "Mulai dengan menambahkan project pertama ke katalog."
                  : "Belum ada project yang dibagikan admin."}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddProject(true)}
                  className="btn btn-primary btn-sm mt-4"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Tambah Project
                </button>
              )}
            </div>
          )
        ) : filteredProjects.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <SearchIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-slate-900">
              Tidak ada project yang cocok
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {activeCategory
                ? `Kategori “${activeCategory}” tidak punya project yang cocok dengan pencarian.`
                : `Tidak ada hasil untuk “${query.trim()}”. Coba kata kunci lain.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory(null);
              }}
              className="btn btn-secondary btn-sm mt-4"
            >
              Hapus filter
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                // Teruskan handler HANYA untuk admin → tombol hilang untuk umum.
                onEdit={isAdmin ? setEditingProject : undefined}
                onDelete={isAdmin ? setDeletingProject : undefined}
                canTest={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onEdit={isAdmin ? setEditingProject : undefined}
                onDelete={isAdmin ? setDeletingProject : undefined}
                canTest={isAdmin}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal tambah project — dibuka lewat tombol "Tambah Project" */}
      {isAdmin && (
        <AddProjectModal
          open={showAddProject}
          onClose={() => setShowAddProject(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Modal edit — hanya bisa terbuka untuk admin */}
      {isAdmin && (
        <EditProjectModal
          key={editingProject?.id ?? "closed"}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={updateProject}
        />
      )}

      {/* Dialog konfirmasi hapus — hanya admin */}
      {isAdmin && (
        <>
          <DeleteConfirmDialog
            project={deletingProject}
            onCancel={() => {
              setDeletingProject(null);
              setDeleteError(null);
            }}
            onConfirm={(id) => void handleConfirmDelete(id)}
          />
          {deleteError && deletingProject && (
            <p role="alert" className="mt-2 text-center text-xs text-rose-600">
              {deleteError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
