// routes/services.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Public - anyone can see the list of active services, logged in or not.
router.get("/", (req, res) => {
  const services = db.prepare(
    "SELECT * FROM services WHERE active = 1 ORDER BY service_name"
  ).all();
  res.json({ services });
});

// Admin only - add a new service.
router.post("/", authenticate, authorize("admin"), (req, res) => {
  const { serviceName, averageServiceTime } = req.body;
  if (!serviceName) {
    return res.status(400).json({ error: "serviceName is required." });
  }

  const serviceId = uuidv4();
  db.prepare(`
    INSERT INTO services (service_id, service_name, average_service_time, active)
    VALUES (?, ?, ?, 1)
  `).run(serviceId, serviceName, averageServiceTime || 5);

  res.status(201).json({
    service: { serviceId, serviceName, averageServiceTime: averageServiceTime || 5, active: 1 },
  });
});

// Admin only - edit a service's name, average time, or active status.
router.patch("/:id", authenticate, authorize("admin"), (req, res) => {
  const { serviceName, averageServiceTime, active } = req.body;

  const existing = db.prepare("SELECT * FROM services WHERE service_id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Service not found." });

  db.prepare(`
    UPDATE services
    SET service_name = ?, average_service_time = ?, active = ?
    WHERE service_id = ?
  `).run(
    serviceName ?? existing.service_name,
    averageServiceTime ?? existing.average_service_time,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  res.json({ message: "Service updated." });
});

// Admin only - remove a service (hidden, history kept).
router.delete("/:id", authenticate, authorize("admin"), (req, res) => {
  const existing = db.prepare(
    "SELECT * FROM services WHERE service_id = ? AND active = 1"
  ).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Service not found." });

  const busy = db.prepare(`
    SELECT COUNT(*) AS c FROM queue
    WHERE service_id = ? AND status IN ('Waiting','Called','InService')
  `).get(req.params.id).c;
  if (busy > 0) {
    return res.status(400).json({
      error: `Cannot remove: ${busy} customer(s) still in this service's queue.`,
    });
  }

  db.prepare("UPDATE services SET active = 0 WHERE service_id = ?").run(req.params.id);
  res.json({ message: "Service removed." });
});


module.exports = router;
