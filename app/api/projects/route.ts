// /api/projects — Daftar (GET, PUBLIK tanpa login) & Tambah (POST, admin saja).
// Validasi nama/URL dilakukan ULANG di server via lib/validation.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { validateProjectForm } from "@/lib/validation";
import { createProject, listProjects } from "@/lib/projects-store";

// GET: publik — pengunjung tanpa login boleh melihat daftar project.
// Operasi tulis tetap dijaga requireAdmin di bawah + proxy.ts.
export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}

// POST: hanya admin. Body { name, url }.
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  const name =
    typeof (body as { name?: unknown }).name === "string"
      ? (body as { name: string }).name
      : "";
  const url =
    typeof (body as { url?: unknown }).url === "string"
      ? (body as { url: string }).url
      : "";

  // Validasi server — frontend boleh menampilkan pesan yang sama,
  // tapi server tidak pernah percaya input client.
  const errors = validateProjectForm(name, url);
  if (errors.name || errors.url) {
    return NextResponse.json(
      { error: "Validasi gagal.", fields: errors },
      { status: 400 },
    );
  }

  const project = createProject(name, url);
  return NextResponse.json({ project }, { status: 201 });
}
