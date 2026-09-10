const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { authenticate, authorize } = require('../middleware/auth.js');

// GET all users - admin only
router.get('/users', authenticate, authorize('admin'), (req,res)=>{
  const users = db.prepare('SELECT user_id, username, role, created_at FROM users').all();
  res.json({users});
});

// GET all appointments - admin/staff
router.get('/appointments', authenticate, authorize('admin','staff'), (req,res)=>{
  const rows = db.prepare('SELECT * FROM appointments ORDER BY appointment_time DESC').all();
  res.json({appointments: rows});
});

// GET queue status
router.get('/queue', authenticate, authorize('admin','staff'), (req,res)=>{
  const rows = db.prepare('SELECT * FROM queue WHERE status = ? ORDER BY check_in_time ASC').all('Waiting');
  res.json({queue: rows});
});

module.exports = router;