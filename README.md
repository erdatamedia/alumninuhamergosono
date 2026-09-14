# Portal Alumni Nurul Huda Mergosono

Portal update data alumni & konfirmasi kehadiran acara Haul Pondok Pesantren
Salafiyah Syafi'iyah Nurul Huda Mergosono. Next.js App Router + Prisma/SQLite,
tanpa backend terpisah.

## Stack

Next.js (App Router) · TypeScript · Prisma + SQLite · Tailwind CSS ·
Framer Motion · bcryptjs (PIN dashboard) · sharp (proses foto) ·
html-to-image (download kartu alumni)

## Setup lokal

```bash
npm install
cp .env.example .env   # isi ADMIN_PASSWORD, SESSION_SECRET, dst.
npx prisma migrate dev
npx prisma db seed     # butuh prisma/alumni_seed_final.json (lihat prisma/alumni_seed_final.example.json)
npm run dev
```

## Environment variables

| Variabel | Kegunaan |
| --- | --- |
| `DATABASE_URL` | Path file SQLite, mis. `file:./dev.db` |
| `ADMIN_PASSWORD` | Password tunggal halaman `/admin` |
| `NEXT_PUBLIC_TAHUN_ACARA` | Tahun acara Haul berjalan, ganti tiap tahun |
| `SESSION_SECRET` | Secret HMAC untuk cookie session dashboard alumni (`/dashboard`). Generate acak: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## ⚠️ Data yang WAJIB ikut di-backup

Selain file database (`prisma/prod.db` atau `prisma/dev.db`), folder
**`public/uploads/foto-profil/`** berisi file foto profil alumni yang
di-upload lewat dashboard (untuk Kartu Alumni Digital). Folder ini **bukan**
metadata — isinya file gambar asli yang dirujuk oleh kolom `Alumni.fotoUrl`
di database.

**Backup database tanpa folder ini akan membuat foto alumni hilang** (link
`fotoUrl` di database tetap ada, tapi filenya tidak) walau data lain aman.
Selalu backup keduanya bersamaan:

```bash
# contoh backup manual di VPS
tar -czf backup-haul-$(date +%Y%m%d).tar.gz \
  /srv/apps/haul/prisma/prod.db \
  /srv/apps/haul/public/uploads/foto-profil
```

## Deploy (VPS, PM2 + Nginx)

```bash
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart haul
```

Kalau ada environment variable baru, tambahkan ke `.env` di server **sebelum**
`npm run build` — route handler membacanya saat runtime, bukan saat build,
tapi build tetap perlu dijalankan ulang supaya kode terbaru ter-compile.
