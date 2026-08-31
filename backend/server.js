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
app.use("/api/appointment", appointmentRoutes);
app.use("/api/admin" , adminRoutes);

app.get("/api/health", (req,res) => {
    res.json({status: "ok", time: new Date().toISOString() });
});

//----server the frontend (static HTML/CSS/JS)----
const frontendpath = path.join(--dirname, ". .", "frontend");
app.use(express.static(frontendpath));
// any unknown non-API routes back to index.html (simple multi-page app,
// so this mostly just helps with direct links / refreshes)
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendpath, "index.html"));
});

const PORT =  process.env.PORT || 4000;
app.listen(PORT, () => { 
    console.log(`SmartBank server running on http://localhost:${PORT}`);
});