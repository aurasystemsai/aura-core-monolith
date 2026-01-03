const express = require("express");
const router = express.Router();
const { analyzeSocialMedia } = require("./socialMediaAnalyticsService");

// POST /api/social-media-analytics-listening/analyze
router.post("/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await analyzeSocialMedia(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Social Media Analytics Listening API running" });
});

module.exports = router;
