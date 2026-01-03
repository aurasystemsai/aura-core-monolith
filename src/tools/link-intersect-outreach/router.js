const express = require("express");
const router = express.Router();
const { analyzeLinkIntersect } = require("./linkIntersectOutreachService");

// POST /api/link-intersect-outreach/analyze
router.post("/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await analyzeLinkIntersect(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Link Intersect Outreach API running" });
});

module.exports = router;
