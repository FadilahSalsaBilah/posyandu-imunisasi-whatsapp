require("dotenv").config();
const bcrypt = require("bcrypt");
const { db, init } = require("./db");

init();

function upsertImun(code, name, description = "") {
  db.prepare(`
    INSERT INTO immunizations (code, name, description)
    VALUES (?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET name=excluded.name, description=excluded.description
  `).run(code, name, description);
}

(async () => {
  // admin default: admin / admin123 (ubah setelah login)
  const username = "admin";
  const pass = "admin123";
  const hash = await bcrypt.hash(pass, 10);

  db.prepare(`
    INSERT INTO admin_users (username, password_hash)
    VALUES (?, ?)
    ON CONFLICT(username) DO NOTHING
  `).run(username, hash);

  upsertImun("BCG", "BCG", "Mencegah TBC berat pada bayi");
  upsertImun("POLIO", "Polio", "Mencegah poliomyelitis");
  upsertImun("DPT", "DPT", "Difteri, Pertusis, Tetanus");
  upsertImun("HB", "Hepatitis B", "Mencegah Hepatitis B");
  upsertImun("MR", "MR", "Measles Rubella");

  console.log("✅ Seed selesai. Login: admin / admin123");
})();
