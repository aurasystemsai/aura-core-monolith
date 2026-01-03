const express = require("express");
const router = express.Router();
const { handleReportingIntegrationQuery } = require("./reportingIntegrationsService");

// POST /api/reporting-integrations/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleReportingIntegrationQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Reporting Integrations API running" });
});

module.exports = router;
