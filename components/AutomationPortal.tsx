"use client";

// Komponen utama (Client Component) dengan hak akses berbasis peran.
// - Daftar project PUBLIK: bisa dilihat tanpa login.
// - Admin (login) → tambah + edit + hapus.
// - Pengunjung / user biasa → read-only (tombol disembunyikan,
//   server tetap menolak 403 untuk operasi tulis).
// Data project diambil dari GET /api/projects (publik, tanpa login).

import { useState } from "react";
import type { Project } from "@/types/project";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import ProjectForm from "@/components/ProjectForm";
import ProjectCard from "@/components/ProjectCard";
import EditProjectModal from "@/components/EditProjectModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import LoginForm from "@/components/LoginForm";

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

  const isAdmin = user?.role === "admin";
  const isLoggedIn = user !== null;

  const handleConfirmDelete = async (id: string) => {
    setDeleteError(null);
    const res = await deleteProject(id);
    if (!res.ok) {
      setDeleteError(res.message ?? "Gagal menghapus.");
      return;
    }
    setDeletingProject(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Automation Portal
            </span>
            {isLoggedIn && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  isAdmin
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isAdmin ? "ADMIN" : "PENGGUNA"}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isAdmin ? "Kelola Semua Project Automasi" : "Daftar Project Automasi"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-500 sm:text-[15px]">
            {isAdmin ? (
              <>
                Masuk sebagai{" "}
                <span className="font-semibold text-slate-700">{user.email}</span>
                {" "}— Anda dapat menambah, mengedit, dan menghapus.
              </>
            ) : isLoggedIn ? (
              <>
                Masuk sebagai{" "}
                <span className="font-semibold text-slate-700">{user.email}</span>
                {" "}— mode lihat saja (read-only).
              </>
            ) : (
              "Daftar project terbuka untuk umum — tanpa login bisa langsung melihat. Masuk sebagai admin untuk mengelola."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="text-2xl font-bold text-slate-900">
              {isLoaded ? projects.length : "–"}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Total
              <br />
              Project
            </span>
          </div>
          {authLoading ? (
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
              …
            </span>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                void logout();
                setShowLogin(false);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Keluar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin((v) => !v)}
              aria-expanded={showLogin}
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              {showLogin ? "Tutup" : "Masuk Admin"}
            </button>
          )}
        </div>
      </header>

      {/* Panel login — hanya untuk pengunjung, collapsible */}
      {!isLoggedIn && showLogin && (
        <div className="mt-6">
          <LoginForm onLogin={login} />
        </div>
      )}

      {/* Form tambah — HANYA admin */}
      <div className="mt-6">
        {isAdmin ? (
          <ProjectForm onAdd={addProject} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">
            {isLoggedIn
              ? "Anda masuk sebagai pengguna biasa — daftar di bawah hanya dapat dilihat, tidak dapat ditambah/diubah/dihapus."
              : "Mode pengunjung (tanpa login) — daftar di bawah hanya dapat dilihat. Klik “Masuk Admin” untuk mengelola."}
          </div>
        )}
      </div>

      {/* Daftar project — PUBLIK */}
      <section aria-label="Daftar project" className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Daftar Project
          </h2>
          <div className="flex items-center gap-3">
            {projectsError && (
              <span className="text-xs text-rose-600">{projectsError}</span>
            )}
            <button
              type="button"
              onClick={() => void reload()}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Muat ulang
            </button>
            <p className="hidden text-xs text-slate-400 sm:block">
              Klik card untuk membuka di tab baru
            </p>
          </div>
        </div>

        {!isLoaded ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : projects.length === 0 && !projectsError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              <span aria-hidden="true">📦</span>
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
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                // Teruskan handler HANYA untuk admin → tombol hilang untuk umum.
                onEdit={isAdmin ? setEditingProject : undefined}
                onDelete={isAdmin ? setDeletingProject : undefined}
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
