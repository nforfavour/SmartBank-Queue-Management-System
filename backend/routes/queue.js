// join FIFO queue -> staff calls -> serve -> complete -> queue updates.
// select service -> get queue number + estimated wait -> accept/decline

const express = require("express");        //Imports the express framework used to create the web server and defines routes
const { v4: uuidv4 } = require("uuid");    //Imports uuidv4 function to generate unique identifiers for queue entries
const db = require("../db/db");            //Imports the database module to interact with the database
const { authenticate, authorize } = require("../middleware/auth");  //Imports authentication and authorization middleware functions to protect certain routes
const {
  getQueue,
  generateQueueNumber,
  estimateWaitMinutes,                     //Imports functions from the queueManager module to handle queue operations
} = require("../queue/queueManager");

const router = express.Router();           //Creates a new express router instance to define routes for the queue functionality


// STEP 1: Customer selects a service -> system creates a Pending ticket with

router.post("/request", authenticate, authorize("customer"), (req, res) => {          
  const { serviceId } = req.body;
  const service = db.prepare("SELECT * FROM services WHERE service_id = ? AND active = 1").get(serviceId);
  if (!service) return res.status(404).json({ error: "Service not found or inactive." });

  const fifo = getQueue(serviceId);
  const positionIfJoined = fifo.size() + 1;
  const estimatedMinutes = estimateWaitMinutes(serviceId, fifo.size(), service.average_service_time);
  const queueNumber = generateQueueNumber(serviceId, service.service_name);
  const queueId = uuidv4();

  db.prepare(`
    INSERT INTO queue (queue_id, customer_id, queue_number, service_id, estimated_time, position_snapshot, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending')
  `).run(queueId, req.user.userId, queueNumber, serviceId, estimatedMinutes, positionIfJoined);

  res.status(201).json({
    ticket: {
      queueId,
      queueNumber,
      serviceName: service.service_name,
      estimatedMinutes,
      positionIfJoined,
      status: "Pending",
    },
  });
});

// STEP 2: Customer accepts the proposed ticket -> actually joins the live FIFO queue
router.post("/:id/accept", authenticate, authorize("customer"), (req, res) => {
  const ticket = getOwnedTicket(req.params.id, req.user.userId);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  if (ticket.status !== "Pending") {
    return res.status(400).json({ error: `Ticket is already ${ticket.status}.` });
  }

  db.prepare(`UPDATE queue SET status = 'Waiting', check_in_time = datetime('now') WHERE queue_id = ?`)
    .run(ticket.queue_id);

  const fifo = getQueue(ticket.service_id);
  fifo.enqueue({
    queueId: ticket.queue_id,
    customerId: ticket.customer_id,
    queueNumber: ticket.queue_number,
    joinedAt: new Date().toISOString(),
  });

  res.json({ message: "Joined the queue.", position: fifo.positionOf(ticket.queue_id) });
});

// STEP 2 (alt): Customer declines the proposed ticket
router.post("/:id/decline", authenticate, authorize("customer"), (req, res) => {
  const ticket = getOwnedTicket(req.params.id, req.user.userId);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  if (ticket.status !== "Pending") {
    return res.status(400).json({ error: `Ticket is already ${ticket.status}.` });
  }

  db.prepare(`UPDATE queue SET status = 'Declined' WHERE queue_id = ?`).run(ticket.queue_id);
  res.json({ message: "Ticket declined." });
});

// Customer cancels a ticket they already joined
router.post("/:id/cancel", authenticate, authorize("customer"), (req, res) => {
  const ticket = getOwnedTicket(req.params.id, req.user.userId);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  if (!["Pending", "Waiting"].includes(ticket.status)) {
    return res.status(400).json({ error: `Cannot cancel a ticket that is ${ticket.status}.` });
  }

  const fifo = getQueue(ticket.service_id);
  fifo.remove(ticket.queue_id);
  db.prepare(`UPDATE queue SET status = 'Cancelled' WHERE queue_id = ?`).run(ticket.queue_id);
  res.json({ message: "Ticket cancelled." });
});

// Customer dashboard: live status, position, estimated wait
router.get("/:id/status", authenticate, (req, res) => {
  const ticket = db.prepare(`
    SELECT q.*, s.service_name, s.average_service_time
    FROM queue q JOIN services s ON s.service_id = q.service_id
    WHERE q.queue_id = ?
  `).get(req.params.id);

  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  if (req.user.role === "customer" && ticket.customer_id !== req.user.userId) {
    return res.status(403).json({ error: "Not your ticket." });
  }

  const fifo = getQueue(ticket.service_id);
  const position = ticket.status === "Waiting" ? fifo.positionOf(ticket.queue_id) : null;
  const peopleAhead = position ? position - 1 : null;
  const estimatedMinutes = peopleAhead !== null
    ? estimateWaitMinutes(ticket.service_id, peopleAhead, ticket.average_service_time)
    : ticket.estimated_time;

  res.json({
    ticket: {
      queueId: ticket.queue_id,
      queueNumber: ticket.queue_number,
      serviceName: ticket.service_name,
      status: ticket.status,
      position,
      peopleAhead,
      estimatedMinutes,
    },
  });
});

// Customer: history of all my tickets
router.get("/my/history", authenticate, authorize("customer"), (req, res) => {
  const rows = db.prepare(`
    SELECT q.*, s.service_name FROM queue q
    JOIN services s ON s.service_id = q.service_id
    WHERE q.customer_id = ?
    ORDER BY q.booking_time DESC
  `).all(req.user.userId);
  res.json({ tickets: rows });
});

// ---------- STAFF OPERATIONS ----------

// Staff dashboard: full live queue for a given service (peek/displayQueue)
router.get("/service/:serviceId", authenticate, authorize("staff", "admin"), (req, res) => {
  const fifo = getQueue(req.params.serviceId);
  const ordered = fifo.displayQueue(); // uses FIFOQueue.displayQueue()

  // Enrich with customer names from the DB for the staff UI
  const enriched = ordered.map((item, idx) => {
    const customer = db.prepare("SELECT username, phone FROM users WHERE user_id = ?").get(item.customerId);
    return {
      position: idx + 1,
      queueId: item.queueId,
      queueNumber: item.queueNumber,
      customerName: customer ? customer.username : "Unknown",
      phone: customer ? customer.phone : null,
      joinedAt: item.joinedAt,
    };
  });

  const inService = db.prepare(`
    SELECT q.*, u.username FROM queue q JOIN users u ON u.user_id = q.customer_id
    WHERE q.service_id = ? AND q.status IN ('Called','InService')
    ORDER BY q.called_at ASC
  `).all(req.params.serviceId);

  res.json({ waiting: enriched, inProgress: inService, waitingCount: fifo.size() });
});

// Staff calls the next customer (dequeue -> Called)
router.post("/service/:serviceId/call-next", authenticate, authorize("staff", "admin"), (req, res) => {
  const fifo = getQueue(req.params.serviceId);
  const next = fifo.dequeue();
  if (!next) return res.status(404).json({ error: "The queue is empty." });

  db.prepare(`UPDATE queue SET status = 'Called', called_at = datetime('now') WHERE queue_id = ?`)
    .run(next.queueId);

  res.json({ message: "Customer called.", ticket: next });
});

// Staff starts serving the called customer
router.post("/:id/start", authenticate, authorize("staff", "admin"), (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  if (ticket.status !== "Called") return res.status(400).json({ error: "Ticket must be 'Called' first." });

  db.prepare(`UPDATE queue SET status = 'InService', started_at = datetime('now') WHERE queue_id = ?`)
    .run(ticket.queue_id);
  res.json({ message: "Service started." });
});

// Staff completes service
router.post("/:id/complete", authenticate, authorize("staff", "admin"), (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });

  db.prepare(`UPDATE queue SET status = 'Completed', completed_at = datetime('now') WHERE queue_id = ?`)
    .run(ticket.queue_id);
  res.json({ message: "Service completed." });
});

// Staff skips a waiting/called customer (e.g. they stepped away)
router.post("/:id/skip", authenticate, authorize("staff", "admin"), (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });

  const fifo = getQueue(ticket.service_id);
  fifo.remove(ticket.queue_id);
  db.prepare(`UPDATE queue SET status = 'Skipped' WHERE queue_id = ?`).run(ticket.queue_id);
  res.json({ message: "Customer skipped." });
});

// Staff recalls a skipped customer back to the FRONT of the queue
router.post("/:id/recall", authenticate, authorize("staff", "admin"), (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  if (ticket.status !== "Skipped") return res.status(400).json({ error: "Only skipped tickets can be recalled." });

  const fifo = getQueue(ticket.service_id);
  fifo.requeueFront({
    queueId: ticket.queue_id,
    customerId: ticket.customer_id,
    queueNumber: ticket.queue_number,
    joinedAt: new Date().toISOString(),
  });
  db.prepare(`UPDATE queue SET status = 'Waiting' WHERE queue_id = ?`).run(ticket.queue_id);
  res.json({ message: "Customer recalled to front of queue." });
});

// Mark a called-but-never-arrived customer as Absent
router.post("/:id/absent", authenticate, authorize("staff", "admin"), (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });

  db.prepare(`UPDATE queue SET status = 'Absent' WHERE queue_id = ?`).run(ticket.queue_id);
  res.json({ message: "Customer marked absent." });
});

// ---------- helpers ----------

function getTicketById(queueId) {
  return db.prepare("SELECT * FROM queue WHERE queue_id = ?").get(queueId);
}

function getOwnedTicket(queueId, customerId) {
  const ticket = getTicketById(queueId);
  if (!ticket || ticket.customer_id !== customerId) return null;
  return ticket;
}

module.exports = router;
