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
