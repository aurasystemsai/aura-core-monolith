const express = require("express");
const router = express.Router();
const { handleEntityTopicQuery } = require("./entityTopicExplorerService");

// POST /api/entity-topic-explorer/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleEntityTopicQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Entity/Topic Explorer API running" });
});

module.exports = router;
