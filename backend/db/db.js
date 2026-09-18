// db/db.js
// Sets up the SQLite database connection and creates all tables if they
// do not already exist. better-sqlite3 is synchronous, which keeps the
// FIFO queue logic simple and race-condition-free for a project of this size.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "smartbank.sqlite");

// Make sure the folder exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT PRIMARY KEY,
  username      TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer','staff','admin')),
  phone         TEXT,
  account_reference TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  service_id    TEXT PRIMARY KEY,
  service_name  TEXT NOT NULL,
  average_service_time INTEGER NOT NULL DEFAULT 5, -- minutes
  active        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS queue (
  queue_id       TEXT PRIMARY KEY,
  customer_id    TEXT NOT NULL,
  queue_number   TEXT NOT NULL,
  service_id     TEXT NOT NULL,
  booking_time   TEXT NOT NULL DEFAULT (datetime('now')),
  check_in_time  TEXT,
  estimated_time INTEGER,
  position_snapshot INTEGER,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending','Waiting','Called','InService','Completed','Skipped','Cancelled','Absent','Declined')
  ),
  called_at      TEXT,
  started_at     TEXT,
  completed_at   TEXT,
  FOREIGN KEY (customer_id) REFERENCES users(user_id),
  FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id  TEXT PRIMARY KEY,
  customer_id     TEXT NOT NULL,
  service_id      TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  check_in_time   TEXT,
  status TEXT NOT NULL DEFAULT 'Booked' CHECK (
    status IN ('Booked','CheckedIn','Cancelled','NoShow')
  ),
  queue_id TEXT,
  FOREIGN KEY (customer_id) REFERENCES users(user_id),
  FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_service_status ON queue(service_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_customer ON queue(customer_id);
`);

// Add verification columns if they don't already exist (safe on existing databases)
try {
  db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
} catch (e) { /* column already exists, ignore */ }
try {
  db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
} catch (e) { /* column already exists, ignore */ }

module.exports = db;
