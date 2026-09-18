// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");
const { authenticate } = require("../middleware/auth");
const { sendVerificationEmail } = require("../utils/mailer");

const router = express.Router();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

// STEP 1: Register - creates the account as UNVERIFIED and emails a code.
router.post("/register", async (req, res) => {
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
  const code = generateCode();

  db.prepare(`
    INSERT INTO users (user_id, username, email, password_hash, role, phone, account_reference, email_verified, verification_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(userId, username, email, hash, requestedRole, phone || null, accountReference || null, code);

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return res.status(500).json({ error: "Could not send verification email. Please try again." });
  }

  res.status(201).json({
    message: "Verification code sent to your email.",
    email: email,
  });
});

// STEP 2: Verify the code - only then does the account become usable + logged in.
router.post("/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "email and code are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(404).json({ error: "Account not found." });
  if (user.email_verified) return res.status(400).json({ error: "Account already verified." });
  if (user.verification_code !== code) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  db.prepare("UPDATE users SET email_verified = 1, verification_code = NULL WHERE user_id = ?").run(user.user_id);

  const token = signToken({ userId: user.user_id, role: user.role, username: user.username });
  res.json({
    token,
    user: { userId: user.user_id, username: user.username, email: user.email, role: user.role },
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password." });

  if (!user.email_verified) {
    return res.status(403).json({ error: "Please verify your email before logging in." });
  }

  const token = signToken({ userId: user.user_id, role: user.role, username: user.username });
  res.json({
    token,
    user: { userId: user.user_id, username: user.username, email: user.email, role: user.role },
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
