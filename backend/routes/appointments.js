const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db.js");
const { authenticate, authorize } = require("../middleware/auth.js");
const { getQueue, generateQueueNumber, estimateWaitMinutes } = require("../queue/queueManager.js");

const router = express.Router();

// Customer books an appointment
router.post("/book", authenticate, authorize("customer"), (req,res)=>{
  const { serviceId, appointmentTime } = req.body;
  if(!serviceId || !appointmentTime) return res.status(400).json({error:"serviceId and appointmentTime are required."});
  const service = db.prepare("SELECT * FROM services WHERE id = ? AND active = 1").get(serviceId);
  if(!service) return res.status(404).json({error:"Service not found."});
  const appointmentId = uuidv4();
  db.prepare("INSERT INTO appointments (appointment_id, customer_id, service_id, appointment_time, status) VALUES (?, ?, ?, ?, 'Booked')").run(appointmentId, req.user.userId, serviceId, appointmentTime);
  res.status(201).json({appointmentId, serviceId, appointmentTime, status:"Booked"});
});

router.get("/my", authenticate, authorize("customer"), (req,res)=>{
  const rows = db.prepare("SELECT a.*, s.service_name FROM appointments a JOIN services s ON s.service_id = a.service_id WHERE a.customer_id = ? ORDER BY a.appointment_time ASC").all(req.user.userId);
  res.json({appointments: rows});
});

router.post("/:id/checkin", authenticate, authorize("customer"), (req,res)=>{
  const appt = db.prepare("SELECT * FROM appointments WHERE appointment_id = ? AND customer_id = ?").get(req.params.id, req.user.userId);
  if(!appt) return res.status(404).json({error:"Appointment not found."});
  if(appt.status !== "Booked") return res.status(400).json({error:"Already " + appt.status});
  const service = db.prepare("SELECT * FROM services WHERE service_id = ?").get(appt.service_id);
  const fifo = getQueue(appt.service_id);
  const queueNumber = generateQueueNumber(appt.service_id, service.service_name);
  const queueId = uuidv4();
  const est = estimateWaitMinutes(appt.service_id, fifo.size(), service.average_service_time);
  db.prepare("INSERT INTO queue (queue_id, customer_id, queue_number, service_id, check_in_time, estimated_time, status) VALUES (?, ?, ?, ?, datetime('now'), ?, 'Waiting')").run(queueId, req.user.userId, queueNumber, appt.service_id, est);
  fifo.enqueue({ queueId, customerId: req.user.userId, queueNumber, joinedAt: new Date().toISOString() });
  db.prepare("UPDATE appointments SET status = 'CheckedIn', check_in_time = datetime('now'), queue_id = ? WHERE appointment_id = ?").run(queueId, appt.appointment_id);
  res.json({message:"Checked in and joined the queue.", queueId, queueNumber});
});

router.post("/:id/cancel", authenticate, authorize("customer"), (req,res)=>{
  const appt = db.prepare("SELECT * FROM appointments WHERE appointment_id = ? AND customer_id = ?").get(req.params.id, req.user.userId);
  if(!appt) return res.status(404).json({error:"Appointment not found."});
  db.prepare("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?").run(appt.appointment_id);
  res.json({message:"Appointment cancelled.", appointmentId: appt.appointment_id});
});

module.exports = router;