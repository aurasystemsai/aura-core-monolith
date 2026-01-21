const express = require("express");
const router = express.Router();
const db = require('./db');

// CRUD endpoints (persistent)
router.get('/suggestions', (req, res) => {
  res.json({ ok: true, suggestions: db.list() });
});
router.get('/suggestions/:id', (req, res) => {
  const suggestion = db.get(req.params.id);
  if (!suggestion) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, suggestion });
});
router.post('/suggestions', (req, res) => {
  const suggestion = db.create(req.body || {});
  res.json({ ok: true, suggestion });
});
router.put('/suggestions/:id', (req, res) => {
  const suggestion = db.update(req.params.id, req.body || {});
  if (!suggestion) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, suggestion });
});
router.delete('/suggestions/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: { totalSuggestions: db.list().length } });
});

// Import/export endpoints (live)
router.post('/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  db.import(items);
  res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});
const express = require("express");
const router = express.Router();
const { handleInternalLinkingQuery } = require("./internalLinkingSuggestionsService");

// POST /api/internal-linking-suggestions/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleInternalLinkingQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Internal Linking Suggestions API running" });
});

module.exports = router;
