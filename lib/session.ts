// Helper guard otorisasi untuk Route Handler.
// Dipakai di SETIAP endpoint: baca JWT dari cookie, tolak jika tak sesuai peran.
// Ini yang menjamin keamanan di sisi server (bukan sekadar sembunyikan tombol).

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { findUserById } from "@/lib/users";
import type { SessionPayload } from "@/types/user";

export interface AuthResult {
  session: SessionPayload;
}

/** Ambil session dari cookie pada Route Handler / Server Component. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  // Pastikan user masih ada di database.
  const user = await findUserById(payload.id);
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role };
}

/** Ambil session dari NextRequest (dipakai di proxy.ts / route dengan request). */
export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Wajib login (admin ATAU user). Return Response 401 jika gagal. */
export async function requireUser(): Promise<
  { session: SessionPayload } | { error: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: Response.json(
        { error: "Belum login. Silakan login terlebih dahulu." },
        { status: 401 },
      ),
    };
  }
  return { session };
}

/** Wajib admin. Return 401 jika belum login, 403 jika bukan admin. */
export async function requireAdmin(): Promise<
  { session: SessionPayload } | { error: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: Response.json(
        { error: "Belum login. Silakan login terlebih dahulu." },
        { status: 401 },
      ),
    };
  }
  if (session.role !== "admin") {
    return {
      error: Response.json(
        { error: "Akses ditolak. Hanya admin yang dapat melakukan aksi ini." },
        { status: 403 },
      ),
    };
  }
  return { session };
}
