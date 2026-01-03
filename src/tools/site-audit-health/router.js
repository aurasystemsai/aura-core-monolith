const express = require("express");
const router = express.Router();
const { auditSite } = require("./siteAuditHealthService");

// POST /api/site-audit-health/audit
router.post("/audit", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.json({ ok: false, error: "Missing or invalid URL" });
    }
    const result = await auditSite(url);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Site Audit Health API running" });
});

module.exports = router;
