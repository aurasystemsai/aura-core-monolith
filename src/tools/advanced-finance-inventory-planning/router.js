const express = require("express");
const router = express.Router();
const { analyzeFinanceInventory } = require("./financeInventoryService");

// POST /api/advanced-finance-inventory-planning/analyze
router.post("/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await analyzeFinanceInventory(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Advanced Finance Inventory Planning API running" });
});

module.exports = router;
