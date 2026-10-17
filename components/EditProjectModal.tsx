"use client";

// Modal untuk mengedit project (HANYA untuk admin).
// Menampilkan data lama yang sudah terisi, bisa disimpan atau dibatalkan.
// Parent memberi `key={project.id}` agar form terinisialisasi ulang
// setiap kali project berbeda dibuka (tanpa perlu effect sinkronisasi).

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Project, ProjectFormValues } from "@/types/project";
import { validateProjectForm, validateTestTarget } from "@/lib/validation";
import type { ValidationResult } from "@/lib/validation";
import type { MutateResult } from "@/hooks/useProjects";

type TestTargetInput = Pick<
  ProjectFormValues,
  "testOwner" | "testRepo" | "testWorkflow" | "testRef" | "testResultUrl"
>;

interface EditProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onSave: (
    id: string,
    name: string,
    url: string,
    test?: TestTargetInput,
  ) => Promise<MutateResult>;
}

export default function EditProjectModal({
  project,
  onClose,
  onSave,
}: EditProjectModalProps) {
  // Inisialisasi langsung dari props (remount via key menjamin kesegaran data).
  const [name, setName] = useState(project?.name ?? "");
  const [url, setUrl] = useState(project?.url ?? "");
  const [testOwner, setTestOwner] = useState(project?.testOwner ?? "");
  const [testRepo, setTestRepo] = useState(project?.testRepo ?? "");
  const [testWorkflow, setTestWorkflow] = useState(project?.testWorkflow ?? "");
  const [testRef, setTestRef] = useState(project?.testRef ?? "");
  const [testResultUrl, setTestResultUrl] = useState(project?.testResultUrl ?? "");
  const [errors, setErrors] = useState<ValidationResult>({});
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
    const validation: ValidationResult = {
      ...validateProjectForm(name, url),
      ...validateTestTarget(testOwner, testRepo, testWorkflow, testRef, testResultUrl),
    };
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;
    setBusy(true);
    try {
      const res = await onSave(project.id, name, url, {
        testOwner,
        testRepo,
        testWorkflow,
        testRef,
        testResultUrl,
      });
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

          <div>
            <label
              htmlFor="edit-test-result-url"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Link Hasil Testing{" "}
              <span className="text-xs font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              id="edit-test-result-url"
              type="url"
              inputMode="url"
              value={testResultUrl}
              onChange={(e) => setTestResultUrl(e.target.value)}
              placeholder="https://contoh.com/hasil-testing"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.testResultUrl
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {errors.testResultUrl && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.testResultUrl}</p>
            )}
          </div>

          {/* Target repo uji per-project (opsional) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">
              Repo GitHub untuk Test{" "}
              <span className="font-normal text-slate-400">(opsional)</span>
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-test-owner" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Owner GitHub
                </label>
                <input
                  id="edit-test-owner"
                  type="text"
                  value={testOwner}
                  onChange={(e) => setTestOwner(e.target.value)}
                  placeholder="cth: Raja-Derek"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.testOwner
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {errors.testOwner && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.testOwner}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-test-repo" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Nama Repo
                </label>
                <input
                  id="edit-test-repo"
                  type="text"
                  value={testRepo}
                  onChange={(e) => setTestRepo(e.target.value)}
                  placeholder="cth: e2e-salesforce"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.testRepo
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {errors.testRepo && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.testRepo}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-test-workflow" className="mb-1.5 block text-xs font-medium text-slate-600">
                  File Workflow
                </label>
                <input
                  id="edit-test-workflow"
                  type="text"
                  value={testWorkflow}
                  onChange={(e) => setTestWorkflow(e.target.value)}
                  placeholder="cth: salesforce-flow.yml"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.testWorkflow
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {errors.testWorkflow && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.testWorkflow}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-test-ref" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Branch
                </label>
                <input
                  id="edit-test-ref"
                  type="text"
                  value={testRef}
                  onChange={(e) => setTestRef(e.target.value)}
                  placeholder="cth: master"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    errors.testRef
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {errors.testRef && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.testRef}</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Kosongkan untuk memakai default server. Owner & repo wajib diisi bersamaan.
            </p>
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
