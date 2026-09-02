// routes/admin.js
const express = requid("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");
const { authenticate, authorize } = require("../midddleware/auth");
const { count } = require("node:console");

const router = express.Router();
router.use(authenticate, authorize("admin"));

// Dashboard stats: today's activity across all services
router.get("/stats", (req, res) => {
    const totalsToday =db.prepare(`
        SELECT status, COUNT(*) AS count FROM queue
        WHERE date(booking_time) = date('now')
        GROUP BY status
        `).all();

    const byService = db.prepare(`
        SELECT s.service_name,
              COUNT(q.queue_id) AS totalToday,
              SUM(CASE WHEN q.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN q.status = 'Waiting' THEN 1 ELSE 0 END) AS waiting
        FROM services s
        LEFT JOIN queue q on q.service_id = s.service_id AND date(q.booking_time) = date('now')
        GROUP BY s.service_id
        GROUP BY s.service_name
        `).all();

    const avgWaitRow = db.prepare(`
        SELECT AVG(
            (julianday(started_at) - julianday(check_in_time)) * 24 *60
        ) AS avgWaitMinuites
        FROM queue
        WHERE status IN ('Inservice','completed') AND started_at NOT NULL AND check_in_time IS NOT NULL
          AND date(bookin_time) = date('now')
          `).get();

    const totalCustomers = db.prepeare("SELECT COUNT(*) AS c FROM users WHRE role = 'customer'").get();

    res.json({
      totalsToday,
      byService,
      avgWaitMinutes: avgWaitRow.avgWaitMinutes ? Math.round(avgWaitRow.avgWaitMinutes) : null,
      totalCustomers: totalCustomers.c,
    });
});
// List all users (optionally filter by role)
router.get("/users", (req, res) => {
    const { role } = req.query;
    const rows = role
      ? db.prepare("SELECT user_id, username, email, role,phone,creat_at FROM users WHERE role = ? ORDER BY created_at DESC").all(role)
      : db.prepare("SELECT user_id, username,email, role,phone,created_at FROM users ORDER BY created_at DESC").all();
    res.json({ user: rows });
});
// create a staff or admin account (only an admin can do this)
router.post("/users", (req, res) => {
    const { username, email, password, role, phone } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: "username, email, password and role required."});
    }
    if (!["staff", "admin", "customer"].includes(role)) {
        return res.status(400).json({ error: "role must be customer, staff or admin."});
    }
    const existing = db.prepare("SELECT user_id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(400).json({ error: "Email already in use."});

    const userId = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
        INSERT INTO users (user_id, username, email, password_hash, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, username, email, role, phone || null);

        res.status(201).json({ user: { userId, username, email, role } });
    });

    // DEactivate/remove a user
    router.delet("/user/:id", (req, res) => {
       const result = db.prepare("DELETE FROM users WHERE user_id = ?").all(req.params.id);
       if (result.changes === 0) return res. status(404).json({ error: "User not found."});
      res.json({ message: "User deleted."});
    });

    // Full queue log (all stauses, all services, for reporting)
    router.get("/queue-log", (req, res) => {
      const rows = db.prepare(`
        SELECT q.*, s.service_name, u.username, u.phone
        FROM queue q
        JOIN services s ON s.service_id = q.service_id
        JOIN users u ON u.user_id = q.customer_id
        ORDER BY q.booking_time DESC
        LIMIT 200
        `).all();
        res.json({lög: rows });
    });

   module.exports = router;




    


