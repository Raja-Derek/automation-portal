// Util validasi form project.
// Dipakai oleh form tambah maupun modal edit agar aturannya konsisten.

import { PROJECT_ENVIRONMENTS } from "@/types/project";

export interface ValidationResult {
  name?: string;
  url?: string;
  category?: string;
  environment?: string;
  description?: string;
  testOwner?: string;
  testRepo?: string;
  testWorkflow?: string;
  testRef?: string;
  testResultUrl?: string;
}

/**
 * Validasi nama project.
 * - Wajib diisi (setelah trim tidak boleh kosong).
 * - Maksimal 100 karakter.
 */
export function validateProjectName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Nama project wajib diisi.";
  }
  if (trimmed.length > 100) {
    return "Nama project maksimal 100 karakter.";
  }
  return undefined;
}

/**
 * Validasi URL project.
 * - Wajib diisi.
 * - Harus berupa URL valid berawalan http:// atau https://.
 */
export function validateProjectUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Link project wajib diisi.";
  }
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return "Link harus berupa URL valid berawalan http:// atau https://.";
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Link harus berupa URL valid berawalan http:// atau https://.";
    }
  } catch {
    return "Link harus berupa URL valid berawalan http:// atau https://.";
  }
  return undefined;
}

/** Validasi kedua field sekaligus, mengembalikan object error per field. */
export function validateProjectForm(
  name: string,
  url: string,
): ValidationResult {
  const errors: ValidationResult = {};
  const nameError = validateProjectName(name);
  const urlError = validateProjectUrl(url);
  if (nameError) errors.name = nameError;
  if (urlError) errors.url = urlError;
  return errors;
}

const GITHUB_NAME_RE = /^[A-Za-z0-9_.-]+$/;

/** Karakter yang boleh dipakai pada nama kategori. */
const CATEGORY_RE = /^[\p{L}\p{N} &/.-]+$/u;

/** Validasi kategori (opsional, maks. 60 karakter). */
export function validateCategory(category: string): string | undefined {
  const trimmed = category.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 60) return "Kategori maksimal 60 karakter.";
  if (!CATEGORY_RE.test(trimmed)) {
    return "Kategori hanya boleh berisi huruf, angka, spasi, &, /, titik, atau strip.";
  }
  return undefined;
}

/** Validasi environment (opsional, harus salah satu opsi terdaftar). */
export function validateEnvironment(environment: string): string | undefined {
  const trimmed = environment.trim();
  if (!trimmed) return undefined;
  if (!PROJECT_ENVIRONMENTS.some((e) => e.value === trimmed)) {
    return "Environment tidak dikenal.";
  }
  return undefined;
}

/** Validasi deskripsi singkat (opsional, maks. 160 karakter). */
export function validateDescription(
  description: string,
): string | undefined {
  const trimmed = description.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 160) return "Deskripsi maksimal 160 karakter.";
  return undefined;
}

/** Validasi metadata project (kategori, environment, deskripsi). */
export function validateProjectMeta(
  category: string,
  environment: string,
  description: string,
): ValidationResult {
  const errors: ValidationResult = {};
  const categoryError = validateCategory(category);
  const environmentError = validateEnvironment(environment);
  const descriptionError = validateDescription(description);
  if (categoryError) errors.category = categoryError;
  if (environmentError) errors.environment = environmentError;
  if (descriptionError) errors.description = descriptionError;
  return errors;
}

/** Validasi owner repo GitHub (opsional, kosong = pakai default server). */
export function validateTestOwner(owner: string): string | undefined {
  const trimmed = owner.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 100 || !GITHUB_NAME_RE.test(trimmed)) {
    return "Owner GitHub tidak valid (huruf, angka, titik, strip, underscore).";
  }
  return undefined;
}

/** Validasi nama repo GitHub (opsional, kosong = pakai default server). */
export function validateTestRepo(repo: string): string | undefined {
  const trimmed = repo.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 100 || !GITHUB_NAME_RE.test(trimmed)) {
    return "Nama repo GitHub tidak valid (huruf, angka, titik, strip, underscore).";
  }
  return undefined;
}

/** Validasi nama file workflow (opsional, kosong = pakai default server). */
export function validateTestWorkflow(workflow: string): string | undefined {
  const trimmed = workflow.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 255 || !/^[A-Za-z0-9_.\/-]+\.ya?ml$/i.test(trimmed)) {
    return "File workflow tidak valid (mis. salesforce-flow.yml).";
  }
  return undefined;
}

/** Validasi branch dispatch (opsional, kosong = pakai default server). */
export function validateTestRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 255 || /[\s~^:?*[\]\\]/.test(trimmed)) {
    return "Branch tidak valid.";
  }
  return undefined;
}

/** Validasi link halaman hasil testing (opsional, kosong = tidak diatur). */
export function validateTestResultUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return "Link hasil testing harus berawalan http:// atau https://.";
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Link hasil testing harus berawalan http:// atau https://.";
    }
  } catch {
    return "Link hasil testing harus berupa URL valid.";
  }
  return undefined;
}

/** Validasi target repo uji per-project (semua field opsional). */
export function validateTestTarget(
  owner: string,
  repo: string,
  workflow: string,
  ref: string,
  resultUrl: string = "",
): ValidationResult {
  const errors: ValidationResult = {};
  const ownerError = validateTestOwner(owner);
  const repoError = validateTestRepo(repo);
  const workflowError = validateTestWorkflow(workflow);
  const refError = validateTestRef(ref);
  const resultUrlError = validateTestResultUrl(resultUrl);
  if (ownerError) errors.testOwner = ownerError;
  if (repoError) errors.testRepo = repoError;
  if (workflowError) errors.testWorkflow = workflowError;
  if (refError) errors.testRef = refError;
  if (resultUrlError) errors.testResultUrl = resultUrlError;
  // Owner & repo harus diisi berpasangan (tidak boleh hanya salah satu).
  const hasOwner = owner.trim() !== "";
  const hasRepo = repo.trim() !== "";
  if (hasOwner !== hasRepo) {
    const msg = "Owner dan repo harus diisi bersamaan (atau kosongkan keduanya).";
    if (!errors.testOwner && hasOwner) errors.testOwner = msg;
    if (!errors.testRepo && hasRepo) errors.testRepo = msg;
  }
  return errors;
}
