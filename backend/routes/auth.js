// routes/auth.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
<<<<<<< HEAD
const crypto = require("crypto");

const db = require("../db/db");
const { authenticate } = require("../middleware/auth");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/mailer");
=======

const db = require("../db/db");
const { authenticate } = require("../middleware/auth");
const { sendVerificationEmail } = require("../utils/mailer");
>>>>>>> origin/main

const router = express.Router();


// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      accountReference,
      role,
      signupCode
    } = req.body;

    // -----------------------------
    // Validate required fields
    // -----------------------------

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters."
      });
    }

    // -----------------------------
    // Clean email
    // -----------------------------

    const cleanEmail = email.trim().toLowerCase();

    // -----------------------------
    // Determine role
    // -----------------------------

    const requestedRole = role || "customer";

    if (!["customer", "staff", "admin"].includes(requestedRole)) {
      return res.status(400).json({
        error: "role must be customer, staff, or admin."
      });
    }

    // -----------------------------
    // Staff protection
    // -----------------------------

    if (
      requestedRole === "staff" &&
      signupCode !== process.env.STAFF_SIGNUP_CODE
    ) {
      return res.status(403).json({
        error: "Invalid staff signup code."
      });
    }

    // -----------------------------
    // Admin protection
    // -----------------------------

    if (
      requestedRole === "admin" &&
      signupCode !== process.env.ADMIN_SIGNUP_CODE
    ) {
      return res.status(403).json({
        error: "Invalid admin signup code."
      });
    }

    // -----------------------------
    // Check existing account
    // -----------------------------

    const existing = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(cleanEmail);

    // If account exists but has NOT been verified,
    // allow the user to receive a new verification code.
    if (existing && existing.email_verified !== 1) {

      const verificationCode =
        Math.floor(100000 + Math.random() * 900000).toString();

      db.prepare(`
        UPDATE users
        SET verification_code = ?
        WHERE user_id = ?
      `).run(
        verificationCode,
        existing.user_id
      );

      try {

        await sendVerificationEmail(
          cleanEmail,
          verificationCode
        );

        return res.status(200).json({
          message:
            "A new verification code has been sent to your email.",
          email: cleanEmail
        });

      } catch (error) {

        console.error(
          "[AUTH] Failed to resend verification email:",
          error
        );

        return res.status(500).json({
          error:
            "We could not send the verification email. Please try again."
        });
      }
    }

    // If account is already verified
    if (existing && existing.email_verified === 1) {
      return res.status(409).json({
        error:
          "An account with this email already exists."
      });
    }

    // -----------------------------
    // Create new user
    // -----------------------------

    const userId = uuidv4();

    const passwordHash =
      bcrypt.hashSync(password, 10);

    // -----------------------------
    // Generate 6-digit code
    // -----------------------------

    const verificationCode =
      Math.floor(100000 + Math.random() * 900000).toString();

    // -----------------------------
    // Insert user
    // -----------------------------

    db.prepare(`
      INSERT INTO users (
        user_id,
        username,
        email,
        password_hash,
        role,
        phone,
        account_reference,
        email_verified,
        verification_code
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      username.trim(),
      cleanEmail,
      passwordHash,
      requestedRole,
      phone || null,
      accountReference || null,
      0,
      verificationCode
    );

    // -----------------------------
    // Send verification email
    // -----------------------------

    try {

      await sendVerificationEmail(
        cleanEmail,
        verificationCode
      );

      console.log(
        `[AUTH] Verification email sent to ${cleanEmail}`
      );

    } catch (error) {

      console.error(
        "[AUTH] Failed to send verification email:",
        error
      );

      // Remove account if email could not be sent
      db.prepare(
        "DELETE FROM users WHERE user_id = ?"
      ).run(userId);

      return res.status(500).json({
        error:
          "Account could not be created because the verification email could not be sent."
      });
    }

    // -----------------------------
    // Do NOT create JWT yet
    // -----------------------------

    return res.status(201).json({
      message:
        "Registration successful. A verification code has been sent to your email.",
      email: cleanEmail
    });

  } catch (error) {

    console.error(
      "[AUTH] Registration error:",
      error
    );

    return res.status(500).json({
      error:
        "Something went wrong during registration."
    });
  }
});


// ======================================================
// VERIFY EMAIL
// ======================================================

router.post("/verify", (req, res) => {

  try {

    const { email, code } = req.body;

    // -----------------------------
    // Validate input
    // -----------------------------

    if (!email || !code) {
      return res.status(400).json({
        error:
          "Email and verification code are required."
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanCode =
      String(code).trim();

    // -----------------------------
    // Find user
    // -----------------------------

    const user = db
      .prepare(
        "SELECT * FROM users WHERE email = ?"
      )
      .get(cleanEmail);

    if (!user) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    // -----------------------------
    // Check verification status
    // -----------------------------

    if (user.email_verified === 1) {
      return res.status(400).json({
        error:
          "Email is already verified."
      });
    }

    // -----------------------------
    // Check verification code
    // -----------------------------

    if (
      String(user.verification_code) !==
      cleanCode
    ) {
      return res.status(400).json({
        error:
          "Invalid verification code."
      });
    }

    // -----------------------------
    // Verify account
    // -----------------------------

    db.prepare(`
      UPDATE users
      SET
        email_verified = 1,
        verification_code = NULL
      WHERE user_id = ?
    `).run(user.user_id);

    // -----------------------------
    // Create JWT
    // -----------------------------

    const token = signToken({
      userId: user.user_id,
      role: user.role,
      username: user.username
    });

    // -----------------------------
    // Return successful login
    // -----------------------------

    return res.json({

      message:
        "Email verified successfully.",

      token,

      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }

    });

  } catch (error) {

    console.error(
      "[AUTH] Verification error:",
      error
    );

    return res.status(500).json({
      error:
        "Something went wrong while verifying your email."
    });
  }
});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error:
          "email and password are required."
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // -----------------------------
    // Find user
    // -----------------------------

    const user = db
      .prepare(
        "SELECT * FROM users WHERE email = ?"
      )
      .get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        error:
          "Invalid email or password."
      });
    }

    // -----------------------------
    // Check password
    // -----------------------------

    const valid =
      bcrypt.compareSync(
        password,
        user.password_hash
      );

    if (!valid) {
      return res.status(401).json({
        error:
          "Invalid email or password."
      });
    }

    // -----------------------------
    // Check email verification
    // -----------------------------

    if (user.email_verified !== 1) {
      return res.status(403).json({
        error:
          "Please verify your email address before logging in."
      });
    }

    // -----------------------------
    // Create token
    // -----------------------------

    const token = signToken({
      userId: user.user_id,
      role: user.role,
      username: user.username
    });

    return res.json({

      token,

      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }

    });

  } catch (error) {

    console.error(
      "[AUTH] Login error:",
      error
    );

    return res.status(500).json({
      error:
        "Something went wrong during login."
    });
  }
});


// ======================================================
// CURRENT USER
// ======================================================

router.get("/me", authenticate, (req, res) => {

  const user = db
    .prepare(`
      SELECT
        user_id,
        username,
        email,
        role,
        phone,
        account_reference
      FROM users
      WHERE user_id = ?
    `)
    .get(req.user.userId);

  if (!user) {
    return res.status(404).json({
      error: "User not found."
    });
  }

  res.json({ user });
});


// ======================================================
<<<<<<< HEAD
// FORGOT PASSWORD  (step 1: e-mail a 6-digit reset code)
// ======================================================

const RESET_CODE_MINUTES = 10;   // how long a reset code stays valid
const RESET_MAX_ATTEMPTS = 5;    // wrong guesses allowed per code
const RESET_RESEND_SECONDS = 60; // minimum gap between two codes

function hashResetCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function clearResetCode(userId) {
  db.prepare(`
    UPDATE users
    SET reset_code = NULL, reset_code_expires = NULL, reset_attempts = 0
    WHERE user_id = ?
  `).run(userId);
}

router.post("/forgot-password", async (req, res) => {

  try {

    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        error: "Email is required."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // The same answer is given whether or not the account exists,
    // so nobody can use this form to find out who has an account.
    const genericReply = {
      message:
        "If an account exists for that email, a 6-digit reset code has been sent.",
      email: cleanEmail
    };

    const user = db
      .prepare(
        "SELECT user_id, reset_code_expires FROM users WHERE email = ?"
      )
      .get(cleanEmail);

    if (!user) {
      return res.json(genericReply);
    }

    // Do not send a new code if one was issued less than a minute ago.
    const now = Date.now();
    const issuedAt = user.reset_code_expires
      ? user.reset_code_expires - RESET_CODE_MINUTES * 60 * 1000
      : 0;

    if (issuedAt && now - issuedAt < RESET_RESEND_SECONDS * 1000) {
      return res.json(genericReply);
    }

    // Random 6-digit code (cryptographically secure); only its hash is stored.
    const code = String(crypto.randomInt(100000, 1000000));

    db.prepare(`
      UPDATE users
      SET
        reset_code = ?,
        reset_code_expires = ?,
        reset_attempts = 0
      WHERE user_id = ?
    `).run(
      hashResetCode(code),
      now + RESET_CODE_MINUTES * 60 * 1000,
      user.user_id
    );

    try {

      await sendPasswordResetEmail(cleanEmail, code, RESET_CODE_MINUTES);

      console.log(`[AUTH] Password reset email sent to ${cleanEmail}`);

    } catch (error) {

      console.error("[AUTH] Failed to send password reset email:", error);

      // Nothing was delivered, so the code is useless - remove it.
      clearResetCode(user.user_id);

      return res.status(500).json({
        error:
          "We could not send the reset email. Please try again."
      });
    }

    return res.json(genericReply);

  } catch (error) {

    console.error("[AUTH] Forgot password error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
});


// ======================================================
// RESET PASSWORD  (step 2: check the code, set a new password)
// ======================================================

router.post("/reset-password", (req, res) => {

  try {

    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: "Email, reset code and new password are required."
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters."
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const badCode = () =>
      res.status(400).json({ error: "Invalid or expired reset code." });

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(cleanEmail);

    if (!user || !user.reset_code || !user.reset_code_expires) {
      return badCode();
    }

    // Expired?
    if (Date.now() > user.reset_code_expires) {
      clearResetCode(user.user_id);
      return badCode();
    }

    // Too many wrong guesses on this code?
    if ((user.reset_attempts || 0) >= RESET_MAX_ATTEMPTS) {
      clearResetCode(user.user_id);
      return res.status(400).json({
        error: "Too many incorrect attempts. Please request a new code."
      });
    }

    // Compare the hash of what was typed with the stored hash.
    const typed = Buffer.from(hashResetCode(cleanCode));
    const stored = Buffer.from(user.reset_code);

    const matches =
      typed.length === stored.length &&
      crypto.timingSafeEqual(typed, stored);

    if (!matches) {

      const attempts = (user.reset_attempts || 0) + 1;

      if (attempts >= RESET_MAX_ATTEMPTS) {
        clearResetCode(user.user_id);
        return res.status(400).json({
          error: "Too many incorrect attempts. Please request a new code."
        });
      }

      db.prepare(
        "UPDATE users SET reset_attempts = ? WHERE user_id = ?"
      ).run(attempts, user.user_id);

      return badCode();
    }

    // Code is correct: save the new password and use up the code.
    // Receiving the code proves the person owns this e-mail address,
    // so the account is also marked as verified.
    db.prepare(`
      UPDATE users
      SET
        password_hash = ?,
        email_verified = 1,
        verification_code = NULL,
        reset_code = NULL,
        reset_code_expires = NULL,
        reset_attempts = 0
      WHERE user_id = ?
    `).run(
      bcrypt.hashSync(String(newPassword), 10),
      user.user_id
    );

    return res.json({
      message:
        "Password reset successfully. You can now log in with your new password."
    });

  } catch (error) {

    console.error("[AUTH] Reset password error:", error);

    return res.status(500).json({
      error: "Something went wrong while resetting your password."
    });
  }
});


// ======================================================
// JWT
// ======================================================

function signToken(payload) {

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "8h"
    }
  );

}

=======
// JWT
// ======================================================

function signToken(payload) {

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "8h"
    }
  );

}

>>>>>>> origin/main

module.exports = router;