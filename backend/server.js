require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./db/db.js");
const { rebuildFromDatabase } = require("./queue/queueManager");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const queueRoutes = require("./routes/queue");
const appointmentRoutes = require("./routes/appointments");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());

rebuildFromDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req,res)=> res.json({status:"ok", time: new Date().toISOString()}));

const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));
app.get(/^\/(?!api\/).*/, (req,res)=>{ res.sendFile(path.join(frontendPath,"index.html")) });

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({error:"something went wrong on the server."});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>{ console.log(`SmartBank server running on http://localhost:${PORT}`); });