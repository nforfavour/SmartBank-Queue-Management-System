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