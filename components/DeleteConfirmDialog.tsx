"use client";

// Dialog konfirmasi sebelum menghapus project.
// Mencegah penghapusan tidak sengaja.

import { useEffect } from "react";
import type { Project } from "@/types/project";

interface DeleteConfirmDialogProps {
  project: Project | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteConfirmDialog({
  project,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  // Tutup dengan Escape.
  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [project, onCancel]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-xl">
          <span aria-hidden="true">⚠️</span>
        </div>
        <h2
          id="delete-dialog-title"
          className="mt-3 text-center text-base font-semibold text-slate-900"
        >
          Hapus project ini?
        </h2>
        <p
          id="delete-dialog-desc"
          className="mt-1.5 text-center text-sm text-slate-500"
        >
          &ldquo;{project.name}&rdquo; akan dihapus permanen dan tidak bisa
          dikembalikan.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(project.id)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
