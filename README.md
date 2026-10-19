# Automation Portal

Aplikasi web untuk mengelola daftar link project automasi. Dibuat dengan **Next.js (App Router) + TypeScript + Tailwind CSS**. Data project & user tersimpan di **database PostgreSQL** (Supabase/Neon) melalui driver `pg`.

## Fitur

- **Tambah Project**: form nama (wajib, maks. 100 karakter) + link (wajib, URL valid `http://` / `https://`), validasi jelas, form kosong otomatis setelah simpan.
- **Daftar Card responsif**: grid 1 kolom di mobile, 2–3 kolom di desktop. Menampilkan nama + URL. State kosong: "Belum ada project".
- **Buka di tab baru**: klik card membuka link dengan `target="_blank" rel="noopener noreferrer"`. Tombol Edit/Hapus memakai `stopPropagation`.
- **Edit & Hapus**: Edit via modal terisi data lama (Simpan/Batal), Hapus via dialog konfirmasi.
- **Penyimpanan**: PostgreSQL (tabel `users` & `projects`). Skema + akun default dibuat otomatis saat request pertama.

## Struktur Folder

```
.
├── app/
│   ├── layout.tsx          # Layout + navbar + footer, metadata
│   ├── page.tsx            # Server Component, render AutomationPortal
│   └── globals.css         # Tailwind v4 (@import "tailwindcss")
├── components/
│   ├── AutomationPortal.tsx    # Container utama (Client Component)
│   ├── ProjectForm.tsx         # Form tambah + validasi
│   ├── ProjectCard.tsx         # Card, klik buka tab baru
│   ├── EditProjectModal.tsx    # Modal edit
│   └── DeleteConfirmDialog.tsx # Konfirmasi hapus
├── hooks/
│   └── useProjects.ts      # CRUD + sync localStorage
├── lib/
│   └── validation.ts       # Validasi nama & URL
├── types/
│   └── project.ts          # Tipe Project
├── public/
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Instalasi & Menjalankan

Persyaratan: Node.js 20+ dan npm.

```bash
# 1. Buat proyek (contoh nama folder tanpa spasi agar lolos aturan npm)
npx create-next-app@latest automation-portal --typescript --tailwind --eslint --app --use-npm --src-dir=false --import-alias="@/*" --yes

cd automation-portal

# 2. Jalankan mode development
npm run dev
# buka http://localhost:3000

# 3. Build produksi (wajib sukses sebelum deploy)
npm run build

# 4. Jalankan hasil build secara lokal (opsional)
npm start

# 5. Cek lint (opsional)
npm run lint
```

> Catatan: nama folder `Automation Portal` (dengan spasi & kapital) ditolak `create-next-app` karena aturan nama npm. Solusinya: scaffold dengan nama `automation-portal` lalu pindahkan isinya ke folder tujuan. `package.json` tetap bernama `automation-portal` — itu yang benar.

## Deploy ke Vercel

1. Siapkan database PostgreSQL (Supabase/Neon), ambil connection string.
2. Set env `DATABASE_URL` (dan `JWT_SECRET`) di Vercel → **Project → Settings → Environment Variables**.
3. Push proyek ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: automation portal"
   git branch -M main
   git remote add origin https://github.com/USERNAME/automation-portal.git
   git push -u origin main
   ```
4. Buka [vercel.com](https://vercel.com) → **Add New → Project → Import** repo tersebut.
5. Framework Preset otomatis **Next.js**. Biarkan Build Command `npm run build`, Output default.
6. Klik **Deploy**. Selesai — setiap push ke `main` akan auto-deploy.

## Konfigurasi Environment

Salin `.env.example` ke `.env.local` lalu isi:

- `DATABASE_URL` — **wajib**, connection string PostgreSQL. Untuk Vercel serverless gunakan pooled connection (Supabase port `6543`).
- `JWT_SECRET` — **wajib di produksi**, secret JWT minimal 32 karakter.
- `GITHUB_*` — opsional, default target repo uji GitHub Action.

## Menjalankan dengan Docker

Prerequisite: Docker (Docker Desktop / OrbStack / Colima).

```bash
# Build + jalankan (memakai DATABASE_URL dari .env — mis. Supabase)
docker compose up -d --build

# Lihat log / status
docker compose logs -f app
docker compose ps
```

Buka http://localhost:3000.

### PostgreSQL lokal (opsional)

Tanpa Supabase/Neon, jalankan Postgres di dalam compose:

```bash
docker compose --profile local-db up -d --build
```

Lalu set di `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/automation_portal
PGSSLMODE=disable
```

Data Postgres disimpan di volume `pgdata` (bertahan antar restart). Hapus dengan `docker compose --profile local-db down -v`.

### Build image manual

```bash
docker build -t automation-portal:latest .
docker run -d -p 3000:3000 --env-file .env automation-portal:latest
```

Catatan: image memakai `output: "standalone"` (lihat `next.config.ts`), berjalan sebagai user non-root, dan punya healthcheck ke `/api/projects`. Env `NEXT_PUBLIC_*` di-inline saat build; secret seperti `DATABASE_URL`/`JWT_SECRET` dibaca saat runtime.

## Cara Pakai

1. Isi **Nama Project** dan **Link Project**, klik **Simpan Project**.
2. Klik card untuk membuka link di tab baru.
3. Klik **Edit** untuk ubah, **Hapus** → konfirmasi **Ya, Hapus**.
4. Refresh browser — data tetap ada karena tersimpan di database.
