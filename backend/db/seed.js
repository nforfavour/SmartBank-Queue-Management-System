// db/seed.js
// Creates a default admin account and a starter list of banking services.
// Safe to run multiple times - it skips anything that already exists.

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const db = require("./db");

function seed() {
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@smartbank.com";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@12345";

  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO users (user_id, username, email, password_hash, role, phone, account_reference)
      VALUES (?, ?, ?, ?, 'admin', ?, ?)
    `).run(uuidv4(), "System Admin", adminEmail, hash, "N/A", "ADMIN-0001");
    console.log(`Created default admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin already exists, skipping.");
  }

  // A default staff account so you can log in and test the staff dashboard immediately
  const staffEmail = "staff@smartbank.com";
  const existingStaff = db.prepare("SELECT * FROM users WHERE email = ?").get(staffEmail);
  if (!existingStaff) {
    const hash = bcrypt.hashSync("Staff@12345", 10);
    db.prepare(`
      INSERT INTO users (user_id, username, email, password_hash, role, phone, account_reference)
      VALUES (?, ?, ?, ?, 'staff', ?, ?)
    `).run(uuidv4(), "Front Desk Staff", staffEmail, hash, "N/A", "STAFF-0001");
    console.log(`Created default staff: ${staffEmail} / Staff@12345`);
  }

  const services = [
    { name: "Deposit", time: 4 },
    { name: "Withdrawal", time: 4 },
    { name: "Transfer", time: 5 },
    { name: "Account Opening", time: 15 },
    { name: "Card Services", time: 8 },
    { name: "Customer Service", time: 6 },
  ];

  const insertService = db.prepare(`
    INSERT INTO services (service_id, service_name, average_service_time, active)
    VALUES (?, ?, ?, 1)
  `);
  const existingServices = db.prepare("SELECT service_name FROM services").all().map(s => s.service_name);

  for (const s of services) {
    if (!existingServices.includes(s.name)) {
      insertService.run(uuidv4(), s.name, s.time);
      console.log(`Created service: ${s.name}`);
    }
  }

  console.log("Seeding complete.");
}

seed();
