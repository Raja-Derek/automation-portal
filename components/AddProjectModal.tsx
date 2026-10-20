"use client";

// Modal untuk menambah project baru (HANYA admin).
// Form tidak lagi tampil permanen di halaman — admin membukanya lewat
// tombol "Tambah Project". Meniru perilaku EditProjectModal:
// - Fokus terkunci di dalam dialog (useFocusTrap).
// - Escape / klik backdrop / tombol Batal menutup dialog.
// - Di mobile tampil sebagai bottom-sheet; di layar besar sebagai modal tengah.
// - Ditutup otomatis setelah project berhasil disimpan.

import { useEffect, useRef } from "react";
import type { ProjectInput } from "@/lib/projects-store";
import type { MutateResult } from "@/hooks/useProjects";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ProjectForm from "@/components/ProjectForm";
import { CloseIcon, PlusIcon } from "@/components/icons";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    url: string,
    input?: ProjectInput,
  ) => Promise<MutateResult>;
}

export default function AddProjectModal({
  open,
  onClose,
  onAdd,
}: AddProjectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Tahan fokus di dalam dialog & kembalikan ke pemicu saat ditutup.
  useFocusTrap(dialogRef, open);

  // Tutup dengan Escape.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Kunci gulir halaman di belakang modal selama terbuka.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        aria-describedby="add-project-desc"
        tabIndex={-1}
        // Klik di dalam modal tidak boleh menutup modal.
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <PlusIcon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <h2
                id="add-project-title"
                className="text-lg font-semibold text-slate-900"
              >
                Tambah Project Baru
              </h2>
              <p id="add-project-desc" className="mt-0.5 text-sm text-slate-500">
                Lengkapi detail project, lalu simpan untuk menambahkannya ke
                katalog.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="btn btn-ghost -mr-2 -mt-1 shrink-0"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <ProjectForm onAdd={onAdd} onSuccess={onClose} onCancel={onClose} />
      </div>
    </div>
  );
}
