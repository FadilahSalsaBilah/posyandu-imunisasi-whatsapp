// src/migrate_add_provider_cols.js
require("dotenv").config();
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || "./posyandu.db";
const db = new Database(dbPath);

function addColumn(sql) {
  try {
    db.exec(sql);
    console.log("✅ OK:", sql);
  } catch (e) {
    // kalau kolom sudah ada, SQLite akan error → aman diabaikan
    const msg = String(e?.message || e);
    if (msg.includes("duplicate column name") || msg.includes("already exists")) {
      console.log("ℹ️ Sudah ada:", sql);
      return;
    }
    console.error("❌ Gagal:", sql);
    console.error(e);
    process.exit(1);
  }
}

// Tambah kolom untuk simpan ID pesan Fonnte (biar bisa cancel/reschedule)
addColumn(`ALTER TABLE notifications ADD COLUMN provider_message_id TEXT;`);
addColumn(`ALTER TABLE notifications ADD COLUMN provider_requestid TEXT;`);

console.log("✅ Migrasi selesai. Tutup file ini.");
db.close();
