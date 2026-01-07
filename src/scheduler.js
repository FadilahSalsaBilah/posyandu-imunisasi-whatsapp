// src/scheduler.js
const cron = require("node-cron");
require("dotenv").config();
const { db } = require("./db");
const { sendWhatsAppTemplate } = require("./whatsapp");

function nowISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function processPending() {
  const now = nowISO();

  const rows = db.prepare(`
    SELECT
      n.id AS notif_id, n.type, n.send_at,
      p.name AS parent_name, p.phone, p.consent,
      c.name AS child_name,
      i.name AS imun_name,
      s.scheduled_at, COALESCE(s.location, '') AS location
    FROM notifications n
    JOIN schedules s ON s.id = n.schedule_id
    JOIN children c ON c.id = s.child_id
    JOIN parents p ON p.id = c.parent_id
    JOIN immunizations i ON i.id = s.immunization_id
    WHERE n.status = 'pending'
      AND n.send_at <= ?
    ORDER BY n.send_at ASC
    LIMIT 50
  `).all(now);

  for (const r of rows) {
    try {
      if (!r.consent) {
        db.prepare(`UPDATE notifications SET status='skipped', last_error=? WHERE id=?`)
          .run("No consent", r.notif_id);
        continue;
      }

      const templateName = process.env.WA_TEMPLATE_NAME || "posyandu_imunisasi_reminder";
      const lang = process.env.WA_TEMPLATE_LANG || "id";

      const posyanduName = process.env.POSYANDU_NAME || "Posyandu";
      const posyanduLoc = process.env.POSYANDU_LOCATION || "";
      const contact = process.env.POSYANDU_CONTACT || "";

      // urutan variabel harus sesuai template kamu
      const vars = [
        r.parent_name,
        r.child_name,
        r.imun_name,
        r.scheduled_at,
        r.location || `${posyanduName} - ${posyanduLoc}`,
        contact,
        r.type // H-7 / H-1 / H0
      ];

      await sendWhatsAppTemplate({
        to: r.phone,
        templateName,
        lang,
        variables: vars
      });

      db.prepare(`UPDATE notifications SET status='sent', sent_at=datetime('now','localtime') WHERE id=?`)
        .run(r.notif_id);

    } catch (e) {
      db.prepare(`UPDATE notifications SET status='failed', last_error=? WHERE id=?`)
        .run(String(e?.message || e), r.notif_id);
    }
  }
}

function startScheduler() {
  cron.schedule("* * * * *", () => {
    processPending().catch((err) => console.error("Scheduler error:", err));
  });
  console.log("✅ Scheduler aktif: cek notifikasi tiap 1 menit");
}

module.exports = { startScheduler, processPending };
