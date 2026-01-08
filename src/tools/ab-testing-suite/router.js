// Shopify order fetch and revenue attribution
router.post("/shopify/orders", async (req, res) => {
  // Expects { shop, token, startDate, endDate, variantIds }
  try {
    const { shop, token, startDate, endDate, variantIds } = req.body;
    if (!shop || !token) return res.status(400).json({ ok: false, error: "Missing shop or token" });
    // TODO: Implement Shopify API call to fetch orders and attribute revenue to variants
    // For now, return mock data
    res.json({ ok: true, orders: [], revenueByVariant: variantIds ? variantIds.map(id => ({ id, revenue: Math.random() * 1000 })) : [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Analytics event tracking for conversions and revenue per variant
let analyticsEvents = [];
router.post("/analytics/event", (req, res) => {
  try {
    const { variantId, eventType, value, ts } = req.body;
    if (!variantId || !eventType) return res.status(400).json({ ok: false, error: "Missing variantId or eventType" });
    analyticsEvents.push({ variantId, eventType, value, ts: ts || Date.now() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get("/analytics/summary", (req, res) => {
  try {
    // Summarize conversions and revenue by variant
    const summary = {};
    analyticsEvents.forEach(ev => {
      if (!summary[ev.variantId]) summary[ev.variantId] = { conversions: 0, revenue: 0 };
      if (ev.eventType === 'conversion') summary[ev.variantId].conversions += 1;
      if (ev.eventType === 'revenue') summary[ev.variantId].revenue += Number(ev.value) || 0;
    });
    res.json({ ok: true, summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
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
