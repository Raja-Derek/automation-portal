// Penyimpanan user di PostgreSQL (tabel `users`).
// Password disimpan sebagai hash bcrypt, tidak pernah sebagai plaintext.
// Skema & akun default dibuat otomatis oleh lib/db.ts (ensureSchema).

import { normalizeEmail } from "@/lib/auth";
import { createId, query } from "@/lib/db";
import type { SafeUser, UserRole } from "@/types/user";

// Record internal: menyimpan passwordHash (tidak pernah dikirim ke client).
export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

function toStoredUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const rows = await query<UserRow>(
    "SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1",
    [normalizeEmail(email)],
  );
  return rows[0] ? toStoredUser(rows[0]) : undefined;
}

export async function findUserById(
  id: string,
): Promise<StoredUser | undefined> {
  const rows = await query<UserRow>(
    "SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1",
    [id],
  );
  return rows[0] ? toStoredUser(rows[0]) : undefined;
}

/** Ubah ke bentuk aman (tanpa passwordHash) untuk dikirim ke client. */
export function toSafeUser(user: StoredUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

interface PgError {
  code?: string;
}

/**
 * Buat user baru. Dipakai oleh endpoint registrasi publik.
 * Selalu role "user" — tidak ada cara bagi pendaftar menjadi admin.
 * Throw Error("EMAIL_TERPAT") jika email sudah terdaftar.
 */
export async function createRegularUser(
  email: string,
  passwordHash: string,
): Promise<StoredUser> {
  const key = normalizeEmail(email);
  try {
    const rows = await query<UserRow>(
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, password_hash, role, created_at`,
      [createId(), key, passwordHash],
    );
    return toStoredUser(rows[0]);
  } catch (err) {
    // 23505 = unique_violation (email sudah ada).
    if ((err as PgError).code === "23505") {
      throw new Error("EMAIL_TERPAT");
    }
    throw err;
  }
}
