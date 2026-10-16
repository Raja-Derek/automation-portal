// Penyimpanan user in-memory + seeder akun admin default.
// ASUMSI: demi tugas ini tanpa database eksternal agar deploy Vercel
// tanpa config tambahan. Data reset saat cold-start/instans baru.
// Untuk produksi: ganti modul ini dengan Prisma/Postgres (lihat catatan).

import { hashPasswordSync, normalizeEmail } from "@/lib/auth";
import type { SafeUser, UserRole } from "@/types/user";

// Record internal: menyimpan passwordHash (tidak pernah dikirim ke client).
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

// Kredensial admin default sesuai spesifikasi.
export const ADMIN_EMAIL = "admin@lcc.com";
const ADMIN_DEFAULT_PASSWORD = "tahubulat";

// Akun demo non-admin agar penguji bisa melihat mode read-only tanpa registrasi.
export const DEMO_USER_EMAIL = "user@lcc.com";
const DEMO_USER_PASSWORD = "user123";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Store global agar tidak ter-reset saat HMR / route reload di dev.
// Di serverless produksi tiap instans punya salinan sendiri (keterbatasan demo).
const globalStore = globalThis as unknown as {
  __apUsers?: Map<string, StoredUser>;
  __apSeeded?: boolean;
};

function getStore(): Map<string, StoredUser> {
  if (!globalStore.__apUsers) globalStore.__apUsers = new Map();
  return globalStore.__apUsers;
}

/**
 * Seeder: membuat akun admin (hash, bukan plaintext) + akun demo user.
 * Dijalankan otomatis & idempotent setiap modul diakses.
 */
export function ensureSeeded(): void {
  if (globalStore.__apSeeded) return;
  globalStore.__apSeeded = true;
  const store = getStore();

  const adminKey = normalizeEmail(ADMIN_EMAIL);
  if (!store.has(adminKey)) {
    store.set(adminKey, {
      id: createId(),
      email: adminKey,
      // PENTING: yang disimpan hanya hash, bukan "tahubulat" plaintext.
      passwordHash: hashPasswordSync(ADMIN_DEFAULT_PASSWORD),
      role: "admin",
      createdAt: new Date().toISOString(),
    });
  }

  const demoKey = normalizeEmail(DEMO_USER_EMAIL);
  if (!store.has(demoKey)) {
    store.set(demoKey, {
      id: createId(),
      email: demoKey,
      passwordHash: hashPasswordSync(DEMO_USER_PASSWORD),
      role: "user",
      createdAt: new Date().toISOString(),
    });
  }
}

export function findUserByEmail(email: string): StoredUser | undefined {
  ensureSeeded();
  return getStore().get(normalizeEmail(email));
}

export function findUserById(id: string): StoredUser | undefined {
  ensureSeeded();
  for (const user of getStore().values()) {
    if (user.id === id) return user;
  }
  return undefined;
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

/**
 * Buat user baru. Dipakai oleh endpoint registrasi publik.
 * Selalu role "user" — tidak ada cara bagi pendaftar menjadi admin.
 * Throw Error jika email sudah terdaftar.
 */
export async function createRegularUser(
  email: string,
  passwordHash: string,
): Promise<StoredUser> {
  ensureSeeded();
  const store = getStore();
  const key = normalizeEmail(email);
  if (store.has(key)) {
    throw new Error("EMAIL_TERPAT");
  }
  const user: StoredUser = {
    id: createId(),
    email: key,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  };
  store.set(key, user);
  return user;
}
