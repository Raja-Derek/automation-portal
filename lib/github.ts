// Helper GitHub Actions via REST API (dipakai Route Handler server saja).
// Setiap project punya target repo SENDIRI (disimpan per-project saat
// tambah/edit). Env GITHUB_* hanya sebagai DEFAULT bila project tidak
// mengatur targetnya sendiri:
// - GITHUB_OWNER        default owner (mis. "Raja-Derek")
// - GITHUB_REPO         default repo (mis. "e2e-salesforce")
// - GITHUB_WORKFLOW_FILE default file workflow (mis. "salesforce-flow.yml")
// - GITHUB_TOKEN        PAT dengan scope "repo" + "actions:write" (wajib,
//                       harus punya akses ke SEMUA repo target project)
// - GITHUB_REF          default branch (mis. "master")
//
// Workflow di repo target WAJIB punya trigger `on: workflow_dispatch`.
// Catatan: workflow target (salesforce-flow.yml) mendefinisikan
// `workflow_dispatch` TANPA inputs, jadi dispatch hanya mengirim `ref`
// (tanpa `inputs`) agar tidak ditolak GitHub dengan error 422
// "Unexpected inputs provided".

import type { Project } from "@/types/project";

export interface GithubConfig {
  owner: string;
  repo: string;
  workflowFile: string;
  token: string;
  ref: string;
}

/** Baca konfigurasi dari env. Return error string jika belum lengkap. */
export function getGithubConfig():
  | { ok: true; config: GithubConfig }
  | { ok: false; message: string } {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();
  const ref = process.env.GITHUB_REF?.trim() || "master";

  const missing: string[] = [];
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");
  if (!workflowFile) missing.push("GITHUB_WORKFLOW_FILE");
  if (!token) missing.push("GITHUB_TOKEN");
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Konfigurasi GitHub belum lengkap (${missing.join(", ")}). Isi di .env / env Vercel.`,
    };
  }
  return {
    ok: true,
    config: { owner, repo, workflowFile, token, ref } as GithubConfig,
  };
}

/**
 * Tentukan target dispatch untuk satu project.
 * Prioritas: field per-project > default env.
 * Token selalu dari env. Owner & repo harus berpasangan (validasi form
 * sudah menjamin), bila tidak lengkap → pakai default env / error.
 */
export function resolveTestTarget(project: Project):
  | { ok: true; config: GithubConfig }
  | { ok: false; message: string } {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      message:
        "GITHUB_TOKEN belum diisi. Isi di .env / env Vercel (token butuh akses ke semua repo target project).",
    };
  }
  const owner = project.testOwner?.trim() || process.env.GITHUB_OWNER?.trim();
  const repo = project.testRepo?.trim() || process.env.GITHUB_REPO?.trim();
  const workflowFile =
    project.testWorkflow?.trim() || process.env.GITHUB_WORKFLOW_FILE?.trim();
  const ref =
    project.testRef?.trim() || process.env.GITHUB_REF?.trim() || "master";

  const missing: string[] = [];
  if (!owner) missing.push("owner repo (isi di form Edit project / env GITHUB_OWNER)");
  if (!repo) missing.push("nama repo (isi di form Edit project / env GITHUB_REPO)");
  if (!workflowFile) missing.push("file workflow (isi di form Edit project / env GITHUB_WORKFLOW_FILE)");
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Target uji project "${project.name}" belum lengkap (${missing.join(", ")}).`,
    };
  }
  return {
    ok: true,
    config: { owner, repo, workflowFile, token, ref } as GithubConfig,
  };
}

function ghHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Trigger workflow_dispatch pada repo target (tanpa inputs). */
export async function dispatchWorkflow(
  cfg: GithubConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const endpoint = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${encodeURIComponent(cfg.workflowFile)}/dispatches`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { ...ghHeaders(cfg.token), "Content-Type": "application/json" },
      // Tanpa `inputs`: workflow target tidak mendeklarasikan inputs apa pun.
      body: JSON.stringify({ ref: cfg.ref }),
    });
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi GitHub API." };
  }
  // GitHub return 204 saat dispatch diterima.
  if (res.status === 204) return { ok: true };
  let detail = "";
  try {
    const data = (await res.json()) as { message?: string };
    if (data.message) detail = ` — ${data.message}`;
  } catch {
    /* abaikan body non-JSON */
  }
  if (res.status === 404) {
    return {
      ok: false,
      message:
        `Workflow tidak ditemukan (404) di ${cfg.owner}/${cfg.repo} — ${cfg.workflowFile}${detail}. Cek target repo di form Edit project dan pastikan workflow punya trigger workflow_dispatch.`,
    };
  }
  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      message: `GitHub menolak token (${res.status})${detail}. Cek GITHUB_TOKEN (scope repo + actions:write).`,
    };
  }
  return { ok: false, message: `GitHub API gagal (${res.status})${detail}.` };
}

export interface WorkflowRunInfo {
  id: number;
  status: string | null; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled | ...
  html_url: string;
  created_at: string;
  updated_at: string;
}

// Toleransi clock skew antara server aplikasi dan GitHub (ms).
// Dispatch mengembalikan 204 sebelum run terdaftar, jadi run baru bisa
// punya created_at sedikit lebih awal dari testStartedAt yang kita catat.
const RUN_CREATED_AT_TOLERANCE_MS = 10_000;

/** Cari run terbaru untuk workflow di branch ref.
 * HANYA mengembalikan run yang dibuat setelah `createdAfter` (waktu dispatch)
 * agar run lama yang sudah selesai tidak salah dipakai saat run baru belum
 * terdaftar di GitHub. Bila belum ada → run: null (pemanggil tetap "running").
 * Pencocokan projectId bersifat best-effort untuk workflow yang memakai
 * run-name berisi id project. */
export async function getLatestRun(
  cfg: GithubConfig,
  opts: { createdAfter?: string; projectId?: string } = {},
): Promise<{ ok: true; run: WorkflowRunInfo | null } | { ok: false; message: string }> {
  // Ambil 20 run terbaru di branch ref; saring per event & waktu dispatch.
  const endpoint =
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/` +
    `${encodeURIComponent(cfg.workflowFile)}/runs?per_page=20&branch=${encodeURIComponent(cfg.ref)}`;
  let res: Response;
  try {
    res = await fetch(endpoint, { headers: ghHeaders(cfg.token), cache: "no-store" });
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi GitHub API." };
  }
  if (!res.ok) {
    return { ok: false, message: `Gagal membaca status run (${res.status}).` };
  }
  const data = (await res.json()) as {
    workflow_runs?: Array<{
      id: number;
      name?: string | null;
      display_title?: string | null;
      event?: string | null;
      status: string | null;
      conclusion: string | null;
      html_url: string;
      created_at: string;
      updated_at: string;
    }>;
  };

  const createdAfterMs = opts.createdAfter ? Date.parse(opts.createdAfter) : NaN;
  const runs = (data.workflow_runs ?? []).filter((r) => {
    // Uji hanya mengirim workflow_dispatch; abaikan run dari event lain (push, dll).
    if (r.event && r.event !== "workflow_dispatch") return false;
    // Abaikan run yang dibuat sebelum kita menekan tombol Test.
    if (!Number.isNaN(createdAfterMs)) {
      const t = Date.parse(r.created_at);
      if (Number.isNaN(t) || t < createdAfterMs - RUN_CREATED_AT_TOLERANCE_MS) {
        return false;
      }
    }
    return true;
  });

  // Prefer run yang menyebut projectId (jika workflow memakai run-name dengan input),
  // fallback ke run terbaru yang cocok.
  const projectId = opts.projectId?.trim();
  const matched =
    (projectId
      ? runs.find(
          (r) =>
            (r.name ?? "").includes(projectId) ||
            (r.display_title ?? "").includes(projectId),
        )
      : undefined) ?? runs[0] ?? null;
  if (!matched) return { ok: true, run: null };
  return {
    ok: true,
    run: {
      id: matched.id,
      status: matched.status,
      conclusion: matched.conclusion,
      html_url: matched.html_url,
      created_at: matched.created_at,
      updated_at: matched.updated_at,
    },
  };
}
