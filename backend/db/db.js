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