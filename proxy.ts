// proxy.ts — penerus middleware.ts di Next.js 16 (middleware deprecated).
// Guard lapis pertama untuk OPERASI TULIS project saja:
// - GET /api/projects* dibiarkan publik (pengunjung tanpa login boleh melihat).
// - POST/PUT/PATCH/DELETE wajib membawa cookie session (login).
// - Pengecekan peran admin yang otoritatif tetap di Route Handler
//   (requireAdmin), sehingga keamanan tidak hanya bergantung pada proxy.
// Proxy sengaja TIDAK mengimpor store/bcrypt agar ringan di Edge.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Disalin dari lib/auth.ts agar proxy tetap ringan di Edge
// (tidak ikut membundel bcryptjs). Nilainya harus sama.
const SESSION_COOKIE = "ap_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya jaga area project. Auth endpoint dibiarkan (login/register/logout/me).
  if (!pathname.startsWith("/api/projects")) {
    return NextResponse.next();
  }

  // Daftar (GET/HEAD/OPTIONS) publik — tanpa login boleh melihat.
  if (
    request.method === "GET" ||
    request.method === "HEAD" ||
    request.method === "OPTIONS"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Operasi tulis tanpa login → tolak langsung di edge, hemat invocasi server.
  if (!token) {
    return NextResponse.json(
      { error: "Belum login. Silakan login sebagai admin." },
      { status: 401 },
    );
  }

  // Ada token → teruskan; validitas JWT + peran dicek ulang di Route Handler.
  return NextResponse.next();
}

// Matcher statis agar bisa dianalisis saat build (wajib konstanta).
export const config = {
  matcher: ["/api/projects/:path*"],
};
