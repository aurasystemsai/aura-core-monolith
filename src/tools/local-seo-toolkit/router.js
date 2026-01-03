const express = require("express");
const router = express.Router();
const { handleLocalSEOQuery } = require("./localSEOToolkitService");

// POST /api/local-seo-toolkit/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleLocalSEOQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Local SEO Toolkit API running" });
});

module.exports = router;
