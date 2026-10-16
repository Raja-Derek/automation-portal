// Penyimpanan project di sisi server (in-memory untuk demo tanpa DB).
// Semua operasi tulis WAJIB lewat Route Handler yang sudah guard admin.
// ASUMSI sama seperti users.ts: reset saat cold-start; produksi pakai DB.

import type { Project } from "@/types/project";

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

export function createProject(name: string, url: string): Project {
  ensureProjectSeeded();
  const project: Project = {
    id: createId(),
    name: name.trim(),
    url: url.trim(),
    createdAt: new Date().toISOString(),
  };
  setStore([project, ...getStore()]);
  return project;
}

export function updateProject(
  id: string,
  name: string,
  url: string,
): Project | null {
  ensureProjectSeeded();
  let updated: Project | null = null;
  setStore(
    getStore().map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, name: name.trim(), url: url.trim() };
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
