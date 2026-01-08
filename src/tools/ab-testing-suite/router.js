const express = require("express");
const router = express.Router();
const { handleABTestQuery } = require("./abTestingSuiteService");
const { exportReportCSV, exportReportPDF } = require("./abTestingSuiteReports");
const path = require('path');
const fs = require('fs');
// POST /api/ab-testing-suite/export/csv
router.post("/export/csv", async (req, res) => {
  try {
    const { data, fields } = req.body;
    if (!Array.isArray(data) || !Array.isArray(fields)) return res.status(400).json({ ok: false, error: "Missing data or fields" });
    const csv = exportReportCSV(data, fields);
    res.header('Content-Type', 'text/csv');
    res.attachment('ab-test-report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/ab-testing-suite/export/pdf
router.post("/export/pdf", async (req, res) => {
  try {
    const { data, fields } = req.body;
    if (!Array.isArray(data) || !Array.isArray(fields)) return res.status(400).json({ ok: false, error: "Missing data or fields" });
    const filePath = path.join(__dirname, 'ab-test-report.pdf');
    exportReportPDF(data, fields, filePath);
    // Wait for file to be written
    setTimeout(() => {
      res.download(filePath, 'ab-test-report.pdf', err => {
        if (err) res.status(500).json({ ok: false, error: err.message });
        fs.unlink(filePath, () => {});
      });
    }, 500);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/ab-testing-suite/schedule-digest (stub)
router.post("/schedule-digest", async (req, res) => {
  // TODO: Implement scheduled email digests
  res.json({ ok: true, message: "Scheduled digest (stub)" });
});

// POST /api/ab-testing-suite/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleABTestQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "A/B Testing Suite API running" });
});

module.exports = router;
