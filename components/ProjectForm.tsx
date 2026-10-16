"use client";

// Form untuk menambah project baru (HANYA dirender untuk admin).
// - Validasi client dulu untuk UX cepat, lalu validasi server via API.
// - Menampilkan pesan 403 jika non-admin mencoba (tidak seharusnya terjadi via UI).
// - Mengosongkan form hanya jika server mengembalikan sukses.

import { useState } from "react";
import type { FormEvent } from "react";
import { validateProjectForm } from "@/lib/validation";
import type { MutateResult } from "@/hooks/useProjects";

interface ProjectFormProps {
  onAdd: (name: string, url: string) => Promise<MutateResult>;
}

export default function ProjectForm({ onAdd }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    // Validasi client lebih dulu.
    const validation = validateProjectForm(name, url);
    setErrors(validation);
    if (validation.name || validation.url) return;

    setBusy(true);
    try {
      const res = await onAdd(name, url);
      if (!res.ok) {
        // Utamakan error per-field dari server (validasi server).
        if (res.fieldErrors) setErrors(res.fieldErrors);
        if (res.message) setServerError(res.message);
        return;
      }
      // Sukses → kosongkan form.
      setName("");
      setUrl("");
      setErrors({});
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        Tambah Project Baru
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Hanya admin yang dapat menambah project.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Input nama project */}
        <div>
          <label
            htmlFor="project-name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Nama Project <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: n8n Production"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "project-name-error" : undefined}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
              errors.name
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          <div className="mt-1.5 flex items-center justify-between">
            {errors.name ? (
              <p id="project-name-error" className="text-xs text-rose-600">
                {errors.name}
              </p>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-slate-400">
              {name.trim().length}/100
            </span>
          </div>
        </div>

        {/* Input link project */}
        <div>
          <label
            htmlFor="project-url"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Link Project <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://contoh.com/project"
            aria-invalid={Boolean(errors.url)}
            aria-describedby={errors.url ? "project-url-error" : undefined}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
              errors.url
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.url ? (
            <p id="project-url-error" className="mt-1.5 text-xs text-rose-600">
              {errors.url}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Harus berawalan http:// atau https://
            </p>
          )}
        </div>
      </div>

      {serverError && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {serverError}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
        >
          <span aria-hidden="true">＋</span>
          {busy ? "Menyimpan…" : "Simpan Project"}
        </button>
      </div>
    </form>
  );
}
