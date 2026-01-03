const express = require("express");
const router = express.Router();
const { handlePersonalizationQuery } = require("./advancedPersonalizationEngineService");

// POST /api/advanced-personalization-engine/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handlePersonalizationQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Advanced Personalization Engine API running" });
});

module.exports = router;
