// POST /api/auth/logout — Hapus cookie session.
// GET /api/auth/me — Kembalikan user login saat ini (atau 401).

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function GET() {
  return NextResponse.json(
    { error: "Gunakan POST untuk logout." },
    { status: 405 },
  );
}
