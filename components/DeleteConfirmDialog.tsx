"use client";

// Dialog konfirmasi sebelum menghapus project.
// Mencegah penghapusan tidak sengaja.

import { useEffect, useRef } from "react";
import type { Project } from "@/types/project";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { AlertIcon } from "@/components/icons";

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
  const dialogRef = useRef<HTMLDivElement>(null);

  // Tahan fokus di dalam dialog & kembalikan ke pemicu saat ditutup.
  useFocusTrap(dialogRef, project !== null);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl outline-none sm:rounded-2xl"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertIcon className="h-5 w-5" />
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
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(project.id)}
            className="btn btn-danger"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
