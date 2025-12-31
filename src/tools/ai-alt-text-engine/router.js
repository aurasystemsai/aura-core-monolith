// Express router for AI Alt-Text Engine
const express = require('express');
const router = express.Router();
const engine = require('./index');

// POST /api/ai-alt-text-engine/run
router.post('/run', async (req, res) => {
  try {
    const input = req.body || {};
    const ctx = { environment: process.env.NODE_ENV };
    const result = await engine.run(input, ctx);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
