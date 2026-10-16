// GET /api/auth/me — Cek session aktif.
// Dipakai frontend untuk mengetahui siapa yang login + perannya.
// 200 + { user } jika login, 401 jika tidak.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById, toSafeUser } from "@/lib/users";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }
  const user = findUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }
  return NextResponse.json({ user: toSafeUser(user) });
}
