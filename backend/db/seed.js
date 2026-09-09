// db/seed.js
// Creates a default admin account and a starter list of banking services.
// Safe to run multiple times - it skips anything that already exists.

const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const db = require("./db");m

function seed() {
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

  console.log("Seeding complete. No default account were create - register at /api/auth/register.");
}

seed();
