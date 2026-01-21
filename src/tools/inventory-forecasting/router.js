const express = require("express");
const router = express.Router();
const { handleInventoryForecastingQuery } = require("./inventoryForecastingService");
const db = require('./db');


// POST /api/inventory-forecasting/query (live, persistent)
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleInventoryForecastingQuery(query);
    const record = db.create({ query, result });
    res.json({ ok: true, result, record });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// CRUD endpoints (persistent)
router.get('/queries', (req, res) => {
  res.json({ ok: true, queries: db.list() });
});
router.get('/queries/:id', (req, res) => {
  const q = db.get(req.params.id);
  if (!q) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, query: q });
});
router.put('/queries/:id', (req, res) => {
  const q = db.update(req.params.id, req.body || {});
  if (!q) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, query: q });
});
router.delete('/queries/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: { totalQueries: db.list().length } });
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


// Health check (live)
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Inventory Forecasting API running", totalQueries: db.list().length });
});

module.exports = router;
