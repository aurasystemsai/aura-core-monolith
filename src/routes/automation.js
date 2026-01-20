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

// Input validation helper
function validateScheduleInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') errors.push('Input must be an object');
  const { name, type, date, time, recurrence } = input || {};
  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Name is required');
  if (!type || !['one-time', 'recurring'].includes(type)) errors.push('Type must be one-time or recurring');
  if (!time || typeof time !== 'string' || !time.trim()) errors.push('Time is required');
  if (type === 'one-time' && (!date || typeof date !== 'string' || !date.trim())) errors.push('Date is required for one-time schedules');
  if (type === 'recurring' && (!recurrence || typeof recurrence !== 'string' || !recurrence.trim())) errors.push('Recurrence is required for recurring schedules');
  return errors;
}

// Add a new schedule
router.post('/', async (req, res) => {
  const errors = validateScheduleInput(req.body);
  if (errors.length) {
    return res.status(400).json({ ok: false, error: errors.join('; ') });
  }
  const { name, type, date, time, recurrence } = req.body;
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
  const initialLength = schedules.length;
  schedules = schedules.filter(s => s.id !== id);
  if (schedules.length === initialLength) {
    return res.status(404).json({ ok: false, error: 'Schedule not found' });
  }
  await storage.set(SCHEDULES_KEY, schedules);
  res.json({ ok: true });
});

// Run all automations (stub implementation)
router.post('/run', async (req, res) => {
  // Here you would trigger all automations for the shop/project
  // For now, just simulate success
  try {
    // TODO: Add real automation logic here
    await new Promise(resolve => setTimeout(resolve, 1200));
    res.json({ ok: true, message: 'All automations triggered successfully.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to run automations.' });
  }
});

module.exports = router;
