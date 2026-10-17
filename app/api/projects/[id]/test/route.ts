// /api/projects/[id]/test — Trigger & status uji GitHub Action per project.
// - GET:  PUBLIK (tanpa login boleh melihat label Tested / sedang berjalan).
// - POST: admin saja (trigger workflow_dispatch ke GitHub).
// Catatan Next.js 16: params adalah Promise, wajib di-await.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  findProject,
  updateProjectTest,
} from "@/lib/projects-store";
import {
  dispatchWorkflow,
  resolveTestTarget,
  getLatestRun,
} from "@/lib/github";

type Ctx = RouteContext<"/api/projects/[id]/test">;

// GET: kembalikan project + status uji terkini (polling GitHub bila running).
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const project = findProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project tidak ditemukan." }, { status: 404 });
  }

  // Belum pernah diuji → langsung kembalikan apa adanya.
  if (project.testStatus !== "running") {
    return NextResponse.json({ project });
  }

  // Sedang running → coba sinkronkan dengan GitHub (best effort).
  // Target repo diambil per-project (field project > default env).
  const cfg = resolveTestTarget(project);
  if (!cfg.ok) {
    // Tanpa config GitHub, status tersimpan tetap dikembalikan.
    return NextResponse.json({ project });
  }

  const latest = await getLatestRun(cfg.config, {
    createdAfter: project.testStartedAt,
    projectId: project.id,
  });
  if (!latest.ok || !latest.run) {
    // Run baru belum terdaftar di GitHub (atau API gagal sesaat) →
    // pertahankan status "running" agar tidak salah menampilkan gagal/sukses.
    return NextResponse.json({ project });
  }
  const run = latest.run;

  // Run masih antre/berjalan → update URL run bila sudah diketahui.
  if (run.status !== "completed") {
    const updated =
      updateProjectTest(project.id, {
        testStatus: "running",
        testStartedAt: project.testStartedAt ?? new Date().toISOString(),
        testFinishedAt: undefined,
        testHtmlUrl: run.html_url,
        testRunId: run.id,
      }) ?? project;
    return NextResponse.json({ project: updated });
  }

  // Run selesai → petakan conclusion ke Tested (success) / gagal.
  const success = run.conclusion === "success";
  const updated =
    updateProjectTest(project.id, {
      testStatus: success ? "success" : "failed",
      testStartedAt: project.testStartedAt ?? run.created_at,
      testFinishedAt: new Date().toISOString(),
      testHtmlUrl: run.html_url,
      testRunId: run.id,
    }) ?? project;
  return NextResponse.json({ project: updated });
}

// POST: trigger workflow_dispatch (admin saja).
export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const project = findProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project tidak ditemukan." }, { status: 404 });
  }

  const cfg = resolveTestTarget(project);
  if (!cfg.ok) {
    return NextResponse.json({ error: cfg.message }, { status: 500 });
  }

  const dispatched = await dispatchWorkflow(cfg.config);
  if (!dispatched.ok) {
    return NextResponse.json({ error: dispatched.message }, { status: 502 });
  }

  const updated = updateProjectTest(project.id, {
    testStatus: "running",
    testStartedAt: new Date().toISOString(),
    testFinishedAt: undefined,
    testHtmlUrl: project.testHtmlUrl,
    testRunId: project.testRunId,
  });

  return NextResponse.json(
    { project: updated ?? project, message: "GitHub Action dipicu. Memantau status…" },
    { status: 202 },
  );
}
