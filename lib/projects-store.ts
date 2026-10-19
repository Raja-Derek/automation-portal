// Penyimpanan project di PostgreSQL (tabel `projects`).
// Semua operasi tulis WAJIB lewat Route Handler yang sudah guard admin.
// Skema & data contoh dibuat otomatis oleh lib/db.ts (ensureSchema).

import { createId, query } from "@/lib/db";
import type { Project, TestStatus } from "@/types/project";

interface ProjectRow {
  id: string;
  name: string;
  url: string;
  created_at: Date;
  test_status: TestStatus | null;
  test_started_at: Date | null;
  test_finished_at: Date | null;
  test_html_url: string | null;
  test_run_id: string | null;
  test_owner: string | null;
  test_repo: string | null;
  test_workflow: string | null;
  test_ref: string | null;
  test_result_url: string | null;
}

function toProject(row: ProjectRow): Project {
  // String kosong pada field opsional dianggap "tidak diatur" (undefined).
  const opt = (v: string | null): string | undefined =>
    v === null || v === "" ? undefined : v;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    createdAt: row.created_at.toISOString(),
    testStatus: row.test_status ?? undefined,
    testStartedAt: row.test_started_at?.toISOString(),
    testFinishedAt: row.test_finished_at?.toISOString(),
    testHtmlUrl: opt(row.test_html_url),
    testRunId: row.test_run_id === null ? undefined : Number(row.test_run_id),
    testOwner: opt(row.test_owner),
    testRepo: opt(row.test_repo),
    testWorkflow: opt(row.test_workflow),
    testRef: opt(row.test_ref),
    testResultUrl: opt(row.test_result_url),
  };
}

const PROJECT_COLUMNS = `id, name, url, created_at, test_status, test_started_at,
  test_finished_at, test_html_url, test_run_id, test_owner, test_repo,
  test_workflow, test_ref, test_result_url`;

export async function listProjects(): Promise<Project[]> {
  const rows = await query<ProjectRow>(
    `SELECT ${PROJECT_COLUMNS} FROM projects ORDER BY created_at DESC`,
  );
  return rows.map(toProject);
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
function normalizeTestTarget(
  input: ProjectTestTargetInput,
): Required<ProjectTestTargetInput> {
  const norm = (v: string | undefined): string => (v ?? "").trim();
  return {
    testOwner: norm(input.testOwner),
    testRepo: norm(input.testRepo),
    testWorkflow: norm(input.testWorkflow),
    testRef: norm(input.testRef),
    testResultUrl: norm(input.testResultUrl),
  };
}

export async function createProject(
  name: string,
  url: string,
  test?: ProjectTestTargetInput,
): Promise<Project> {
  const t = normalizeTestTarget(test ?? {});
  const rows = await query<ProjectRow>(
    `INSERT INTO projects
       (id, name, url, test_owner, test_repo, test_workflow, test_ref, test_result_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PROJECT_COLUMNS}`,
    [
      createId(),
      name.trim(),
      url.trim(),
      t.testOwner,
      t.testRepo,
      t.testWorkflow,
      t.testRef,
      t.testResultUrl,
    ],
  );
  return toProject(rows[0]);
}

export async function updateProject(
  id: string,
  name: string,
  url: string,
  test?: ProjectTestTargetInput,
): Promise<Project | null> {
  const t = normalizeTestTarget(test ?? {});
  const rows = await query<ProjectRow>(
    `UPDATE projects SET
       name = $2, url = $3, test_owner = $4, test_repo = $5,
       test_workflow = $6, test_ref = $7, test_result_url = $8
     WHERE id = $1
     RETURNING ${PROJECT_COLUMNS}`,
    [
      id,
      name.trim(),
      url.trim(),
      t.testOwner,
      t.testRepo,
      t.testWorkflow,
      t.testRef,
      t.testResultUrl,
    ],
  );
  return rows[0] ? toProject(rows[0]) : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    "DELETE FROM projects WHERE id = $1 RETURNING id",
    [id],
  );
  return rows.length > 0;
}

/** Cari satu project berdasarkan ID (publik, untuk endpoint status uji). */
export async function findProject(id: string): Promise<Project | null> {
  const rows = await query<ProjectRow>(
    `SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`,
    [id],
  );
  return rows[0] ? toProject(rows[0]) : null;
}

/** Update info uji GitHub Action untuk satu project. */
export async function updateProjectTest(
  id: string,
  patch: Pick<
    Project,
    | "testStatus"
    | "testStartedAt"
    | "testFinishedAt"
    | "testHtmlUrl"
    | "testRunId"
  > & { testStatus: TestStatus },
): Promise<Project | null> {
  const rows = await query<ProjectRow>(
    `UPDATE projects SET
       test_status = $2, test_started_at = $3, test_finished_at = $4,
       test_html_url = $5, test_run_id = $6
     WHERE id = $1
     RETURNING ${PROJECT_COLUMNS}`,
    [
      id,
      patch.testStatus,
      patch.testStartedAt ?? null,
      patch.testFinishedAt ?? null,
      patch.testHtmlUrl ?? null,
      patch.testRunId ?? null,
    ],
  );
  return rows[0] ? toProject(rows[0]) : null;
}
