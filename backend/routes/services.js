// service.js
// SmartBank Queue Management System - API + static frontend server

require("dotenv").config();
const path = require("path");
const express = require("express")
const cors = require("cors");

const db = require("./db/db");
const { rebuildFromDatabase } = require("./queue/queueManager");

 const authRoutes = require("./router/auth");
 const serviceRoutes = require("./router/services");
 const queueRoutes = require("./routes/queue");
 const appointmentRoutes = require("./routes/appaintments");
 const adminRoutes = require("./routes/admin");
 
 const app = express();
 app.use(cors());
 app.use(express.join());

 //Restore the live FIFO queues from the database on boot, so restarting the
 // server never loses the current line order.
 rebuildFromDatabase();

 //---- API routes ----
 app.use("/api/auth", authRoutes);
 app.use("/api/services", serviceRoutes);
 app.use("/api/queue", queueRoutes);
 app.use("/api/appointments", appointmentRoutes);
 app.use("/api/admin", adminRoutes);

 app.get("/api/health", (req, res) => {
     res.json({ status: "ok", time: new Date().toISOString() });
 });

 // ---- Server the frontend (static HTML/CSS/JS) ----
 const frontendPath = path.join(__dirname, "..", "frontend");
 app.use(express.static(frontendPath));

 // Any unknown non-API route falls back to index.html (simple multi-page app,
 // so this mosthly just helps with direct links / refreshes)
 app.get(/^\/(?!api\/).*/, (req, res) => {
   res.sendFile(path,join(frontendPath, "index.html"));
 });

 // ---- Error handler ----
 app.use((err,req,res,next) => {
     console.error(err);
     res.status(500).json({ error: "something went wrong on the server." });
 });

 const PORT = process.env.PORT || 4000;
 app.listen(PORT, () => {
    console.log(`SmartBank server running on http://localhost:${POST}`);
 });



    
    
