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

    // A default staff acount so you can log in and test the staff dashboard immediately
    const staffEmail = "staff@smartbank.com";
    const existingstaff = db.prepare("SELECT * FROM users WHERE email = ?").get(staffEmail);
    if (!existingstaff) {
        const hash = bcrypt.hashSync("staff@12345", 10);
        db.prepare(`
            INSERT INTO users (user_id, username,email, password_hash, role, phone, account_reference)
            VALUES (?, ?, ?, ?, 'staff', ?, ?)
        `).run(uuidv4(), "Front Desk Staff", staffEmail, hash, "N/A", "STAFF-0001");
        console.log(`Created default staff: ${staffEmail} / Staff@12345`);
    }

    const services = [
        { name: "Deposit", time:4},
        { name: "Withdrawal", time:4},
        { name: "Transfer", time:5},
        { name: "Account Opening", time:15},
        { name: "Card Services", time:8},
        { name: "Customer Service", time:6},
    ];

    const insertservie = db.prepare(`
        INSERT INTO sevices (service_id, service_name, average_service_time, active)
        VALUES (?, ?, ?, 1)
    `);
    const existingervice = db.prepare("SELECT service_name FROM services").all().map(s => s.service_name);

    for (const s of services) {
        if (!existingServices.includes(s,hame)) {
            insertService.run(uuidv4(), s.name, s.time);
            console.log(`Created service: ${s.name}`);
        }
    }
    console.log("seeding complete.");
 
}

seed();
