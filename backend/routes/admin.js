// routes/admin.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const db = require("../db/db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Every route below requires a logged-in Admin.
router.use(authenticate, authorize("admin"));

// Dashboard statistics: totals by status today + per-service performance.
router.get("/stats", (req, res) => {
  const totalsToday = db.prepare(`
    SELECT status, COUNT(*) AS count FROM queue
    WHERE date(booking_time) = date('now')
    GROUP BY status
  `).all();

  const byService = db.prepare(`
    SELECT
      s.service_name AS serviceName,
      COUNT(q.queue_id) AS totalToday,
      SUM(CASE WHEN q.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN q.status = 'Waiting' THEN 1 ELSE 0 END) AS currentlyWaiting
    FROM services s
    LEFT JOIN queue q
      ON q.service_id = s.service_id AND date(q.booking_time) = date('now')
    WHERE s.active = 1
    GROUP BY s.service_id, s.service_name
    ORDER BY s.service_name
  `).all();

  res.json({ totalsToday, byService });
});

// List all user accounts.
router.get("/users", (req, res) => {
  const users = db.prepare(
    "SELECT user_id, username, email, role, created_at FROM users ORDER BY created_at DESC"
  ).all();
  res.json({ users });
});

// Admin creates a Staff or Admin account directly (no signup code needed -
// only an already-logged-in Admin can reach this route at all).
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

// Remove an account.
router.delete("/users/:id", (req, res) => {
  const result = db.prepare("DELETE FROM users WHERE user_id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({ message: "User removed." });
});

// Recent activity across all services, for the dashboard's activity table.
router.get("/queue-log", (req, res) => {
  const rows = db.prepare(`
    SELECT q.queue_number AS ticket, s.service_name AS service,
           u.username AS customer, q.status
    FROM queue q
    JOIN services s ON s.service_id = q.service_id
    JOIN users u ON u.user_id = q.customer_id
    ORDER BY q.booking_time DESC
    LIMIT 50
  `).all();
  res.json({ activity: rows });
});

module.exports = router;
