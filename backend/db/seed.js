//db/seed.js
//creates a default admin account and starter list of banking services.
// safe to run multiple times - it skips anything that already exists.
 
const { v4: uuidv4} = require("uuid");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const db = require("./db");

function seed(){
const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@smartbank.com";
const adminpassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin@12345";

const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail)
if (!existingAdmin) {
    const hash = bcrypt.hashsync(adminPassword, 10);
    db.prepare(`
        INSERT  INTO users (user_id, username, email,password_hash,role,phone, account_reference)
        VALUES (?, ?, ?, ?, 'admin', ?, ?)
    `).run(uuidv4(), "System Admin", adminEmail, hash, "N/A", "ADMIN-0001");
    console.log (`create default admin: ${adminEmail} / ${adminPassword}`);
}else {
    console.log("admin alredy exists, skipping.");
}

