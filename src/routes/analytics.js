const express = require('express');
const router = express.Router();

// Dummy analytics endpoints (replace with real data sources)
router.get('/revenue', (req, res) => {
  res.json({ value: 12450 });
});
router.get('/orders', (req, res) => {
  res.json({ value: 312 });
});
router.get('/customers', (req, res) => {
  res.json({ value: 98 });
});
router.get('/conversion', (req, res) => {
  res.json({ value: '2.7%' });
});
router.get('/traffic', (req, res) => {
  res.json({ value: 5400 });
});

module.exports = router;
