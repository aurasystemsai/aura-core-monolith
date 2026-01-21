const express = require('express');
const db = require('./db');
const router = express.Router();

// CRUD endpoints for tests
router.get('/tests', (req, res) => {
  res.json({ ok: true, tests: db.list() });
});
router.get('/tests/:id', (req, res) => {
  const test = db.get(req.params.id);
  if (!test) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, test });
});
router.post('/tests', (req, res) => {
  const test = db.create(req.body || {});
  res.json({ ok: true, test });
});
router.put('/tests/:id', (req, res) => {
  const test = db.update(req.params.id, req.body || {});
  if (!test) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, test });
});
router.delete('/tests/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// Audit log endpoints
router.post('/audit', (req, res) => {
  db.auditLog.add(JSON.stringify(req.body));
  res.json({ ok: true });
});
router.get('/audit', (req, res) => {
  res.json({ ok: true, auditLog: db.auditLog.list() });
});

// API Key Management
router.post('/apikeys/generate', (req, res) => {
  const key = 'api_' + Math.random().toString(36).slice(2, 18);
  db.apiKeys.add(key);
  res.json({ ok: true, key });
});
router.post('/apikeys/revoke', (req, res) => {
  db.apiKeys.remove(req.body.key);
  res.json({ ok: true });
});
router.get('/apikeys', (req, res) => {
  res.json({ ok: true, apiKeys: db.apiKeys.list() });
});
// --- Slack/Teams Notification Webhook Endpoint ---
const fetch = require('node-fetch');
// POST /api/ab-testing-suite/notify-webhook
router.post('/notify-webhook', async (req, res) => {
  // Expects { url, message }
  try {
    const { url, message } = req.body;
    if (!url || !message) return res.status(400).json({ ok: false, error: 'Missing url or message' });
    // Send notification to Slack/Teams webhook
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    if (!resp.ok) throw new Error('Failed to send notification');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// --- API Endpoints for External Automation ---
// POST /api/ab-testing-suite/trigger-test
router.post('/trigger-test', async (req, res) => {
  // Expects { testName, variants }
  try {
    const { testName, variants } = req.body;
    if (!testName || !Array.isArray(variants)) return res.status(400).json({ ok: false, error: 'Missing testName or variants' });
    // TODO: Implement actual test trigger logic
    res.json({ ok: true, message: `Triggered test '${testName}' with ${variants.length} variants.` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/ab-testing-suite/test-status?testName=...
router.get('/test-status', async (req, res) => {
  try {
    const { testName } = req.query;
    if (!testName) return res.status(400).json({ ok: false, error: 'Missing testName' });
    // TODO: Implement actual status lookup
    res.json({ ok: true, status: 'running', testName });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// --- Accessibility Audit Endpoint (stub) ---
router.post('/accessibility/audit', async (req, res) => {
  // Expects { html } in body
  try {
    const { html } = req.body;
    if (!html) return res.status(400).json({ ok: false, error: 'Missing HTML' });
    // TODO: Integrate axe-core or pa11y for real audits
    // For now, return a mock result
    res.json({ ok: true, issues: [
      { id: 'color-contrast', impact: 'serious', description: 'Text elements should have sufficient color contrast.' },
      { id: 'label', impact: 'moderate', description: 'Form elements must have associated labels.' }
    ] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// --- Custom User Roles & Permissions (RBAC) ---
const userRoles = {
  'admin@example.com': 'admin',
  'editor@example.com': 'editor',
  'viewer@example.com': 'viewer',
};
const rolePermissions = {
  admin: ['view', 'edit', 'delete', 'export', 'manage-users'],
  editor: ['view', 'edit', 'export'],
  viewer: ['view'],
};
// GET /api/ab-testing-suite/rbac/role?user=email
router.get('/rbac/role', (req, res) => {
  const { user } = req.query;
  const role = userRoles[user] || 'viewer';
  res.json({ ok: true, role });
});
// GET /api/ab-testing-suite/rbac/permissions?user=email
router.get('/rbac/permissions', (req, res) => {
  const { user } = req.query;
  const role = userRoles[user] || 'viewer';
  const permissions = rolePermissions[role] || [];
  res.json({ ok: true, permissions });
});
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
