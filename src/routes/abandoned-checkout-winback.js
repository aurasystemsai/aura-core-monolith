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
