// /api/projects — Daftar (GET, PUBLIK tanpa login) & Tambah (POST, admin saja).
// Validasi nama/URL dilakukan ULANG di server via lib/validation.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  validateProjectForm,
  validateProjectMeta,
  validateTestTarget,
} from "@/lib/validation";
import { createProject, listProjects } from "@/lib/projects-store";

// GET: publik — pengunjung tanpa login boleh melihat daftar project.
// Operasi tulis tetap dijaga requireAdmin di bawah + proxy.ts.
export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

// POST: hanya admin. Body { name, url, category?, environment?, description?,
// testOwner?, testRepo?, testWorkflow?, testRef?, testResultUrl? }.
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const b = body as Record<string, unknown>;
  const name = str(b.name);
  const url = str(b.url);
  const category = str(b.category);
  const environment = str(b.environment);
  const description = str(b.description);
  const testOwner = str(b.testOwner);
  const testRepo = str(b.testRepo);
  const testWorkflow = str(b.testWorkflow);
  const testRef = str(b.testRef);
  const testResultUrl = str(b.testResultUrl);

  // Validasi server — frontend boleh menampilkan pesan yang sama,
  // tapi server tidak pernah percaya input client.
  const errors = {
    ...validateProjectForm(name, url),
    ...validateProjectMeta(category, environment, description),
    ...validateTestTarget(testOwner, testRepo, testWorkflow, testRef, testResultUrl),
  };
  if (Object.values(errors).some(Boolean)) {
    return NextResponse.json(
      { error: "Validasi gagal.", fields: errors },
      { status: 400 },
    );
  }

  const project = await createProject(name, url, {
    category,
    environment,
    description,
    testOwner,
    testRepo,
    testWorkflow,
    testRef,
    testResultUrl,
  });
  return NextResponse.json({ project }, { status: 201 });
}
