"use client";

// Modal untuk mengedit project (HANYA untuk admin).
// Menampilkan data lama yang sudah terisi, bisa disimpan atau dibatalkan.
// Parent memberi `key={project.id}` agar form terinisialisasi ulang
// setiap kali project berbeda dibuka (tanpa perlu effect sinkronisasi).
// Di mobile tampil sebagai bottom-sheet; di layar besar sebagai modal tengah.

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Project } from "@/types/project";
import {
  validateProjectForm,
  validateProjectMeta,
  validateTestTarget,
} from "@/lib/validation";
import type { ValidationResult } from "@/lib/validation";
import type { ProjectInput } from "@/lib/projects-store";
import type { MutateResult } from "@/hooks/useProjects";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { CATEGORY_SUGGESTIONS, PROJECT_ENVIRONMENTS } from "@/types/project";
import { CloseIcon, GearIcon, SpinnerIcon } from "@/components/icons";

interface EditProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onSave: (
    id: string,
    name: string,
    url: string,
    input?: ProjectInput,
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
  const [category, setCategory] = useState(project?.category ?? "");
  const [environment, setEnvironment] = useState(project?.environment ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [testOwner, setTestOwner] = useState(project?.testOwner ?? "");
  const [testRepo, setTestRepo] = useState(project?.testRepo ?? "");
  const [testWorkflow, setTestWorkflow] = useState(project?.testWorkflow ?? "");
  const [testRef, setTestRef] = useState(project?.testRef ?? "");
  const [testResultUrl, setTestResultUrl] = useState(project?.testResultUrl ?? "");
  const [errors, setErrors] = useState<ValidationResult>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Tahan fokus di dalam dialog & kembalikan ke pemicu saat ditutup.
  useFocusTrap(dialogRef, project !== null);

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
      ...validateProjectMeta(category, environment, description),
      ...validateTestTarget(testOwner, testRepo, testWorkflow, testRef, testResultUrl),
    };
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;
    setBusy(true);
    try {
      const res = await onSave(project.id, name, url, {
        category,
        environment,
        description,
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        tabIndex={-1}
        // Klik di dalam modal tidak boleh menutup modal.
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="edit-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              Edit Project
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Ubah detail project, lalu simpan perubahan.
            </p>
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            <div>
              <label htmlFor="edit-name" className="label">
                Nama Project <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                className={`input ${errors.name ? "input-invalid" : ""}`}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-url" className="label">
                Link Project <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`input ${errors.url ? "input-invalid" : ""}`}
              />
              {errors.url && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.url}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-category" className="label">
                Kategori{" "}
                <span className="text-xs font-normal text-slate-500">
                  (opsional)
                </span>
              </label>
              <input
                id="edit-category"
                type="text"
                list="edit-category-suggestions"
                value={category}
                maxLength={60}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="cth: Salesforce CRM"
                className={`input ${errors.category ? "input-invalid" : ""}`}
              />
              <datalist id="edit-category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && (
                <p className="mt-1.5 text-xs text-rose-600">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-environment" className="label">
                Environment
              </label>
              <select
                id="edit-environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className={`input ${errors.environment ? "input-invalid" : ""}`}
              >
                <option value="">Tidak diatur</option>
                {PROJECT_ENVIRONMENTS.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
                  </option>
                ))}
              </select>
              {errors.environment && (
                <p className="mt-1.5 text-xs text-rose-600">
                  {errors.environment}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-description" className="label">
                Deskripsi{" "}
                <span className="text-xs font-normal text-slate-500">
                  (opsional)
                </span>
              </label>
              <input
                id="edit-description"
                type="text"
                value={description}
                maxLength={160}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="cth: Payroll & Employee Suite."
                className={`input ${errors.description ? "input-invalid" : ""}`}
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-rose-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-test-result-url" className="label">
                Link Hasil Testing{" "}
                <span className="text-xs font-normal text-slate-500">
                  (opsional)
                </span>
              </label>
              <input
                id="edit-test-result-url"
                type="url"
                inputMode="url"
                value={testResultUrl}
                onChange={(e) => setTestResultUrl(e.target.value)}
                placeholder="https://contoh.com/hasil-testing"
                className={`input ${errors.testResultUrl ? "input-invalid" : ""}`}
              />
              {errors.testResultUrl && (
                <p className="mt-1.5 text-xs text-rose-600">
                  {errors.testResultUrl}
                </p>
              )}
            </div>

            {/* Target repo uji per-project (opsional) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GearIcon className="h-4 w-4 text-slate-400" />
                Repo GitHub untuk Test{" "}
                <span className="font-normal text-slate-500">(opsional)</span>
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-test-owner"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Owner GitHub
                  </label>
                  <input
                    id="edit-test-owner"
                    type="text"
                    value={testOwner}
                    onChange={(e) => setTestOwner(e.target.value)}
                    placeholder="cth: Raja-Derek"
                    className={`input py-2 text-sm ${errors.testOwner ? "input-invalid" : ""}`}
                  />
                  {errors.testOwner && (
                    <p className="mt-1.5 text-xs text-rose-600">
                      {errors.testOwner}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="edit-test-repo"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Nama Repo
                  </label>
                  <input
                    id="edit-test-repo"
                    type="text"
                    value={testRepo}
                    onChange={(e) => setTestRepo(e.target.value)}
                    placeholder="cth: e2e-salesforce"
                    className={`input py-2 text-sm ${errors.testRepo ? "input-invalid" : ""}`}
                  />
                  {errors.testRepo && (
                    <p className="mt-1.5 text-xs text-rose-600">
                      {errors.testRepo}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="edit-test-workflow"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    File Workflow
                  </label>
                  <input
                    id="edit-test-workflow"
                    type="text"
                    value={testWorkflow}
                    onChange={(e) => setTestWorkflow(e.target.value)}
                    placeholder="cth: salesforce-flow.yml"
                    className={`input py-2 text-sm ${errors.testWorkflow ? "input-invalid" : ""}`}
                  />
                  {errors.testWorkflow && (
                    <p className="mt-1.5 text-xs text-rose-600">
                      {errors.testWorkflow}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="edit-test-ref"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Branch
                  </label>
                  <input
                    id="edit-test-ref"
                    type="text"
                    value={testRef}
                    onChange={(e) => setTestRef(e.target.value)}
                    placeholder="cth: master"
                    className={`input py-2 text-sm ${errors.testRef ? "input-invalid" : ""}`}
                  />
                  {errors.testRef && (
                    <p className="mt-1.5 text-xs text-rose-600">
                      {errors.testRef}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Kosongkan untuk memakai default server. Owner &amp; repo wajib
                diisi bersamaan.
              </p>
            </div>

            {serverError && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {serverError}
              </p>
            )}
          </div>

          {/* Footer — tombol aksi */}
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Menyimpan…
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
