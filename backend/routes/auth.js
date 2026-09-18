// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Public self-registration. Everyone creates their own account - there are
// no default/seeded logins in this system.
//
// role defaults to "customer" if not provided, which is what the public
// registration form on index.html sends.
//
// To register as "staff" or "admin" instead, the request must also include
// a matching signupCode - this is how your team controls who can become
// staff/admin, without hardcoding any default accounts. Set these in your
// .env file (see .env.example): STAFF_SIGNUP_CODE and ADMIN_SIGNUP_CODE.
router.post("/register", (req, res) => {
  const { username, email, password, phone, accountReference, role, signupCode } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const requestedRole = role || "customer";
  if (!["customer", "staff", "admin"].includes(requestedRole)) {
    return res.status(400).json({ error: "role must be customer, staff, or admin." });
  }

  if (requestedRole === "staff" && signupCode !== process.env.STAFF_SIGNUP_CODE) {
    return res.status(403).json({ error: "Invalid staff signup code." });
  }
  if (requestedRole === "admin" && signupCode !== process.env.ADMIN_SIGNUP_CODE) {
    return res.status(403).json({ error: "Invalid admin signup code." });
  }

  const existing = db.prepare("SELECT user_id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const userId = uuidv4();
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (user_id, username, email, password_hash, role, phone, account_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, username, email, hash, requestedRole, phone || null, accountReference || null);

  const token = signToken({ userId, role: requestedRole, username });
  res.status(201).json({
    token,
    user: { userId, username, email, role: requestedRole },
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken({ userId: user.user_id, role: user.role, username: user.username });
  res.json({
    token,
    user: {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

router.get("/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT user_id, username, email, role, phone, account_reference FROM users WHERE user_id = ?")
    .get(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

module.exports = router;
