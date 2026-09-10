const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

router.get('/', (req,res)=>{
  const services = db.prepare("SELECT * FROM services WHERE active=1 ORDER BY service_name").all();
  res.json({services});
});

module.exports = router;