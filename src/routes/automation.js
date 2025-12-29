// src/routes/automation.js
// API endpoints for automation scheduling
const express = require('express');
const router = express.Router();
const storage = require('../core/storageJson');

const SCHEDULES_KEY = 'automation-schedules';

// Get all schedules
router.get('/', async (req, res) => {
  const schedules = (await storage.get(SCHEDULES_KEY)) || [];
  res.json({ ok: true, schedules });
});

// Add a new schedule
router.post('/', async (req, res) => {
  const { name, type, date, time, recurrence } = req.body;
  if (!name || !type || !time || (type === 'one-time' && !date)) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  const schedules = (await storage.get(SCHEDULES_KEY)) || [];
  const newSchedule = {
    id: Date.now(),
    name,
    type,
    date: type === 'one-time' ? date : null,
    time,
    recurrence: type === 'recurring' ? recurrence : null,
    createdAt: new Date().toISOString(),
  };
  schedules.push(newSchedule);
  await storage.set(SCHEDULES_KEY, schedules);
  res.json({ ok: true, schedule: newSchedule });
});

// Delete a schedule
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  let schedules = (await storage.get(SCHEDULES_KEY)) || [];
  schedules = schedules.filter(s => s.id !== id);
  await storage.set(SCHEDULES_KEY, schedules);
  res.json({ ok: true });
});

module.exports = router;
