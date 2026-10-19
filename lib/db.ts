// Koneksi PostgreSQL (Supabase/Neon) memakai driver `pg`.
// Menyediakan pool singleton + inisialisasi skema (idempotent) + seeder.
// Kredensial diambil dari env DATABASE_URL (jangan di-commit).

import { Pool, type QueryResultRow } from "pg";
import { hashPasswordSync } from "@/lib/auth";

// Buat ID unik untuk baris (dipakai sebagai primary key text).
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Simpan pool & status inisialisasi di globalThis agar tidak dibuat ulang
// setiap HMR / reload modul di dev, dan agar schema hanya dibuat sekali.
const globalDb = globalThis as unknown as {
  __apPool?: Pool;
  __apSchemaReady?: Promise<void>;
};

function sslConfig(): false | { rejectUnauthorized: boolean } {
  const url = process.env.DATABASE_URL ?? "";
  if (
    process.env.PGSSLMODE === "disable" ||
    /localhost|127\.0\.0\.1/.test(url)
  ) {
    return false;
  }
  // Supabase/Neon memakai sertifikat yang tidak ada di trust store Node.
  return { rejectUnauthorized: false };
}

export function getPool(): Pool {
  if (!globalDb.__apPool) {
    globalDb.__apPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig(),
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalDb.__apPool;
}

/** Jalankan query dengan jaminan skema sudah siap. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

// DDL skema. Semua idempotent (IF NOT EXISTS) sehingga aman dipanggil berkali-kali.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  url              TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  test_status      TEXT,
  test_started_at  TIMESTAMPTZ,
  test_finished_at TIMESTAMPTZ,
  test_html_url    TEXT,
  test_run_id      BIGINT,
  test_owner       TEXT,
  test_repo        TEXT,
  test_workflow    TEXT,
  test_ref         TEXT,
  test_result_url  TEXT
);
`;

// Seeder akun default (hanya hash yang disimpan) — ON CONFLICT menjaga idempotensi.
const ADMIN_EMAIL = "admin@lcc.com";
const ADMIN_DEFAULT_PASSWORD = "tahubulat";
const DEMO_USER_EMAIL = "user@lcc.com";
const DEMO_USER_PASSWORD = "user123";

async function initSchema(): Promise<void> {
  const pool = getPool();
  await pool.query(SCHEMA_SQL);

  await pool.query(
    `INSERT INTO users (id, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [createId(), ADMIN_EMAIL, hashPasswordSync(ADMIN_DEFAULT_PASSWORD)],
  );
  await pool.query(
    `INSERT INTO users (id, email, password_hash, role)
     VALUES ($1, $2, $3, 'user')
     ON CONFLICT (email) DO NOTHING`,
    [createId(), DEMO_USER_EMAIL, hashPasswordSync(DEMO_USER_PASSWORD)],
  );

  // Seed 2 contoh project agar halaman tidak kosong saat pertama dibuka.
  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM projects",
  );
  if (Number(rows[0]?.count ?? 0) === 0) {
    await pool.query(
      `INSERT INTO projects (id, name, url) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        createId(),
        "n8n Production",
        "https://n8n.io",
        createId(),
        "Dokumentasi Next.js",
        "https://nextjs.org/docs",
      ],
    );
  }
}

/** Pastikan skema & data awal siap. Dipanggil otomatis oleh query(). */
export function ensureSchema(): Promise<void> {
  if (!globalDb.__apSchemaReady) {
    globalDb.__apSchemaReady = initSchema().catch((err) => {
      // Reset agar percobaan berikutnya bisa mencoba lagi (mis. DB belum siap).
      globalDb.__apSchemaReady = undefined;
      throw err;
    });
  }
  return globalDb.__apSchemaReady;
}
