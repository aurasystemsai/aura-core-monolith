const express = require("express");
const router = express.Router();
const { analyzeKeywords } = require("./keywordResearchService");

// POST /api/keyword-research-suite/analyze
router.post("/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await analyzeKeywords(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Keyword Research Suite API running" });
});

module.exports = router;
