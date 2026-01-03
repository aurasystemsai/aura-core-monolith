const express = require("express");
const router = express.Router();
const { handleWebhookApiQuery } = require("./webhookApiTriggersService");

// POST /api/webhook-api-triggers/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleWebhookApiQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Webhook & API Triggers API running" });
});

module.exports = router;
