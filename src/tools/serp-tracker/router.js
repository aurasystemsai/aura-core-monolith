const express = require("express");
const router = express.Router();
const { trackSERP } = require("./serpTrackerService");

// POST /api/serp-tracker/track
router.post("/track", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await trackSERP(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "SERP Tracker API running" });
});

module.exports = router;
