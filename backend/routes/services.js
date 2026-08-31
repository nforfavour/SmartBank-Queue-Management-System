// SmartBank Queue Management System -API + static frontend server


require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./db/db");
const{rebuildFromDatabase} = require("./queue/queueManager");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const queueRoutes = require("./routes/queue");
const appointmentRoutes = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());
// restore the live FIFO queue from the database on boot, so restarting  the
// server never loses the current line order
rebuildFromDatabase();

//----API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/queue", queueRoutes);