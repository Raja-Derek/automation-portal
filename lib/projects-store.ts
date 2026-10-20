// Penyimpanan project di PostgreSQL (tabel `projects`).
// Semua operasi tulis WAJIB lewat Route Handler yang sudah guard admin.
// Skema & data contoh dibuat otomatis oleh lib/db.ts (ensureSchema).

import { createId, query } from "@/lib/db";
import type { Project, ProjectEnvironment, TestStatus } from "@/types/project";

interface ProjectRow {
  id: string;
  name: string;
  url: string;
  created_at: Date;
  category: string | null;
  environment: string | null;
  description: string | null;
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

// String kosong pada kolom opsional berarti "tidak diatur" → undefined.
function opt(value: string | null): string | undefined {
  return value === null || value === "" ? undefined : value;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    createdAt: row.created_at.toISOString(),
    category: opt(row.category),
    environment: (opt(row.environment) as ProjectEnvironment | undefined) ?? undefined,
    description: opt(row.description),
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

const PROJECT_COLUMNS = `id, name, url, created_at, category, environment,
  description, test_status, test_started_at, test_finished_at, test_html_url,
  test_run_id, test_owner, test_repo, test_workflow, test_ref, test_result_url`;

export async function listProjects(): Promise<Project[]> {
  const rows = await query<ProjectRow>(
    `SELECT ${PROJECT_COLUMNS} FROM projects ORDER BY created_at DESC`,
  );
  return rows.map(toProject);
}

/**
 * Input metadata project. Semua opsional; string kosong = tidak diatur
 * (dikosongkan dari database, bukan disimpan sebagai string kosong).
 */
export interface ProjectInput {
  category?: string;
  environment?: string;
  description?: string;
  /** Target repo uji per-project. */
  testOwner?: string;
  testRepo?: string;
  testWorkflow?: string;
  testRef?: string;
  testResultUrl?: string;
}

/** Normalisasi input: trim, string kosong → string kosong (NULL di SQL). */
function normalize(input: ProjectInput): Required<ProjectInput> {
  const norm = (v: string | undefined): string => (v ?? "").trim();
  return {
    category: norm(input.category),
    environment: norm(input.environment),
    description: norm(input.description),
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
  input?: ProjectInput,
): Promise<Project> {
  const v = normalize(input ?? {});
  const rows = await query<ProjectRow>(
    `INSERT INTO projects
       (id, name, url, category, environment, description,
        test_owner, test_repo, test_workflow, test_ref, test_result_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${PROJECT_COLUMNS}`,
    [
      createId(),
      name.trim(),
      url.trim(),
      v.category,
      v.environment,
      v.description,
      v.testOwner,
      v.testRepo,
      v.testWorkflow,
      v.testRef,
      v.testResultUrl,
    ],
  );
  return toProject(rows[0]);
}

export async function updateProject(
  id: string,
  name: string,
  url: string,
  input?: ProjectInput,
): Promise<Project | null> {
  const v = normalize(input ?? {});
  const rows = await query<ProjectRow>(
    `UPDATE projects SET
       name = $2, url = $3, category = $4, environment = $5, description = $6,
       test_owner = $7, test_repo = $8, test_workflow = $9, test_ref = $10,
       test_result_url = $11
     WHERE id = $1
     RETURNING ${PROJECT_COLUMNS}`,
    [
      id,
      name.trim(),
      url.trim(),
      v.category,
      v.environment,
      v.description,
      v.testOwner,
      v.testRepo,
      v.testWorkflow,
      v.testRef,
      v.testResultUrl,
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
