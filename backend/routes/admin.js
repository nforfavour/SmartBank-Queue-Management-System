// routes/admin.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const db = require("../db/db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("admin"));

// Dashboard statistics - field names match admin.html exactly.
router.get("/stats", (req, res) => {
  const totalsToday = db.prepare(`
    SELECT status, COUNT(*) AS count FROM queue
    WHERE date(booking_time) = date('now')
    GROUP BY status
  `).all();

  const byService = db.prepare(`
    SELECT
      s.service_name AS service_name,
      COUNT(q.queue_id) AS totalToday,
      SUM(CASE WHEN q.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN q.status = 'Waiting' THEN 1 ELSE 0 END) AS waiting
    FROM services s
    LEFT JOIN queue q
      ON q.service_id = s.service_id AND date(q.booking_time) = date('now')
    WHERE s.active = 1
    GROUP BY s.service_id, s.service_name
    ORDER BY s.service_name
  `).all();

  const totalCustomers = db.prepare(
    "SELECT COUNT(*) AS c FROM users WHERE role = 'customer'"
  ).get().c;

  const avgRow = db.prepare(`
    SELECT AVG(estimated_time) AS avg FROM queue
    WHERE date(booking_time) = date('now') AND estimated_time IS NOT NULL
  `).get();
  const avgWaitMinutes = avgRow.avg ? Math.round(avgRow.avg) : null;

  res.json({ totalsToday, byService, totalCustomers, avgWaitMinutes });
});

// List users, optionally filtered by role (?role=staff)
router.get("/users", (req, res) => {
  const { role } = req.query;
  const users = role
    ? db.prepare(
        "SELECT user_id, username, email, role, created_at FROM users WHERE role = ? ORDER BY created_at DESC"
      ).all(role)
    : db.prepare(
        "SELECT user_id, username, email, role, created_at FROM users ORDER BY created_at DESC"
      ).all();
  res.json({ users });
});

// Admin creates a Staff or Admin account directly.
router.post("/users", (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const finalRole = role || "staff";
  if (!["staff", "admin"].includes(finalRole)) {
    return res.status(400).json({ error: "role must be staff or admin." });
  }

  const existing = db.prepare("SELECT user_id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const userId = uuidv4();
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (user_id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, username, email, hash, finalRole);

  res.status(201).json({
    user: { userId, username, email, role: finalRole },
  });
});

router.delete("/users/:id", (req, res) => {
  const result = db.prepare("DELETE FROM users WHERE user_id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ message: "User removed." });
});

// Recent activity - admin.html expects { log: [...] }
router.get("/queue-log", (req, res) => {
  const rows = db.prepare(`
    SELECT q.queue_number, s.service_name, u.username, q.status, q.booking_time
    FROM queue q
    JOIN services s ON s.service_id = q.service_id
    JOIN users u ON u.user_id = q.customer_id
    ORDER BY q.booking_time DESC
    LIMIT 50
  `).all();
  res.json({ log: rows });
});

module.exports = router;