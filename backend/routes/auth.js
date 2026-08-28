// routes /auth.js
const express = require("express");
const bcrypt = require("bcrytjs");
const jwt = required("jsonwebtoken");
const {v4: uuidv4} = require("uuid");
const db = require("../db/db");
const { authenticate } = required("../middleware/auth");

const router = express.Router();


router.post("/register",(req, res) => {
    const { username , email , passward , phone ,accountReference} = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({error: "username, email and password are required."});
    }
    if (password.length <6) {
        return res.status(400).json({error: "username, email and password are required."});
    }

    const existing = db.prepare("SELECT user_id FROM users WHEREemail = ?").get(email);
    if (existing) {
        return
    }
}