const Database = require("better-sqlite3");
require("dotenv").config();

const db = new Database(process.env.DB_PATH || "./posyandu.db");

function init() {
  db.exec(`
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,              -- format: 62xxxxxxxxxxx
      address TEXT,
      consent INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      FOREIGN KEY(parent_id) REFERENCES parents(id)
    );

    CREATE TABLE IF NOT EXISTS immunizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      immunization_id INTEGER NOT NULL,
      scheduled_at TEXT NOT NULL,       -- ISO datetime local (YYYY-MM-DD HH:MM)
      location TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'planned',  -- planned|done|missed
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(child_id) REFERENCES children(id),
      FOREIGN KEY(immunization_id) REFERENCES immunizations(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      send_at TEXT NOT NULL,
      type TEXT NOT NULL,               -- H-7 | H-1 | H0
      status TEXT NOT NULL DEFAULT 'pending', -- pending|sent|failed|skipped
      last_error TEXT,
      sent_at TEXT,
      FOREIGN KEY(schedule_id) REFERENCES schedules(id)
    );
  `);
}

module.exports = { db, init };