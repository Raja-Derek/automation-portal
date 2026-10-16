// POST /api/auth/register — Pendaftaran pengguna BIASA saja.
// Selalu membuat role "user". Tidak ada cara menjadi admin lewat endpoint ini.
// Body: { email, password (min. 6 karakter) }. Otomatis login setelah sukses.

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  hashPassword,
  isValidEmail,
  signSession,
} from "@/lib/auth";
import { createRegularUser, toSafeUser } from "@/lib/users";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  const email =
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";
  const password =
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  // Validasi server — jangan percaya validasi client saja.
  if (!email.trim() || !isValidEmail(email)) {
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter." },
      { status: 400 },
    );
  }
  // Abaikan field role jika dikirim penyerang — paksa "user".
  const passwordHash = await hashPassword(password);
  try {
    const user = await createRegularUser(email, passwordHash);
    const token = await signSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const res = NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TERPAT") {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 },
      );
    }
    throw err;
  }
}
