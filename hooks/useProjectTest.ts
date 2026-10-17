"use client";

// Hook status uji GitHub Action per project.
// - GET /api/projects/[id]/test (publik) untuk baca status.
// - POST .../test (admin) untuk trigger.
// - Polling tiap 5 detik selama status "running", berhenti saat success/failed.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project, TestStatus } from "@/types/project";

interface TestState {
  status: TestStatus;
  startedAt?: string;
  finishedAt?: string;
  htmlUrl?: string;
  runId?: number;
}

type TestFields = Pick<Project, "testStatus" | "testStartedAt" | "testFinishedAt" | "testHtmlUrl" | "testRunId">;

function toState(p: TestFields): TestState {
  return {
    status: p.testStatus ?? "idle",
    startedAt: p.testStartedAt,
    finishedAt: p.testFinishedAt,
    htmlUrl: p.testHtmlUrl,
    runId: p.testRunId,
  };
}

export function useProjectTest(project: Pick<Project, "id" | "testStatus" | "testStartedAt" | "testFinishedAt" | "testHtmlUrl" | "testRunId">) {
  const [state, setState] = useState<TestState>(() => toState(project));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sinkronkan saat project dari server berubah (mis. reload list).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(toState(project));
  }, [project]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/test`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { project: Project };
      setState(toState(data.project));
    } catch {
      /* polling best-effort: abaikan error jaringan sesaat */
    }
  }, [project.id]);

  // Polling selama running.
  useEffect(() => {
    if (state.status !== "running") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    // Refresh langsung sekali, lalu tiap 5 detik.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    pollRef.current = setInterval(() => {
      void refresh();
    }, 5000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [state.status, refresh]);

  const trigger = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/test`,
        { method: "POST" },
      );
      const data = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok || !data.project) {
        setError(data.error ?? `Gagal memicu action (${res.status}).`);
        return false;
      }
      setState(toState(data.project));
      return true;
    } catch {
      setError("Gagal memicu action. Periksa koneksi.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [project.id]);

  return { ...state, busy, error, trigger, refresh };
}
