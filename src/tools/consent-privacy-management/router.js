const express = require("express");
const router = express.Router();
const { handleConsentQuery } = require("./consentPrivacyManagementService");

// POST /api/consent-privacy-management/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleConsentQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Consent & Privacy Management API running" });
});

module.exports = router;
