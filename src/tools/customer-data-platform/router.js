const express = require("express");
const router = express.Router();
const { queryCustomerData } = require("./customerDataPlatformService");

// POST /api/customer-data-platform/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await queryCustomerData(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Customer Data Platform API running" });
});

module.exports = router;
