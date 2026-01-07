require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const { db, init } = require("./db");
const { requireAuth, handleLogin, handleLogout } = require("./auth");
const { startScheduler } = require("./scheduler");
const wa = require("./whatsapp"); // ✅ cukup 1x

init();

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "devsecret",
    resave: false,
    saveUninitialized: false
  })
);

// Login routes
app.get("/login", (req, res) => res.render("login", { error: null }));
app.post("/login", (req, res) => handleLogin(req, res));
app.get("/logout", (req, res) => handleLogout(req, res));

// Dashboard
app.get("/", requireAuth, (req, res) => {
  const stats = {
    parents: db.prepare(`SELECT COUNT(*) AS c FROM parents`).get().c,
    children: db.prepare(`SELECT COUNT(*) AS c FROM children`).get().c,
    schedules: db.prepare(`SELECT COUNT(*) AS c FROM schedules`).get().c,
    pendingNotif: db.prepare(`SELECT COUNT(*) AS c FROM notifications WHERE status='pending'`).get().c
  };

  const upcoming = db.prepare(`
    SELECT s.id, s.scheduled_at, s.status, c.name AS child_name, p.name AS parent_name, i.name AS imun_name
    FROM schedules s
    JOIN children c ON c.id = s.child_id
    JOIN parents p ON p.id = c.parent_id
    JOIN immunizations i ON i.id = s.immunization_id
    WHERE s.status='planned'
    ORDER BY s.scheduled_at ASC
    LIMIT 10
  `).all();

  res.render("dashboard", { user: req.session.user, stats, upcoming });
});

// Parents
app.get("/parents", requireAuth, (req, res) => {
  const parents = db.prepare(`SELECT * FROM parents ORDER BY id DESC`).all();
  res.render("parents", { user: req.session.user, parents });
});
app.post("/parents", requireAuth, (req, res) => {
  const { name, phone, address, consent } = req.body;
  db.prepare(`
    INSERT INTO parents (name, phone, address, consent)
    VALUES (?, ?, ?, ?)
  `).run(name, phone, address || "", consent ? 1 : 0);
  res.redirect("/parents");
});

// Children
app.get("/children", requireAuth, (req, res) => {
  const parents = db.prepare(`SELECT id, name FROM parents ORDER BY name`).all();
  const children = db.prepare(`
    SELECT c.*, p.name AS parent_name
    FROM children c JOIN parents p ON p.id = c.parent_id
    ORDER BY c.id DESC
  `).all();
  res.render("children", { user: req.session.user, parents, children });
});
app.post("/children", requireAuth, (req, res) => {
  const { parent_id, name, dob, gender } = req.body;
  db.prepare(`
    INSERT INTO children (parent_id, name, dob, gender)
    VALUES (?, ?, ?, ?)
  `).run(parent_id, name, dob || "", gender || "");
  res.redirect("/children");
});

// Helpers
function addDaysToISO(dateStr, days) {
  const [d, t] = dateStr.split(" ");
  const dt = new Date(`${d}T${t}:00`);
  dt.setDate(dt.getDate() + days);
  const pad = n => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// ================================
// DELETE HELPERS (hapus berantai + cancel WA jika ada)
// ================================
async function cancelProviderMessagesForSchedule(scheduleId) {
  const msgs = db.prepare(`
    SELECT provider_message_id
    FROM notifications
    WHERE schedule_id = ?
      AND provider_message_id IS NOT NULL
      AND provider_message_id != ''
  `).all(scheduleId);

  for (const m of msgs) {
    if (!m.provider_message_id) continue;
    try {
      if (typeof wa.cancelMessage === "function") {
        await wa.cancelMessage(m.provider_message_id);
      }
    } catch (e) {
      console.warn("Cancel WA gagal:", e.message);
    }
  }
}

function deleteScheduleLocal(scheduleId) {
  db.prepare(`DELETE FROM notifications WHERE schedule_id = ?`).run(scheduleId);
  db.prepare(`DELETE FROM schedules WHERE id = ?`).run(scheduleId);
}

// Schedules
app.get("/schedules", requireAuth, (req, res) => {
  const children = db.prepare(`
    SELECT c.id, c.name, p.name AS parent_name
    FROM children c JOIN parents p ON p.id = c.parent_id
    ORDER BY c.name
  `).all();
  const immun = db.prepare(`SELECT id, name FROM immunizations ORDER BY name`).all();
  const schedules = db.prepare(`
    SELECT s.*, c.name AS child_name, p.name AS parent_name, i.name AS imun_name
    FROM schedules s
    JOIN children c ON c.id = s.child_id
    JOIN parents p ON p.id = c.parent_id
    JOIN immunizations i ON i.id = s.immunization_id
    ORDER BY s.scheduled_at DESC
    LIMIT 200
  `).all();

  res.render("schedules", { user: req.session.user, children, immun, schedules });
});

app.post("/schedules", requireAuth, (req, res) => {
  const { child_id, immunization_id, date, time, location, notes } = req.body;
  const scheduled_at = `${date} ${time}`;

  const info = db.prepare(`
    INSERT INTO schedules (child_id, immunization_id, scheduled_at, location, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(child_id, immunization_id, scheduled_at, location || "", notes || "");

  const scheduleId = info.lastInsertRowid;

  const h7 = addDaysToISO(scheduled_at, -7);
  const h1 = addDaysToISO(scheduled_at, -1);
  const h0 = `${date} 07:00`;

  const stmt = db.prepare(`
    INSERT INTO notifications (schedule_id, send_at, type)
    VALUES (?, ?, ?)
  `);

  stmt.run(scheduleId, h7, "H-7");
  stmt.run(scheduleId, h1, "H-1");
  stmt.run(scheduleId, h0, "H0");

  res.redirect("/schedules");
});

// ✅ Hapus jadwal (cancel WA jika ada provider_message_id)
app.post("/schedules/:id/delete", requireAuth, async (req, res) => {
  const scheduleId = req.params.id;

  // cancel WA (kalau ada) lalu hapus lokal
  await cancelProviderMessagesForSchedule(scheduleId);
  deleteScheduleLocal(scheduleId);

  res.redirect("/schedules");
});

// ✅ HAPUS CHILD (balita) + semua schedule + notifikasi
app.post("/children/:id/delete", requireAuth, async (req, res) => {
  const childId = req.params.id;

  const schedules = db.prepare(`SELECT id FROM schedules WHERE child_id = ?`).all(childId);

  for (const s of schedules) {
    await cancelProviderMessagesForSchedule(s.id);
    deleteScheduleLocal(s.id);
  }

  db.prepare(`DELETE FROM children WHERE id = ?`).run(childId);

  return res.redirect("/children");
});

// ✅ HAPUS PARENT (orang tua) + semua child + schedule + notifikasi
app.post("/parents/:id/delete", requireAuth, async (req, res) => {
  const parentId = req.params.id;

  const children = db.prepare(`SELECT id FROM children WHERE parent_id = ?`).all(parentId);

  for (const c of children) {
    const schedules = db.prepare(`SELECT id FROM schedules WHERE child_id = ?`).all(c.id);
    for (const s of schedules) {
      await cancelProviderMessagesForSchedule(s.id);
      deleteScheduleLocal(s.id);
    }
  }

  db.prepare(`DELETE FROM children WHERE parent_id = ?`).run(parentId);
  db.prepare(`DELETE FROM parents WHERE id = ?`).run(parentId);

  return res.redirect("/parents");
});

// Logs
app.get("/logs", requireAuth, (req, res) => {
  const logs = db.prepare(`
    SELECT
      n.*, s.scheduled_at,
      c.name AS child_name, p.name AS parent_name, p.phone,
      i.name AS imun_name
    FROM notifications n
    JOIN schedules s ON s.id = n.schedule_id
    JOIN children c ON c.id = s.child_id
    JOIN parents p ON p.id = c.parent_id
    JOIN immunizations i ON i.id = s.immunization_id
    ORDER BY n.id DESC
    LIMIT 300
  `).all();

  res.render("logs", { user: req.session.user, logs });
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => {
  console.log(`✅ Server jalan: ${process.env.BASE_URL || `http://localhost:${port}`}`);
  startScheduler();
});
