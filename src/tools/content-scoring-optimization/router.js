const express = require("express");
const router = express.Router();
const { scoreContent } = require("./contentScoringOptimizationService");

// POST /api/content-scoring-optimization/score
router.post("/score", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.json({ ok: false, error: "Missing or invalid content" });
    }
    const result = await scoreContent(content);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Content Scoring Optimization API running" });
});

module.exports = router;
