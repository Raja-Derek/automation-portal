// /api/projects/[id] — Edit (PUT) & Hapus (DELETE), keduanya admin saja.
// Catatan Next.js 16: params adalah Promise, wajib di-await.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { validateProjectForm } from "@/lib/validation";
import { deleteProject, updateProject } from "@/lib/projects-store";

type Ctx = RouteContext<"/api/projects/[id]">;

async function readBody(req: Request): Promise<{ name: string; url: string }> {
  try {
    const body = (await req.json()) as { name?: unknown; url?: unknown };
    return {
      name: typeof body.name === "string" ? body.name : "",
      url: typeof body.url === "string" ? body.url : "",
    };
  } catch {
    return { name: "", url: "" };
  }
}

// PUT: hanya admin, validasi server penuh.
export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const { name, url } = await readBody(req);
  const errors = validateProjectForm(name, url);
  if (errors.name || errors.url) {
    return NextResponse.json(
      { error: "Validasi gagal.", fields: errors },
      { status: 400 },
    );
  }

  const updated = updateProject(id, name, url);
  if (!updated) {
    return NextResponse.json(
      { error: "Project tidak ditemukan." },
      { status: 404 },
    );
  }
  return NextResponse.json({ project: updated });
}

// DELETE: hanya admin, konfirmasi dilakukan di UI tapi otorisasi di sini.
export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }
  const ok = deleteProject(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Project tidak ditemukan." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
