'use strict';
const express = require('express');
const router = express.Router();
const complianceModel = require('./complianceModel');
const apiKeys = require('./apiKeys');
const { sendSlackNotification } = require('./slackNotify');
const rbac = require('./rbac');
const auditModel = require('./auditModel');
const bandit = require('./bandit');
const { handlePersonalizationQuery } = require('./advancedPersonalizationEngineService');
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(verifyShopifySession);

router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'advanced-personalization-engine', v: '2.0.0' })));

router.post('/query', ah(async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') return res.status(400).json({ ok: false, error: 'query required' });
  const result = await handlePersonalizationQuery(query);
  res.json({ ok: true, result });
}));

router.post('/compliance/export', ah(async (req, res) => {
  const { userId } = req.body || {};
  const reqObj = complianceModel.requestDataExport(userId);
  res.json({ ok: true, request: reqObj });
}));
router.post('/compliance/delete', ah(async (req, res) => {
  const { userId } = req.body || {};
  const reqObj = complianceModel.requestDataDelete(userId);
  res.json({ ok: true, request: reqObj });
}));
router.get('/compliance/requests', ah(async (req, res) => {
  const reqs = complianceModel.listRequests(req.query || {});
  res.json({ ok: true, requests: reqs });
}));
router.post('/compliance/update', ah(async (req, res) => {
  const { id, status } = req.body || {};
  const updated = complianceModel.updateRequestStatus(id, status);
  res.json({ ok: true, updated });
}));

router.post('/apikeys/create', ah(async (req, res) => {
  const { userId } = req.body || {};
  const key = apiKeys.createKey(userId);
  res.json({ ok: true, key });
}));
router.post('/apikeys/revoke', ah(async (req, res) => {
  const { key } = req.body || {};
  apiKeys.revokeKey(key);
  res.json({ ok: true });
}));
router.get('/apikeys', ah(async (req, res) => {
  const { userId } = req.query || {};
  const keys = apiKeys.listKeys(userId);
  res.json({ ok: true, keys });
}));

router.post('/notify/slack', ah(async (req, res) => {
  const { webhookUrl, message } = req.body || {};
  if (!webhookUrl || !message) return res.status(400).json({ ok: false, error: 'webhookUrl and message required' });
  await sendSlackNotification(webhookUrl, message);
  res.json({ ok: true });
}));

router.post('/rbac/check', ah(async (req, res) => {
  const { role, action } = req.body || {};
  const allowed = rbac.can(role, action);
  res.json({ ok: true, allowed });
}));

router.post('/audit', ah(async (req, res) => {
  const entry = auditModel.recordAudit(req.body || {});
  res.json({ ok: true, entry });
}));
router.get('/audit', ah(async (req, res) => {
  const entries = auditModel.listAudits(req.query || {});
  res.json({ ok: true, entries });
}));

router.post('/bandit/select', ah(async (req, res) => {
  const { variantIds } = req.body || {};
  if (!Array.isArray(variantIds) || !variantIds.length) return res.status(400).json({ ok: false, error: 'variantIds[] required' });
  const selected = bandit.selectVariant(variantIds);
  res.json({ ok: true, selected });
}));
router.post('/bandit/reward', ah(async (req, res) => {
  const { variantId, reward } = req.body || {};
  if (!variantId || typeof reward !== 'number') return res.status(400).json({ ok: false, error: 'variantId and reward required' });
  bandit.recordResult(variantId, reward);
  res.json({ ok: true });
}));

router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
