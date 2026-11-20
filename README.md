# SKPFlow

Asisten pencatatan kinerja harian ASN: catat aktivitas, hubungkan ke target, susun rekap mingguan, dan hasilkan draft laporan bulanan yang siap ditinjau atasan.

**Live:** https://skpflow.vercel.app — database Supabase Postgres (project `Jejak-Kinerja`, region `ap-southeast-1`), storage Supabase Storage (bucket privat `attachments`), AI `mock` (fallback tanpa kuota).

Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL, dengan adapter AI (Groq/OpenAI-compatible atau mock) dan storage S3-compatible (Cloudflare R2 / Supabase Storage) atau filesystem lokal.

## Fitur

- Login email/NIP + password (JWT httpOnly cookie, `jose` + `bcryptjs`).
- Dashboard ringkasan aktivitas, target aktif, laporan terbaru.
- Aktivitas harian: CRUD, filter bulan/status, ubah status inline.
- Quick add AI: satu paragraf dipecah menjadi beberapa draft aktivitas yang bisa dikoreksi sebelum disimpan.
- Target kinerja: CRUD, progres capaian dari kuantitas aktivitas terhubung.
- Rekap mingguan berbasis AI (fallback mock).
- Laporan bulanan: generate draft otomatis (7 seksi), edit, submit, review atasan (approve/revisi/komentar), export Markdown.
- Lampiran aktivitas: upload privat, unduh via signed URL (S3) atau route terproteksi (lokal).
- Admin: kelola user, role, unit, atasan, status aktif, reset password.
- `GET /api/health` untuk health check sekaligus keep-alive Supabase free tier.

## Akun demo

Seed menyediakan password yang sama untuk semua akun: `password`.

| Peran | Email | NIP |
| --- | --- | --- |
| ASN | `siti.aminah@skpflow.id` | `199002022010012002` |
| Atasan | `budi.santoso@skpflow.id` | `198001012005011001` |
| Admin | `admin@skpflow.id` | `198501012010011001` |

## Menjalankan lokal

Prasyarat: Node.js 20+, Supabase CLI yang sudah login (`supabase login`). Docker opsional untuk Postgres offline.

```bash
# 1. Dependensi
npm install

# 2. Environment
cp .env.example .env
# isi DATABASE_URL (transaction pooler :6543) dan DIRECT_URL (session pooler :5432)

# 3. Schema + seed ke Supabase
supabase link --project-ref <project-ref>
supabase db query --remote --yes --file schema.sql
supabase db query --remote --yes --file seed.sql

# 4. Prisma client + jalankan
npx prisma generate
npm run dev
```

Alternatif offline dengan Docker Postgres:

```bash
docker run --rm -d --name skpflow-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=skpflow \
  -p 55432:5432 postgres:16-alpine
docker exec -i skpflow-pg psql -U postgres -d skpflow < schema.sql
docker exec -i skpflow-pg psql -U postgres -d skpflow < seed.sql
# lalu set DATABASE_URL/DIRECT_URL ke localhost:55432 di .env
```

Buka `http://localhost:3000`, login dengan salah satu akun demo.

Skrip:

```bash
npm run dev        # next dev
npm run build      # prisma generate && next build
npm run start      # next start
npm run typecheck  # tsc --noEmit
npm run db:pull    # introspect database ke prisma/schema.prisma
```

## Environment variables

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Runtime serverless. Supabase transaction pooler port `6543`, user `postgres.<ref>`, `?pgbouncer=true&connection_limit=1&sslmode=require`. |
| `DIRECT_URL` | ya | Migrasi/introspeksi. Supabase session pooler port `5432` (host pooler yang sama) karena direct host `db.<ref>.supabase.co` IPv6-only. |
| `AUTH_SECRET` | ya | Minimal 32 karakter acak. |
| `AUTH_URL` | tidak | Base URL aplikasi. |
| `AI_PROVIDER` | tidak | `mock` (default) atau `groq`. |
| `AI_API_KEY` | untuk Groq | API key `console.groq.com`. |
| `AI_BASE_URL` | tidak | Default `https://api.groq.com/openai/v1`. |
| `AI_MODEL` | tidak | Default `llama-3.3-70b-versatile`. |
| `STORAGE_DRIVER` | tidak | `local` (default), `s3`, atau `supabase`. |
| `SUPABASE_URL` | untuk supabase | `https://<project-ref>.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | untuk supabase | Service role key; hanya dipakai server-side. |
| `SUPABASE_STORAGE_BUCKET` | untuk supabase | Default `attachments` (bucket privat). |
| `S3_ENDPOINT` | untuk s3 | Endpoint S3-compatible. |
| `S3_BUCKET` | untuk s3 | Bucket privat. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | untuk s3 | Kredensial S3. |
| `S3_REGION` | untuk s3 | R2: `auto`; Supabase Storage: region project. |
| `S3_FORCE_PATH_STYLE` | untuk s3 | R2: `false`; Supabase Storage: `true`. |
| `MAX_UPLOAD_MB` | tidak | Default `10`. |

`AI_PROVIDER=groq` tanpa `AI_API_KEY`, atau error/kuota habis, otomatis fallback ke provider mock agar demo tetap berjalan. `STORAGE_DRIVER=local` menulis ke `storage/uploads` dan menyajikan file lewat route terproteksi; `s3` memakai presigned URL 10 menit; `supabase` memakai Storage REST (bucket privat, service role hanya di server) dan menyajikan file lewat route terproteksi.

## Performa

- Fungsi serverless dipin ke region `sin1` (Singapore) lewat `vercel.json`, satu region dengan Supabase `ap-southeast-1`; ini menghilangkan RTT lintas benua per query.
- `DATABASE_URL` memakai transaction pooler dengan `connection_limit=5` agar query paralel tidak diserialisasi.
- Vercel Fluid compute aktif untuk mengurangi cold start dan berbagi instance.
- Router cache dinamis 30 detik (`experimental.staleTimes`) + `loading.tsx` skeleton untuk navigasi ulang yang instan.
- Sesi memakai JWT (tanpa query DB); login hanya satu query (role di-join), dashboard menjalankan query agregat secara paralel.

Hasil benchmark production (2026-11-20, fungsi `sin1`, Supabase `ap-southeast-1`):

| Endpoint | Sebelum | Sesudah (warm) |
| --- | --- | --- |
| `/api/health` | ~1,4 s | 74–165 ms |
| `/dashboard` | ~4,8 s | 75–450 ms |
| `/activities` | ~4,5 s | 88–346 ms |
| `/reports` | ~2,4 s | 76–400 ms |
| `/profile` | ~7,2 s | 81–111 ms |
| `/admin` | — | 81–151 ms |
| Login | ~1,5 s (cold) | ~495 ms |

Cold start sesekali masih ~0,4–0,6 s; `bcrypt` cost 12 menyumbang ~300–400 ms pada login.

## Deploy ke Vercel (free tier)

Target: **Vercel Hobby + Supabase Free (Postgres) + Cloudflare R2 atau Supabase Storage + Groq free tier**.

1. **Supabase**: project sudah ter-link. Ambil dua connection string dari dashboard (*Project Settings → Database*), atau gunakan pola:
   - `DATABASE_URL` = transaction pooler `aws-1-<region>.pooler.supabase.com:6543`, user `postgres.<ref>`, tambahkan `?pgbouncer=true&connection_limit=1&sslmode=require`.
   - `DIRECT_URL` = session pooler host yang sama, port `5432`, `?sslmode=require`.
2. **Schema + seed**: sudah diterapkan ke project via `supabase db query --remote --yes --file schema.sql` dan `--file seed.sql` (17 tabel, 7 user demo). Untuk project baru, ulangi perintah tersebut setelah `supabase link`. Prototipe ini memakai `prisma db push`/SQL langsung, belum folder migrations.
3. **Storage** (dipakai deployment ini: Supabase Storage):
   - Supabase Storage: bucket privat `attachments` sudah dibuat; set `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=attachments`.
   - Alternatif Cloudflare R2: buat bucket privat, API token S3, set `STORAGE_DRIVER=s3`, `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_FORCE_PATH_STYLE=false`.
   - Upload dilakukan server-side, jadi CORS bucket tidak diperlukan untuk alur aplikasi.
4. **AI**: buat API key Groq, set `AI_PROVIDER=groq` + `AI_API_KEY`. Biarkan `mock` untuk demo tanpa kuota.
5. **Vercel**: import repo, set seluruh env var di atas (`AUTH_SECRET` acak, `AUTH_URL=https://<domain>`), deploy. Build command sudah `prisma generate && next build`.
6. **Keep-alive**: `vercel.json` menjadwalkan `GET /api/health` tiap hari (03:00 UTC) agar project Supabase free tier tidak di-pause karena inactivity. Vercel Hobby mengizinkan satu cron harian.
7. **Batas free tier** yang perlu dipantau: Supabase 500 MB database, R2 10 GB storage + 10 juta class A/bulan, Groq rate limit per model, Vercel 100 GB bandwidth/bulan. Aktifkan `AI_PROVIDER=mock` saat kuota AI habis.

Setelah deploy, cek `https://<domain>/api/health` → `{ "ok": true }`, lalu login dengan akun demo.

## Struktur singkat

```
prisma/schema.prisma      # model introspected dari schema.sql
schema.sql / seed.sql     # DDL + data demo
src/app/(app)/            # halaman ber-session: dashboard, activities, targets, reports, profile, admin
src/app/api/              # route handler: auth, activities, targets, reports, weekly-summary, attachments, admin, health
src/lib/ai.ts             # adapter Groq/OpenAI-compatible + fallback mock
src/lib/storage.ts        # adapter lokal / S3-compatible (presigned URL)
src/lib/reports.ts        # komposisi 7 seksi laporan + export Markdown
src/lib/rbac.ts           # aturan akses pemilik/atasan/admin
```

## Catatan keamanan

- Session JWT disimpan di cookie `httpOnly`, `sameSite=lax`, `secure` di production.
- Semua route memeriksa session; laporan dan lampiran dicek terhadap pemilik/atasan langsung/admin.
- Bucket storage privat; file diakses lewat signed URL atau route terproteksi.
- Ganti `AUTH_SECRET` dan password akun demo sebelum dipakai di luar demo.
