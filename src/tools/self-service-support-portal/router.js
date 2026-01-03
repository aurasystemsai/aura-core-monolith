const express = require("express");
const router = express.Router();
const { querySupport } = require("./selfServiceSupportService");

// POST /api/self-service-support-portal/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await querySupport(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Self-Service Support Portal API running" });
});

module.exports = router;
