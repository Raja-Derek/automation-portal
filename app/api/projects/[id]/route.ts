// /api/projects/[id] — Edit (PUT) & Hapus (DELETE), keduanya admin saja.
// Catatan Next.js 16: params adalah Promise, wajib di-await.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { validateProjectForm, validateTestTarget } from "@/lib/validation";
import { deleteProject, updateProject } from "@/lib/projects-store";

type Ctx = RouteContext<"/api/projects/[id]">;

interface UpdateBody {
  name: string;
  url: string;
  testOwner: string;
  testRepo: string;
  testWorkflow: string;
  testRef: string;
  testResultUrl: string;
}

async function readBody(req: Request): Promise<UpdateBody> {
  const empty: UpdateBody = {
    name: "",
    url: "",
    testOwner: "",
    testRepo: "",
    testWorkflow: "",
    testRef: "",
    testResultUrl: "",
  };
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === "string" ? v : "");
    return {
      name: str(body.name),
      url: str(body.url),
      testOwner: str(body.testOwner),
      testRepo: str(body.testRepo),
      testWorkflow: str(body.testWorkflow),
      testRef: str(body.testRef),
      testResultUrl: str(body.testResultUrl),
    };
  } catch {
    return empty;
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

  const { name, url, testOwner, testRepo, testWorkflow, testRef, testResultUrl } =
    await readBody(req);
  const errors = {
    ...validateProjectForm(name, url),
    ...validateTestTarget(testOwner, testRepo, testWorkflow, testRef, testResultUrl),
  };
  if (Object.values(errors).some(Boolean)) {
    return NextResponse.json(
      { error: "Validasi gagal.", fields: errors },
      { status: 400 },
    );
  }

  const updated = await updateProject(id, name, url, {
    testOwner,
    testRepo,
    testWorkflow,
    testRef,
    testResultUrl,
  });
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
  const ok = await deleteProject(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Project tidak ditemukan." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
