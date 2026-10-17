"use client";

// Komponen utama (Client Component) dengan hak akses berbasis peran.
// - Daftar project PUBLIK: bisa dilihat tanpa login.
// - Admin (login) → tambah + edit + hapus.
// - Pengunjung / user biasa → read-only (tombol disembunyikan,
//   server tetap menolak 403 untuk operasi tulis).
// Data project diambil dari GET /api/projects (publik, tanpa login).

import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectFormValues } from "@/types/project";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import ProjectForm from "@/components/ProjectForm";
import ProjectCard from "@/components/ProjectCard";
import EditProjectModal from "@/components/EditProjectModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import LoginForm from "@/components/LoginForm";
import {
  AlertIcon,
  BoxIcon,
  CheckIcon,
  LockIcon,
  LogOutIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";

type TestTargetInput = Pick<
  ProjectFormValues,
  "testOwner" | "testRepo" | "testWorkflow" | "testRef" | "testResultUrl"
>;

export default function AutomationPortal() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const {
    projects,
    isLoaded,
    error: projectsError,
    reload,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  // Project yang sedang diedit / dihapus (null = tidak ada modal terbuka).
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Panel login admin (hanya untuk pengunjung).
  const [showLogin, setShowLogin] = useState(false);
  // Pencarian client-side di daftar project.
  const [query, setQuery] = useState("");
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
  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.url.toLowerCase().includes(normalizedQuery),
    );
  }, [projects, normalizedQuery]);

  const handleAdd = async (name: string, url: string, test?: TestTargetInput) => {
    const res = await addProject(name, url, test);
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      {/* Header halaman */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {isLoggedIn ? (
            <span
              className={`badge ${
                isAdmin ? "bg-slate-900 text-white" : "badge-neutral"
              }`}
            >
              {isAdmin ? (
                <ShieldIcon className="h-3 w-3" />
              ) : (
                <UserIcon className="h-3 w-3" />
              )}
              {isAdmin ? "Mode admin" : "Mode pengguna"}
            </span>
          ) : (
            <span className="badge badge-neutral">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-slate-400"
              />
              Akses publik
            </span>
          )}
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isAdmin ? "Kelola Semua Project Automasi" : "Daftar Project Automasi"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-500 sm:text-base">
            {isAdmin ? (
              <>
                Masuk sebagai{" "}
                <span className="font-semibold text-slate-700">{user.email}</span>{" "}
                — Anda dapat menambah, mengedit, dan menghapus.
              </>
            ) : isLoggedIn ? (
              <>
                Masuk sebagai{" "}
                <span className="font-semibold text-slate-700">{user.email}</span>{" "}
                — mode lihat saja (read-only).
              </>
            ) : (
              "Daftar project terbuka untuk umum — tanpa login bisa langsung melihat. Masuk sebagai admin untuk mengelola."
            )}
          </p>
        </div>

        <div className="flex items-stretch gap-2 sm:shrink-0">
          {authLoading ? (
            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-500">
              …
            </span>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                void logout();
                setShowLogin(false);
              }}
              className="btn btn-secondary"
            >
              <LogOutIcon className="h-4 w-4" />
              Keluar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin((v) => !v)}
              aria-expanded={showLogin}
              aria-controls="login-panel"
              className="btn btn-primary"
            >
              <LockIcon className="h-4 w-4" />
              {showLogin ? "Tutup" : "Masuk Admin"}
            </button>
          )}
        </div>
      </header>

      {/* Umpan balik sukses */}
      {notice && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800"
        >
          <CheckIcon className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}

      {/* Panel login — hanya untuk pengunjung, collapsible */}
      {!isLoggedIn && showLogin && (
        <div id="login-panel" className="mt-6 flex justify-center">
          <LoginForm onLogin={login} />
        </div>
      )}

      {/* Form tambah — HANYA admin */}
      {isAdmin && (
        <div className="mt-6">
          <ProjectForm onAdd={handleAdd} />
        </div>
      )}

      {/* Daftar project — PUBLIK */}
      <section aria-label="Daftar project" className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Daftar Project
            </h2>
            <span className="badge badge-neutral">
              {isLoaded
                ? normalizedQuery
                  ? `${filteredProjects.length}/${projects.length}`
                  : projects.length
                : "–"}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {projectsError && (
              <span className="text-xs text-rose-600">{projectsError}</span>
            )}
            {isLoaded && projects.length > 0 && (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Cari project"
                  placeholder="Cari project…"
                  className="input py-2 pl-9 text-sm sm:w-60"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => void reload()}
              className="btn btn-secondary btn-sm"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Muat ulang
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Klik card untuk membuka project di tab baru.
        </p>

        {!isLoaded ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-44" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          projectsError ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-16 text-center">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <BoxIcon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-semibold text-slate-900">
                Belum ada project
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {isAdmin
                  ? "Tambahkan project pertama lewat form di atas."
                  : "Belum ada project yang dibagikan admin."}
              </p>
            </div>
          )
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <SearchIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-slate-900">
              Tidak ada project yang cocok
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Tidak ada hasil untuk “{query.trim()}”. Coba kata kunci lain.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="btn btn-secondary btn-sm mt-4"
            >
              Hapus pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        )}
      </section>

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
