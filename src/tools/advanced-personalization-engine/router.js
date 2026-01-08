const complianceModel = require('./complianceModel');
// Residency/compliance endpoints
router.post('/compliance/export', (req, res) => {
  const { userId } = req.body || {};
  const reqObj = complianceModel.requestDataExport(userId);
  res.json({ ok: true, request: reqObj });
});
router.post('/compliance/delete', (req, res) => {
  const { userId } = req.body || {};
  const reqObj = complianceModel.requestDataDelete(userId);
  res.json({ ok: true, request: reqObj });
});
router.get('/compliance/requests', (req, res) => {
  const reqs = complianceModel.listRequests(req.query || {});
  res.json({ ok: true, requests: reqs });
});
router.post('/compliance/update', (req, res) => {
  const { id, status } = req.body || {};
  const updated = complianceModel.updateRequestStatus(id, status);
  res.json({ ok: true, updated });
});
const apiKeys = require('./apiKeys');
// API key management endpoints
router.post('/apikeys/create', (req, res) => {
  const { userId } = req.body || {};
  const key = apiKeys.createKey(userId);
  res.json({ ok: true, key });
});
router.post('/apikeys/revoke', (req, res) => {
  const { key } = req.body || {};
  apiKeys.revokeKey(key);
  res.json({ ok: true });
});
router.get('/apikeys', (req, res) => {
  const { userId } = req.query || {};
  const keys = apiKeys.listKeys(userId);
  res.json({ ok: true, keys });
});
const { sendSlackNotification } = require('./slackNotify');
// Slack notification endpoint
router.post('/notify/slack', async (req, res) => {
  try {
    const { webhookUrl, message } = req.body || {};
    await sendSlackNotification(webhookUrl, message);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
const rbac = require('./rbac');
const auditModel = require('./auditModel');
// RBAC check endpoint
router.post('/rbac/check', (req, res) => {
  const { role, action } = req.body || {};
  const allowed = rbac.can(role, action);
  res.json({ ok: true, allowed });
});

// Audit log endpoints
router.post('/audit', (req, res) => {
  const entry = auditModel.recordAudit(req.body || {});
  res.json({ ok: true, entry });
});
router.get('/audit', (req, res) => {
  const entries = auditModel.listAudits(req.query || {});
  res.json({ ok: true, entries });
});
const bandit = require('./bandit');
// Bandit optimization endpoints
router.post('/bandit/select', (req, res) => {
  const { variantIds } = req.body || {};
  if (!Array.isArray(variantIds) || !variantIds.length) return res.status(400).json({ ok: false, error: 'variantIds[] required' });
  const selected = bandit.selectVariant(variantIds);
  res.json({ ok: true, selected });
});
router.post('/bandit/reward', (req, res) => {
  const { variantId, reward } = req.body || {};
  if (!variantId || typeof reward !== 'number') return res.status(400).json({ ok: false, error: 'variantId and reward required' });
  bandit.recordResult(variantId, reward);
  res.json({ ok: true });
});
const express = require("express");
const router = express.Router();
const { handlePersonalizationQuery } = require("./advancedPersonalizationEngineService");

// POST /api/advanced-personalization-engine/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handlePersonalizationQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Advanced Personalization Engine API running" });
});

module.exports = router;
