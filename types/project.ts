// Tipe data utama untuk satu project.
// Disimpan di PostgreSQL (tabel `projects`).

/** Lingkungan deployment — dipakai untuk badge pada card. */
export type ProjectEnvironment = "dev" | "staging" | "production" | "sandbox";

/** Opsi environment + label yang ditampilkan di UI. */
export const PROJECT_ENVIRONMENTS: ReadonlyArray<{
  value: ProjectEnvironment;
  label: string;
}> = [
  { value: "dev", label: "Dev" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "sandbox", label: "Prod Sandbox" },
];

/** Saran kategori untuk form — tetap bebas diketik. */
export const CATEGORY_SUGGESTIONS: readonly string[] = [
  "Salesforce CRM",
  "Web Apps",
  "Core Services & API",
];

export interface Project {
  /** ID unik project (dibuat dengan crypto.randomUUID / fallback). */
  id: string;
  /** Nama project, maks. 100 karakter. */
  name: string;
  /** URL project, harus berawalan http:// atau https://. */
  url: string;
  /** Waktu pembuatan dalam ISO string, untuk urutan tampilan. */
  createdAt: string;
  /** Kategori bebas (mis. "Salesforce CRM"), maks. 60 karakter. */
  category?: string;
  /** Lingkungan deployment, untuk badge warna. */
  environment?: ProjectEnvironment;
  /** Deskripsi singkat, maks. 160 karakter. */
  description?: string;
  /** Status uji GitHub Action terakhir (opsional, diisi server). */
  testStatus?: TestStatus;
  /** Waktu mulai uji terakhir (ISO string). */
  testStartedAt?: string;
  /** Waktu selesai uji terakhir (ISO string). */
  testFinishedAt?: string;
  /** URL halaman run GitHub Action (untuk tombol "Lihat run"). */
  testHtmlUrl?: string;
  /** ID run GitHub Action terakhir. */
  testRunId?: number;
  /** Owner repo GitHub tempat workflow uji berada (per-project, mis. "Raja-Derek"). */
  testOwner?: string;
  /** Nama repo GitHub tempat workflow uji berada (per-project, mis. "e2e-salesforce"). */
  testRepo?: string;
  /** Nama file workflow (per-project, mis. "salesforce-flow.yml"). */
  testWorkflow?: string;
  /** Branch repo uji untuk dispatch (per-project, mis. "master"). */
  testRef?: string;
  /** Link halaman hasil testing (per-project, opsional). */
  testResultUrl?: string;
}

/** Status uji project via GitHub Action. */
export type TestStatus = "idle" | "running" | "success" | "failed";

// Input form saat tambah / edit project.
export interface ProjectFormValues {
  name: string;
  url: string;
  /** Kategori bebas, maks. 60 karakter. */
  category?: string;
  /** Environment terpilih (kosong = tidak diatur). */
  environment?: string;
  /** Deskripsi singkat, maks. 160 karakter. */
  description?: string;
  /** Opsional: target repo uji per-project (kosong = pakai default env server). */
  testOwner?: string;
  testRepo?: string;
  testWorkflow?: string;
  testRef?: string;
  /** Opsional: link halaman hasil testing untuk dibuka di tab baru. */
  testResultUrl?: string;
}
