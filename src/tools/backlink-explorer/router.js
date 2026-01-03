const express = require("express");
const router = express.Router();
const { analyzeBacklinks } = require("./backlinkExplorerService");

// POST /api/backlink-explorer/analyze
router.post("/analyze", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.json({ ok: false, error: "Missing or invalid domain" });
    }
    const result = await analyzeBacklinks(domain);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Backlink Explorer API running" });
});

module.exports = router;
