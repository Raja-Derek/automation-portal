"use client";

// Hook project BERBASIS SERVER.
// - GET /api/projects PUBLIK (tanpa login boleh melihat).
// - POST/PUT/DELETE hanya lolos jika admin (server me-return 401/403).
// Frontend menyembunyikan tombol untuk non-admin, TAPI keamanan sebenarnya
// ada di Route Handler (requireAdmin) + proxy.ts — bukan di UI.

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/types/project";
import type { ProjectInput } from "@/lib/projects-store";
import type { ValidationResult } from "@/lib/validation";

export interface MutateResult {
  ok: boolean;
  message?: string;
  fieldErrors?: ValidationResult;
}

async function parseError(res: Response): Promise<{
  message: string;
  fields?: ValidationResult;
}> {
  try {
    const data = (await res.json()) as {
      error?: string;
      fields?: ValidationResult;
    };
    return { message: data.error || `Gagal (${res.status}).`, fields: data.fields };
  } catch {
    return { message: `Gagal (${res.status}).` };
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // Pesan error global (mis. 401/403 dari server) untuk ditampilkan di UI.
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) {
        const { message } = await parseError(res);
        setError(message);
        return;
      }
      const data = (await res.json()) as { projects: Project[] };
      setProjects(data.projects);
    } catch {
      setError("Tidak dapat memuat daftar project. Periksa koneksi.");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Muat daftar dari API server (sistem eksternal) — pola yang sah.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const addProject = useCallback(
    async (name: string, url: string, input?: ProjectInput): Promise<MutateResult> => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, url, ...input }),
        });
        if (!res.ok) {
          const { message, fields } = await parseError(res);
          return { ok: false, message, fieldErrors: fields };
        }
        const data = (await res.json()) as { project: Project };
        setProjects((prev) => [data.project, ...prev]);
        return { ok: true };
      } catch {
        return { ok: false, message: "Gagal menyimpan. Periksa koneksi." };
      }
    },
    [],
  );

  const updateProject = useCallback(
    async (
      id: string,
      name: string,
      url: string,
      input?: ProjectInput,
    ): Promise<MutateResult> => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, url, ...input }),
        });
        if (!res.ok) {
          const { message, fields } = await parseError(res);
          return { ok: false, message, fieldErrors: fields };
        }
        const data = (await res.json()) as { project: Project };
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? data.project : p)),
        );
        return { ok: true };
      } catch {
        return { ok: false, message: "Gagal menyimpan. Periksa koneksi." };
      }
    },
    [],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<MutateResult> => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const { message } = await parseError(res);
          return { ok: false, message };
        }
        setProjects((prev) => prev.filter((p) => p.id !== id));
        return { ok: true };
      } catch {
        return { ok: false, message: "Gagal menghapus. Periksa koneksi." };
      }
    },
    [],
  );

  return {
    projects,
    isLoaded,
    error,
    reload,
    addProject,
    updateProject,
    deleteProject,
  };
}
