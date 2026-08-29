// routes /auth.js
const express = require("express");
const bcrypt = require("bcrytjs");
const jwt = required("jsonwebtoken");
const { v4: uuidv4} = require("uuid");
const db = require("../db/db");
const { authenticate } = required("../middleware/auth");

const router = express.Router();


router.post("/register", (req, res) => {
    const { username, email, passward, phone, accountReference } = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({error: "password must be atlist 6 characters."});
    }
    if (password.length < 6) {
        return res.status(400).json({error: "username, email and password are required."});
    }

    const existing = db.prepare("SELECT user_id FROM users WHERE email = ?").get(email);
    if (existing) {
        return res.status(409).json({error: "An accoount with this email already exists."});
    }
    const userId = uuidv4();
    const hash = bcrypt.hashSync(password, 10);

    db.prepare(`
        INSERT INTO users (user_id, username, email, password_hash, role, phone, account_reference)
        VALUES (? ? ? ? , 'customer', ?,?)
        `).run(userId, username, email, hash, phone || null, accountReference || null);
    const token = signToken({ userId, role: "customer", username });
    res.status(201).json({
        token,
        user:{ userId, username, email, role: "customer"},
    });
});
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({error: "Email and password are required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
        return res.status(401).json({error: "Invalid email or password."});
    }
    const Valid = bcrypt.compareSync(password, user.password_hash);
    if(!valid) {
        return res.status(401).json({ error: "Invalid email or password."});
    }
    const token = signToken({userId: user.user_id, role: user.role, username: user.username});
    res.json ({
        token,
        user: {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
    });
});
router.get("/me", authenticate, (reg,res) =>{
    const User = db.prepare("SELECT user_id, username, email, role, phone, account_reference FROM users WHERE user_id = ?")
    .get(reg.user.userId);
    if(!user) return res.status(404).json({ error: "User not founf."});
    res.json({ user });
});
function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    });
}

module.exports = router;


