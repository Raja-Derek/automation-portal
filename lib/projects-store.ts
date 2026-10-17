// Penyimpanan project di sisi server (in-memory untuk demo tanpa DB).
// Semua operasi tulis WAJIB lewat Route Handler yang sudah guard admin.
// ASUMSI sama seperti users.ts: reset saat cold-start; produksi pakai DB.

import type { Project, TestStatus } from "@/types/project";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const globalStore = globalThis as unknown as {
  __apProjects?: Project[];
  __apProjectsSeeded?: boolean;
};

function getStore(): Project[] {
  if (!globalStore.__apProjects) globalStore.__apProjects = [];
  return globalStore.__apProjects;
}

function setStore(next: Project[]): void {
  globalStore.__apProjects = next;
}

/** Seed 2 contoh agar halaman tidak kosong saat pertama dibuka. */
export function ensureProjectSeeded(): void {
  if (globalStore.__apProjectsSeeded) return;
  globalStore.__apProjectsSeeded = true;
  if (getStore().length === 0) {
    const now = new Date().toISOString();
    setStore([
      {
        id: createId(),
        name: "n8n Production",
        url: "https://n8n.io",
        createdAt: now,
      },
      {
        id: createId(),
        name: "Dokumentasi Next.js",
        url: "https://nextjs.org/docs",
        createdAt: now,
      },
    ]);
  }
}

export function listProjects(): Project[] {
  ensureProjectSeeded();
  // Kembalikan salinan, paling baru di atas.
  return [...getStore()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

/** Target repo uji per-project (semua opsional, string kosong = tidak diatur). */
export interface ProjectTestTargetInput {
  testOwner?: string;
  testRepo?: string;
  testWorkflow?: string;
  testRef?: string;
  testResultUrl?: string;
}

/** Normalisasi input target: trim, string kosong → undefined (tidak diatur). */
function normalizeTestTarget(input: ProjectTestTargetInput): ProjectTestTargetInput {
  const norm = (v: string | undefined): string | undefined => {
    const t = (v ?? "").trim();
    return t ? t : undefined;
  };
  return {
    testOwner: norm(input.testOwner),
    testRepo: norm(input.testRepo),
    testWorkflow: norm(input.testWorkflow),
    testRef: norm(input.testRef),
    testResultUrl: norm(input.testResultUrl),
  };
}

export function createProject(
  name: string,
  url: string,
  test?: ProjectTestTargetInput,
): Project {
  ensureProjectSeeded();
  const project: Project = {
    id: createId(),
    name: name.trim(),
    url: url.trim(),
    createdAt: new Date().toISOString(),
    ...normalizeTestTarget(test ?? {}),
  };
  setStore([project, ...getStore()]);
  return project;
}

export function updateProject(
  id: string,
  name: string,
  url: string,
  test?: ProjectTestTargetInput,
): Project | null {
  ensureProjectSeeded();
  let updated: Project | null = null;
  const target = normalizeTestTarget(test ?? {});
  setStore(
    getStore().map((p) => {
      if (p.id !== id) return p;
      updated = {
        ...p,
        name: name.trim(),
        url: url.trim(),
        testOwner: target.testOwner,
        testRepo: target.testRepo,
        testWorkflow: target.testWorkflow,
        testRef: target.testRef,
        testResultUrl: target.testResultUrl,
      };
      return updated;
    }),
  );
  return updated;
}

export function deleteProject(id: string): boolean {
  ensureProjectSeeded();
  const before = getStore().length;
  setStore(getStore().filter((p) => p.id !== id));
  return getStore().length < before;
}

/** Cari satu project berdasarkan ID (publik, untuk endpoint status uji). */
export function findProject(id: string): Project | null {
  ensureProjectSeeded();
  return getStore().find((p) => p.id === id) ?? null;
}

/** Update info uji GitHub Action untuk satu project. */
export function updateProjectTest(
  id: string,
  patch: Pick<
    Project,
    | "testStatus"
    | "testStartedAt"
    | "testFinishedAt"
    | "testHtmlUrl"
    | "testRunId"
  > & { testStatus: TestStatus },
): Project | null {
  ensureProjectSeeded();
  let updated: Project | null = null;
  setStore(
    getStore().map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch };
      return updated;
    }),
  );
  return updated;
}
