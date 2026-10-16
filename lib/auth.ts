// Util autentikasi server: hashing password + JWT session via cookie.
// - Hash: bcryptjs (murni JS, kompatibel Vercel serverless, tanpa native binding).
// - Token: jose (kompatibel Edge/Proxy + Node Route Handler).
// - Cookie: HttpOnly, SameSite=Lax, Secure saat produksi.

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload, UserRole } from "@/types/user";

// Nama cookie session. HttpOnly sehingga tidak bisa dibaca via document.cookie.
export const SESSION_COOKIE = "ap_session";
// Umur session 7 hari (detik).
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Ambil secret JWT. Di produksi WAJIB diisi via env JWT_SECRET.
 * Fallback dev-only agar `npm run build` / Vercel tanpa config tetap jalan.
 */
export function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "dev-only-secret-ganti-di-production-min-32-karakter";
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    // Jangan crash saat build, tapi beri peringatan jelas di log server.
    console.warn(
      "[auth] JWT_SECRET belum diset. Memakai secret dev-only. " +
        "Set JWT_SECRET di Vercel Env sebelum production!",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Hash password plaintext (dipakai saat seeder & registrasi). */
export function hashPassword(plaintext: string): Promise<string> {
  // Cost 10: seimbang antara keamanan & kecepatan di serverless.
  return bcrypt.hash(plaintext, 10);
}

/** Hash sinkron khusus seeder agar bisa inisialisasi modul tanpa top-level await. */
export function hashPasswordSync(plaintext: string): string {
  return bcrypt.hashSync(plaintext, 10);
}

/** Verifikasi password saat login. */
export function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/** Buat JWT session untuk user yang baru login / register. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getJwtSecret());
}

/** Verifikasi JWT dari cookie. Return null jika tidak valid / kedaluwarsa. */
export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "admin" && payload.role !== "user")
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

/** Normalisasi email agar perbandingan case-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validasi format email sederhana di sisi server. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
