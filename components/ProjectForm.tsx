"use client";

// Form untuk menambah project baru (HANYA dirender untuk admin).
// - Validasi client dulu untuk UX cepat, lalu validasi server via API.
// - Menampilkan pesan 403 jika non-admin mencoba (tidak seharusnya terjadi via UI).
// - Mengosongkan form hanya jika server mengembalikan sukses.

import { useState } from "react";
import type { FormEvent } from "react";
import { validateProjectForm, validateTestTarget } from "@/lib/validation";
import type { ValidationResult } from "@/lib/validation";
import type { MutateResult } from "@/hooks/useProjects";
import type { ProjectFormValues } from "@/types/project";
import {
  ChevronDownIcon,
  GearIcon,
  PlusIcon,
  SpinnerIcon,
} from "@/components/icons";

type TestTargetInput = Pick<
  ProjectFormValues,
  "testOwner" | "testRepo" | "testWorkflow" | "testRef" | "testResultUrl"
>;

interface ProjectFormProps {
  onAdd: (
    name: string,
    url: string,
    test?: TestTargetInput,
  ) => Promise<MutateResult>;
}

export default function ProjectForm({ onAdd }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  // Target repo uji per-project (opsional — kosong = pakai default server).
  const [testOwner, setTestOwner] = useState("");
  const [testRepo, setTestRepo] = useState("");
  const [testWorkflow, setTestWorkflow] = useState("");
  const [testRef, setTestRef] = useState("");
  // Link halaman hasil testing (opsional, dibuka di tab baru).
  const [testResultUrl, setTestResultUrl] = useState("");
  const [errors, setErrors] = useState<ValidationResult>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    // Validasi client lebih dulu.
    const validation: ValidationResult = {
      ...validateProjectForm(name, url),
      ...validateTestTarget(testOwner, testRepo, testWorkflow, testRef, testResultUrl),
    };
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setBusy(true);
    try {
      const res = await onAdd(name, url, {
        testOwner,
        testRepo,
        testWorkflow,
        testRef,
        testResultUrl,
      });
      if (!res.ok) {
        // Utamakan error per-field dari server (validasi server).
        if (res.fieldErrors) setErrors(res.fieldErrors);
        if (res.message) setServerError(res.message);
        return;
      }
      // Sukses → kosongkan form.
      setName("");
      setUrl("");
      setTestOwner("");
      setTestRepo("");
      setTestWorkflow("");
      setTestRef("");
      setTestResultUrl("");
      setErrors({});
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <PlusIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Tambah Project Baru
          </h2>
          <p className="text-sm text-slate-500">
            Hanya admin yang dapat menambah project.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Input nama project */}
        <div>
          <label htmlFor="project-name" className="label">
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
            className={`input ${errors.name ? "input-invalid" : ""}`}
          />
          <div className="mt-1.5 flex items-center justify-between">
            {errors.name ? (
              <p id="project-name-error" className="text-xs text-rose-600">
                {errors.name}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-500">
              {name.trim().length}/100
            </span>
          </div>
        </div>

        {/* Input link project */}
        <div>
          <label htmlFor="project-url" className="label">
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
            className={`input ${errors.url ? "input-invalid" : ""}`}
          />
          {errors.url ? (
            <p id="project-url-error" className="mt-1.5 text-xs text-rose-600">
              {errors.url}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">
              Harus berawalan http:// atau https://
            </p>
          )}
        </div>

        {/* Input link halaman hasil testing (opsional) */}
        <div className="sm:col-span-2">
          <label htmlFor="project-test-result-url" className="label">
            Link Hasil Testing{" "}
            <span className="text-xs font-normal text-slate-500">(opsional)</span>
          </label>
          <input
            id="project-test-result-url"
            type="url"
            inputMode="url"
            value={testResultUrl}
            onChange={(e) => setTestResultUrl(e.target.value)}
            placeholder="https://contoh.com/hasil-testing"
            aria-invalid={Boolean(errors.testResultUrl)}
            aria-describedby={
              errors.testResultUrl ? "project-test-result-url-error" : undefined
            }
            className={`input ${errors.testResultUrl ? "input-invalid" : ""}`}
          />
          {errors.testResultUrl ? (
            <p
              id="project-test-result-url-error"
              className="mt-1.5 text-xs text-rose-600"
            >
              {errors.testResultUrl}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">
              Ditampilkan di card project — diklik akan membuka tab baru ke
              halaman hasil testing.
            </p>
          )}
        </div>
      </div>

      {serverError && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700"
        >
          {serverError}
        </p>
      )}

      {/* Target repo uji — opsional per project */}
      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60">
        <summary className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700">
          <span className="flex min-w-0 items-center gap-2">
            <GearIcon className="h-4 w-4 shrink-0 text-slate-400" />
            Repo GitHub untuk Test
            <span className="hidden font-normal text-slate-500 sm:inline">
              (opsional — kosong = default server)
            </span>
          </span>
          <ChevronDownIcon className="summary-chevron h-4 w-4 shrink-0 text-slate-400" />
        </summary>
        <div className="grid gap-3 border-t border-slate-200 px-4 py-4 sm:grid-cols-2">
          <div>
            <label htmlFor="project-test-owner" className="mb-1.5 block text-xs font-medium text-slate-600">
              Owner GitHub
            </label>
            <input
              id="project-test-owner"
              type="text"
              value={testOwner}
              onChange={(e) => setTestOwner(e.target.value)}
              placeholder="cth: Raja-Derek"
              aria-invalid={Boolean(errors.testOwner)}
              className={`input py-2 text-sm ${errors.testOwner ? "input-invalid" : ""}`}
            />
            {errors.testOwner && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.testOwner}</p>
            )}
          </div>
          <div>
            <label htmlFor="project-test-repo" className="mb-1.5 block text-xs font-medium text-slate-600">
              Nama Repo
            </label>
            <input
              id="project-test-repo"
              type="text"
              value={testRepo}
              onChange={(e) => setTestRepo(e.target.value)}
              placeholder="cth: e2e-salesforce"
              aria-invalid={Boolean(errors.testRepo)}
              className={`input py-2 text-sm ${errors.testRepo ? "input-invalid" : ""}`}
            />
            {errors.testRepo && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.testRepo}</p>
            )}
          </div>
          <div>
            <label htmlFor="project-test-workflow" className="mb-1.5 block text-xs font-medium text-slate-600">
              File Workflow
            </label>
            <input
              id="project-test-workflow"
              type="text"
              value={testWorkflow}
              onChange={(e) => setTestWorkflow(e.target.value)}
              placeholder="cth: salesforce-flow.yml"
              aria-invalid={Boolean(errors.testWorkflow)}
              className={`input py-2 text-sm ${errors.testWorkflow ? "input-invalid" : ""}`}
            />
            {errors.testWorkflow && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.testWorkflow}</p>
            )}
          </div>
          <div>
            <label htmlFor="project-test-ref" className="mb-1.5 block text-xs font-medium text-slate-600">
              Branch
            </label>
            <input
              id="project-test-ref"
              type="text"
              value={testRef}
              onChange={(e) => setTestRef(e.target.value)}
              placeholder="cth: master"
              aria-invalid={Boolean(errors.testRef)}
              className={`input py-2 text-sm ${errors.testRef ? "input-invalid" : ""}`}
            />
            {errors.testRef && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.testRef}</p>
            )}
          </div>
        </div>
        <p className="border-t border-slate-200/70 px-4 py-3 text-xs text-slate-500">
          Owner &amp; repo wajib diisi bersamaan. Workflow tanpa inputs didukung —
          dispatch hanya mengirim branch.
        </p>
      </details>

      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={busy} className="btn btn-primary w-full sm:w-auto">
          {busy ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Menyimpan…
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Simpan Project
            </>
          )}
        </button>
      </div>
    </form>
  );
}
