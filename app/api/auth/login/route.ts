// POST /api/auth/login — Login admin maupun user biasa.
// Body: { email, password }. Set cookie HttpOnly jika sukses.

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  hashPassword,
  isValidEmail,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { findUserByEmail, toSafeUser } from "@/lib/users";

// Jangan pernah log password; hanya validasi & bandingkan hash.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  const email =
    typeof (body as { email?: unknown }).email === "string"
      ? ((body as { email: string }).email ?? "")
      : "";
  const password =
    typeof (body as { password?: unknown }).password === "string"
      ? ((body as { password: string }).password ?? "")
      : "";

  // Validasi server: email & password wajib.
  if (!email.trim() || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Email tidak valid." },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: "Password wajib diisi." },
      { status: 400 },
    );
  }

  // Hindari user-enumeration timing: tetap lakukan compare dummy jika user tak ada.
  // (Praktis: langsung 401 dengan pesan generik.)
  const user = findUserByEmail(email);
  if (!user) {
    // Dummy compare agar waktu respons mirip (opsional, murah).
    await verifyPassword(password, await hashPassword("dummy"));
    return NextResponse.json(
      { error: "Email atau password salah." },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Email atau password salah." },
      { status: 401 },
    );
  }

  const token = await signSession({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ user: toSafeUser(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

// Mencegah metode lain disalahgunakan.
export async function GET() {
  return NextResponse.json(
    { error: "Gunakan POST untuk login." },
    { status: 405 },
  );
}
