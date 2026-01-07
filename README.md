# Posyandu Imunisasi WhatsApp

Aplikasi web sederhana untuk mengelola jadwal imunisasi balita di Posyandu, lengkap dengan pengingat otomatis via WhatsApp ke orang tua.

Jika kamu **tidak paham coding**, cukup baca bagian:

- [Cara Pakai Cepat di Laptop (Tanpa Ngoding)](#cara-pakai-cepat-di-laptop-tanpa-ngoding)
- [Cara Pakai Cepat Versi Online (Railway)](#cara-pakai-cepat-versi-online-railway)

Bagian lain di bawahnya boleh dilewati kalau kamu tidak butuh detail teknis.

Fokus utama aplikasi:
- Manajemen data orang tua dan balita
- Penjadwalan imunisasi
- Pengiriman pengingat WhatsApp (H-7, H-1, dan H0)
- Dashboard statistik dan log pengiriman notifikasi

---

## Cara Pakai Cepat di Laptop (Tanpa Ngoding)

1. **Siapkan alat:**
   - Sudah install **Node.js** (kalau belum, minta tolong teman/teknisi buat install).

2. **Ambil project ini dari GitHub:**
   - Buka link:  
     `https://github.com/FadilahSalsaBilah/posyandu-imunisasi-whatsapp`
   - Klik tombol **Code → Download ZIP**.
   - Extract ZIP tersebut, lalu buka folder hasil extract.

3. **Buka folder di Terminal:**
   - Klik address bar di Explorer, tulis `cmd` lalu Enter.
   - Akan muncul jendela hitam (Command Prompt) di folder project.

4. **Install kebutuhan aplikasi:**

   ```bash
   npm install
   ```

   Jalankan sekali saja. Tunggu sampai selesai.

5. **Siapkan pengaturan aplikasi (.env):**
   - Di dalam folder project, akan ada file `.env.example`.
   - Copy file itu dan beri nama baru `.env`.
   - Buka `.env` dengan Notepad, dan isi nilai yang mudah:
     - `PORT=3000`
     - `DB_PATH=./posyandu.db`
     - `SESSION_SECRET=` isi dengan teks panjang bebas (contoh sudah ada di file kamu)
     - `POSYANDU_NAME` / `POSYANDU_LOCATION` / `POSYANDU_CONTACT` bisa disesuaikan nama posyandu.
   - Jika hanya untuk tugas kuliah, pengaturan WhatsApp boleh dibiarkan default, atau pakai mode `mock` (tidak benar-benar kirim WA).

6. **Isi data awal (buat akun admin & daftar imunisasi):**

   ```bash
   npm run seed
   ```

   Setelah selesai, akan ada akun admin:

   - Username: `admin`
   - Password: `admin123`

7. **Jalankan aplikasi:**

   ```bash
   npm run dev
   ```

   Kalau berhasil, di terminal akan muncul kurang lebih:

   - `✅ Server jalan: http://localhost:3000`
   - `✅ Scheduler aktif: cek notifikasi tiap 1 menit`

8. **Buka di browser:**
   - Buka Chrome / Edge.
   - Ketik alamat: `http://localhost:3000`
   - Login pakai:
     - Username: `admin`
     - Password: `admin123`

Selesai. Kamu sudah bisa input orang tua, balita, dan jadwal imunisasi.

---

## Cara Pakai Cepat Versi Online (Railway)

Bagian ini menjelaskan singkat cara menjalankan aplikasi di internet menggunakan Railway.  
Langkah detil sudah disiapkan, jadi kamu bisa cukup ikuti menu tanpa perlu paham kode.

1. **Hubungkan GitHub ke Railway:**
   - Buat akun di https://railway.app (pakai GitHub).
   - Buat project baru, pilih repo:
     `FadilahSalsaBilah/posyandu-imunisasi-whatsapp`.

2. **Atur cara menjalankan aplikasi:**
   - Root directory: biarkan default (root project).
   - Build command:

     ```bash
     npm install && npm run seed
     ```

     (install kebutuhan + isi data awal admin dan imunisasi setiap deploy).

   - Start command:

     ```bash
     node src/index.js
     ```

3. **Isi Environment Variables di Railway:**
   Di tab **Variables / Environment**, tambahkan (sesuai kebutuhan):

   - `DB_PATH=./posyandu.db`
   - `SESSION_SECRET=` isi dengan secret yang sama seperti di `.env` lokal
   - `POSYANDU_NAME=Posyandu Buncis`
   - `POSYANDU_LOCATION=Kelurahan Pondok Cina`
   - `POSYANDU_CONTACT=0812-3456-7890`
   - `WHATSAPP_PROVIDER=mock` (untuk demo/tugas kuliah, hanya log di console)
   - `FONNTE_API_URL=https://api.fonnte.com`
   - `TZ_OFFSET=+07:00`
   - `BASE_URL=https://posyandu-imunisasi-whatsapp-production.up.railway.app`

   Untuk tugas kuliah, pengaturan ini sudah cukup.  
   Jika nanti ingin mengirim WA sungguhan, baru ubah `WHATSAPP_PROVIDER` dan tambahkan `FONNTE_TOKEN`.

4. **Deploy dan dapatkan URL:**
   - Klik **Deploy** di Railway.
   - Setelah statusnya `Running`, Railway akan memberikan URL, misalnya:
     `https://posyandu-imunisasi-whatsapp-production.up.railway.app`
   - Buka URL tersebut di browser dan login dengan:
     - Username: `admin`
     - Password: `admin123`

URL inilah yang bisa kamu kirim ke dosen sebagai hasil tugas.

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

Struktur yang dipakai saat ini:

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

## Deploy ke Railway (Contoh Produksi)

Contoh konfigurasi deploy backend ke Railway (seperti yang dipakai untuk tugas kuliah ini):

- Source repo: GitHub `FadilahSalsaBilah/posyandu-imunisasi-whatsapp`
- Branch: `main`
- Start command:

  ```bash
  node src/index.js
  ```

- Target port di Railway: `3000`

### Environment variables di Railway

Isi variables di dashboard Railway (Environment / Variables), misalnya:

- `DB_PATH=./posyandu.db`
- `SESSION_SECRET=<secret panjang>`
- `POSYANDU_NAME=Posyandu Buncis`
- `POSYANDU_LOCATION=Kelurahan Pondok Cina`
- `POSYANDU_CONTACT=0812-3456-7890`
- `WHATSAPP_PROVIDER=mock` (aman untuk demo/tugas, hanya log ke console)
- `FONNTE_API_URL=https://api.fonnte.com`
- `TZ_OFFSET=+07:00`
- `BASE_URL=https://posyandu-imunisasi-whatsapp-production.up.railway.app`

Jika nanti ingin mengaktifkan pengiriman WA sungguhan:

- Ubah `WHATSAPP_PROVIDER=fonnte`
- Tambahkan `FONNTE_TOKEN=<token dari dashboard Fonnte>`
- Pastikan token tidak pernah dimasukkan ke Git, hanya ke environment server.

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

