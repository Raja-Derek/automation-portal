"use client";

// Modal untuk mengedit project (HANYA untuk admin).
// Menampilkan data lama yang sudah terisi, bisa disimpan atau dibatalkan.
// Parent memberi `key={project.id}` agar form terinisialisasi ulang
// setiap kali project berbeda dibuka (tanpa perlu effect sinkronisasi).

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Project } from "@/types/project";
import { validateProjectForm } from "@/lib/validation";
import type { MutateResult } from "@/hooks/useProjects";

interface EditProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onSave: (id: string, name: string, url: string) => Promise<MutateResult>;
}

export default function EditProjectModal({
  project,
  onClose,
  onSave,
}: EditProjectModalProps) {
  // Inisialisasi langsung dari props (remount via key menjamin kesegaran data).
  const [name, setName] = useState(project?.name ?? "");
  const [url, setUrl] = useState(project?.url ?? "");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Tutup dengan tombol Escape untuk UX yang baik.
  // Effect ini hanya berlangganan event, tidak memanggil setState sinkron.
  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [project, onClose]);

  if (!project) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const validation = validateProjectForm(name, url);
    setErrors(validation);
    if (validation.name || validation.url) return;
    setBusy(true);
    try {
      const res = await onSave(project.id, name, url);
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        if (res.message) setServerError(res.message);
        return;
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    // Overlay: klik di luar modal = batal.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        // Klik di dalam modal tidak boleh menutup modal.
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="edit-modal-title"
          className="text-lg font-semibold text-slate-900"
        >
          Edit Project
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ubah nama atau link, lalu simpan perubahan.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nama Project <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.name
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-url"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Link Project <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.url
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {errors.url && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.url}</p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {busy ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
