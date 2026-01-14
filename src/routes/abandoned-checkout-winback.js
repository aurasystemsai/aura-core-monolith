// --- Compliance API (GDPR/CCPA: export, delete, opt-out, audit) ---
const COMPLIANCE_KEY = 'winback-compliance';
const ACTIVITY_LOG_KEY = 'winback-activity-log';

// GET: Compliance status (opt-out)
router.get('/compliance-status', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(COMPLIANCE_KEY)) || {};
  res.json({ ok: true, optedOut: !!all[shop]?.optedOut });
});

// POST: Opt-out (disable all processing)
router.post('/opt-out', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  let all = (await storage.get(COMPLIANCE_KEY)) || {};
  all[shop] = { ...(all[shop] || {}), optedOut: true, optedOutAt: new Date().toISOString() };
  await storage.set(COMPLIANCE_KEY, all);
  res.json({ ok: true, optedOut: true });
});

// GET: Export all shop data (integrations, notifications, compliance, audit log)
router.get('/export-data', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const integrations = ((await storage.get(INTEGRATIONS_KEY)) || {})[shop] || [];
  const notifications = ((await storage.get(NOTIFICATIONS_KEY)) || {})[shop] || [];
  const compliance = ((await storage.get(COMPLIANCE_KEY)) || {})[shop] || {};
  const audit = ((await storage.get(ACTIVITY_LOG_KEY)) || {})[shop] || [];
  res.json({ integrations, notifications, compliance, audit });
});

// POST: Delete all shop data (irreversible)
router.post('/delete-data', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  let keys = [INTEGRATIONS_KEY, NOTIFICATIONS_KEY, COMPLIANCE_KEY, ACTIVITY_LOG_KEY];
  for (const key of keys) {
    let all = (await storage.get(key)) || {};
    delete all[shop];
    await storage.set(key, all);
  }
  res.json({ ok: true, deleted: true });
});

// GET: Audit log (for compliance)
router.get('/audit', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(ACTIVITY_LOG_KEY)) || {};
  res.json({ ok: true, logs: all[shop] || [] });
});
// src/routes/abandoned-checkout-winback.js
// Real API endpoints for winback integrations (Shopify multi-tenant)
const express = require('express');
const router = express.Router();
const storage = require('../core/storageJson');

const INTEGRATIONS_KEY = 'winback-integrations';

// Helper: get shop from request (header, query, or session)
function getShop(req) {
  return req.headers['x-shopify-shop-domain'] || req.query.shop || req.session?.shop || null;
}

// GET: List integrations for shop
router.get('/integrations', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(INTEGRATIONS_KEY)) || {};
  const integrations = all[shop] || [];
  res.json({ ok: true, integrations });
});

// POST: Connect integration for shop
router.post('/integrations/:id/connect', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const id = req.params.id;
  let all = (await storage.get(INTEGRATIONS_KEY)) || {};
  let integrations = all[shop] || [];
  let found = integrations.find(i => i.id == id);
  if (!found) {
    found = { id, name: id, connected: true, lastConnected: new Date().toISOString() };
    integrations.push(found);
  } else {
    found.connected = true;
    found.lastConnected = new Date().toISOString();
  }
  all[shop] = integrations;
  await storage.set(INTEGRATIONS_KEY, all);
  res.json({ ok: true, integration: found });
});

// POST: Disconnect integration for shop
router.post('/integrations/:id/disconnect', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const id = req.params.id;
  let all = (await storage.get(INTEGRATIONS_KEY)) || {};
  let integrations = all[shop] || [];
  let found = integrations.find(i => i.id == id);
  if (!found) {
    return res.status(404).json({ ok: false, error: 'Integration not found' });
  }
  found.connected = false;
  all[shop] = integrations;
  await storage.set(INTEGRATIONS_KEY, all);
  res.json({ ok: true, integration: found });
});

module.exports = router;

// --- Notifications API (per-shop, persistent, production-ready) ---
const NOTIFICATIONS_KEY = 'winback-notifications';

// GET: List notifications for shop
router.get('/notifications', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(NOTIFICATIONS_KEY)) || {};
  const notifications = all[shop] || [];
  res.json({ ok: true, notifications });
});

// POST: Create notification for shop
router.post('/notifications', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const { name, channel, message, status } = req.body;
  if (!name || !channel || !message) return res.status(400).json({ ok: false, error: 'Missing required fields' });
  let all = (await storage.get(NOTIFICATIONS_KEY)) || {};
  let notifications = all[shop] || [];
  const id = Date.now();
  const created = new Date().toISOString().slice(0, 10);
  const notification = { id, name, channel, message, status: status || 'enabled', created };
  notifications.push(notification);
  all[shop] = notifications;
  await storage.set(NOTIFICATIONS_KEY, all);
  res.json({ ok: true, notification });
});

// PUT: Update notification for shop
router.put('/notifications/:id', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const id = parseInt(req.params.id);
  let all = (await storage.get(NOTIFICATIONS_KEY)) || {};
  let notifications = all[shop] || [];
  let idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Notification not found' });
  const { name, channel, message, status } = req.body;
  notifications[idx] = { ...notifications[idx], name, channel, message, status };
  all[shop] = notifications;
  await storage.set(NOTIFICATIONS_KEY, all);
  res.json({ ok: true, notification: notifications[idx] });
});

// DELETE: Delete notification for shop
router.delete('/notifications/:id', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const id = parseInt(req.params.id);
  let all = (await storage.get(NOTIFICATIONS_KEY)) || {};
  let notifications = all[shop] || [];
  const before = notifications.length;
  notifications = notifications.filter(n => n.id !== id);
  all[shop] = notifications;
  await storage.set(NOTIFICATIONS_KEY, all);
  res.json({ ok: true, deleted: before - notifications.length });
});

// DELETE: Bulk delete notifications for shop
router.post('/notifications/bulk-delete', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, error: 'Missing ids array' });
  let all = (await storage.get(NOTIFICATIONS_KEY)) || {};
  let notifications = all[shop] || [];
  const before = notifications.length;
  notifications = notifications.filter(n => !ids.includes(n.id));
  all[shop] = notifications;
  await storage.set(NOTIFICATIONS_KEY, all);
  res.json({ ok: true, deleted: before - notifications.length });
});
