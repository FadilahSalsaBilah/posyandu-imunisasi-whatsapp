# Posyandu Imunisasi WhatsApp

Aplikasi web untuk mengelola jadwal imunisasi balita di Posyandu, lengkap dengan pengingat otomatis via WhatsApp ke orang tua.

Fokus utama:
- Manajemen data orang tua dan balita
- Penjadwalan imunisasi
- Pengiriman pengingat WhatsApp (H-7, H-1, dan H0)
- Dashboard statistik dan log pengiriman notifikasi

---

## Tech Stack

- Node.js + Express
- EJS (server-side template engine)
- better-sqlite3 (database SQLite)
- express-session + cookie-parser (autentikasi & sesi)
- node-cron (scheduler pengingat imunisasi)
- Integrasi WhatsApp (WhatsApp Cloud API / Fonnte)

---

## Struktur Folder

Repo ini berisi dua set kode dengan struktur yang sama:

- `src/`, `views/`, `public/`  
- `backend/src/`, `backend/views/`, `backend/public/`

Untuk development normal, cukup gunakan struktur root:

- `src/` – kode server utama (Express, routing, scheduler, WhatsApp)
- `views/` – template EJS (dashboard, parents, children, schedules, logs, login)
- `public/` – aset statis (CSS)
- `posyandu.db` – file database SQLite (di-ignore dari Git)
- `.env` – konfigurasi environment lokal (di-ignore dari Git)
- `.env.example` – contoh konfigurasi environment

Folder `backend/` dapat dipakai jika ingin memisahkan backend saat deploy tertentu, tetapi secara default script npm mengarah ke folder root (`src/`).

---

## Fitur Utama

- Login admin dengan sesi aman (session & cookie)
- Dashboard:
  - Total orang tua, balita, jadwal, dan notifikasi pending
  - Daftar jadwal imunisasi yang akan datang
- Manajemen data:
  - Orang tua (nama, nomor WhatsApp, alamat, consent)
  - Balita (relasi ke orang tua, tanggal lahir, jenis kelamin)
  - Jadwal imunisasi (jenis imunisasi, tanggal, lokasi, catatan)
- Pengingat WhatsApp otomatis:
  - H-7, H-1, dan H0 (pukul 07:00) sebelum jadwal
  - Bisa menggunakan WhatsApp Cloud API atau Fonnte sebagai provider
- Log notifikasi:
  - Riwayat pengiriman, status, dan detail jadwal terkait
- Penghapusan terstruktur:
  - Hapus jadwal → batalkan pesan WA (jika sudah terjadwal) + hapus notifikasi lokal
  - Hapus balita → hapus semua jadwal & notifikasi terkait
  - Hapus orang tua → hapus semua balita, jadwal, dan notifikasi terkait

---

## Prasyarat

- Node.js (disarankan versi 18+)
- npm
- Akses ke:
  - WhatsApp Cloud API **atau**
  - Akun Fonnte (jika pakai mode Fonnte)

---

## Instalasi & Setup Lokal

1. **Clone repo dan masuk ke folder proyek:**

   ```bash
   git clone https://github.com/FadilahSalsaBilah/posyandu-imunisasi-whatsapp.git
   cd posyandu-imunisasi-whatsapp
   ```

2. **Install dependency:**

   ```bash
   npm install
   ```

3. **Siapkan file `.env`:**

   - Duplikat file `.env.example` menjadi `.env`
   - Isi nilai sesuai kebutuhan:

   ```bash
   cp .env.example .env
   ```

   Isi minimal:
   - `PORT` – port server (default 3000)
   - `DB_PATH` – path ke file database SQLite (default `./posyandu.db`)
   - `SESSION_SECRET` – string random panjang untuk session
   - `POSYANDU_*` – informasi posyandu (nama, lokasi, kontak)
   - Konfigurasi WhatsApp (lihat bagian **Konfigurasi WhatsApp**)

4. **Seed database (opsional tapi disarankan untuk pertama kali):**

   ```bash
   npm run seed
   ```

   Script ini akan membuat tabel dasar dan memasukkan data awal yang diperlukan.

5. **Jalankan server dalam mode development:**

   ```bash
   npm run dev
   ```

6. **Akses aplikasi di browser:**

   - Default: `http://localhost:3000`

---

## Konfigurasi Environment

Contoh konfigurasi dapat dilihat di `.env.example`. Variabel penting:

- `PORT` – port aplikasi (default `3000`)
- `DB_PATH` – path file SQLite (default `./posyandu.db`)
- `SESSION_SECRET` – secret untuk session
- `POSYANDU_NAME`, `POSYANDU_LOCATION`, `POSYANDU_CONTACT`
- `BASE_URL` – base URL aplikasi (penting untuk log & callback)

### Mode WhatsApp

- `WHATSAPP_MODE`:
  - `mock` – hanya log ke console (aman untuk testing)
  - `cloud` – kirim beneran via WhatsApp Cloud API

- Untuk **WhatsApp Cloud API**:
  - `WA_TOKEN`
  - `WA_PHONE_NUMBER_ID`
  - `WA_TEMPLATE_NAME`
  - `WA_TEMPLATE_LANG`

- Untuk **Fonnte**:
  - `WHATSAPP_PROVIDER=fonnte`
  - `FONNTE_TOKEN`
  - `FONNTE_API_URL` (default: `https://api.fonnte.com`)

- `TZ_OFFSET` – offset zona waktu (misal `+07:00` untuk WIB)

> Penting: file `.env` sudah di-ignore di `.gitignore`, jadi tidak akan ke-push ke GitHub.

---

## Scheduler & Notifikasi

Scheduler dijalankan ketika server start:

- Menggunakan `node-cron`
- Membaca jadwal dari tabel `notifications`
- Mengirim notifikasi berdasarkan waktu `send_at`
- Mendukung tiga jenis notifikasi:
  - `H-7`
  - `H-1`
  - `H0`

Saat membuat jadwal baru, aplikasi otomatis membuat tiga baris notifikasi untuk jadwal tersebut dengan waktu yang sudah dihitung dari tanggal imunisasi.

Jika jadwal/balita/orang tua dihapus:

- Aplikasi akan mencoba membatalkan pesan di provider (jika `provider_message_id` tersedia)
- Lalu menghapus notifikasi & jadwal dari database lokal

---

## Deploy ke Vercel / Netlify (Gambaran Umum)

Karena ini aplikasi **Node.js dengan Express server-side**, pola deploy umumnya:

1. **Vercel**
   - Pastikan entry server mengarah ke `src/index.js`
   - Set environment variables di dashboard Vercel:
     - Sama seperti isi `.env` penting (PORT, DB_PATH, SESSION_SECRET, WA_*, FONNTE_*, BASE_URL, dll.)
   - Sesuaikan `BASE_URL` dengan domain produksi Vercel.

2. **Netlify**
   - Netlify cocok untuk frontend statis + backend via functions.  
   - Untuk menjalankan Express full server, biasanya digunakan adapter/Netlify functions atau deploy backend terpisah (misalnya di layanan lain) lalu frontend diarahkan ke sana.
   - Konsep environment variables sama: isikan nilai `.env` ke dashboard Netlify.

> Rekomendasi: jalankan backend ini di platform yang mendukung Node.js/Express full (Railway, Render, VPS, dsb.) lalu sambungkan domain dari Vercel/Netlify jika ingin frontend terpisah.

---

## Script NPM

Tersedia script berikut di `package.json`:

- `npm run dev` – menjalankan server Express (`node src/index.js`)
- `npm run seed` – menjalankan seeding database (`node src/seed.js`)

---

## Pengembangan Lanjutan

Beberapa ide pengembangan:

- Role user (admin, kader, viewer)
- Export laporan ke PDF/Excel
- Notifikasi tambahan via SMS/email
- Multi-cabang Posyandu dalam satu sistem

---

## Lisensi

Silakan gunakan dan modifikasi sesuai kebutuhan Posyandu kamu. Jika dipakai di produksi, pastikan:

- Token WhatsApp / Fonnte aman (jangan commit ke Git)
- Konfigurasi environment di server sudah lengkap dan benar
- Backup database SQLite dilakukan secara berkala

