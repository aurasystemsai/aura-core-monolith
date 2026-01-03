const express = require("express");
const router = express.Router();
const { reportAndAlert } = require("./reportingAlertsService");

// POST /api/reporting-alerts/report
router.post("/report", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await reportAndAlert(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Reporting Alerts API running" });
});

module.exports = router;
