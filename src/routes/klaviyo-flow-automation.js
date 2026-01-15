// src/routes/klaviyo-flow-automation.js
// Flagship backend for Klaviyo Flow Automation (save/load flows, analytics, collaborators)
const express = require('express');
const router = express.Router();
const storage = require('../core/storageJson');

const VERSIONS_KEY = 'klaviyo-flow-versions';
const FLOWS_KEY = 'klaviyo-flows';
const COLLAB_KEY = 'klaviyo-collaborators';
const ANALYTICS_KEY = 'klaviyo-analytics';

function getShop(req) {
  return req.headers['x-shopify-shop-domain'] || req.query.shop || req.session?.shop || null;
}

// GET: Load flow versions for shop
router.get('/versions', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(VERSIONS_KEY)) || {};
  res.json({ ok: true, versions: all[shop] || [] });
});

// POST: Save new flow version for shop
router.post('/versions', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  let all = (await storage.get(VERSIONS_KEY)) || {};
  const version = req.body.version;
  if (!version) return res.status(400).json({ ok: false, error: 'Missing version data' });
  if (!all[shop]) all[shop] = [];
  version.id = Math.random().toString(36).substr(2, 9);
  all[shop].push(version);
  await storage.set(VERSIONS_KEY, all);
  res.json({ ok: true, versions: all[shop] });
});

// GET: Load flow for shop
router.get('/flow', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(FLOWS_KEY)) || {};
  res.json({ ok: true, flow: all[shop] || '' });
});

// POST: Save flow for shop
router.post('/flow', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  let all = (await storage.get(FLOWS_KEY)) || {};
  all[shop] = req.body.flow;
  await storage.set(FLOWS_KEY, all);
  res.json({ ok: true, flow: all[shop] });
});

// GET: Load collaborators for shop
router.get('/collaborators', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(COLLAB_KEY)) || {};
  res.json({ ok: true, collaborators: all[shop] || ['You'] });
});

// POST: Save collaborators for shop
router.post('/collaborators', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  let all = (await storage.get(COLLAB_KEY)) || {};
  all[shop] = req.body.collaborators;
  await storage.set(COLLAB_KEY, all);
  res.json({ ok: true, collaborators: all[shop] });
});

// GET: Load analytics for shop
router.get('/analytics', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  const all = (await storage.get(ANALYTICS_KEY)) || {};
  res.json({ ok: true, analytics: all[shop] || null });
});

// POST: Save analytics for shop
router.post('/analytics', async (req, res) => {
  const shop = getShop(req);
  if (!shop) return res.status(400).json({ ok: false, error: 'Missing shop' });
  let all = (await storage.get(ANALYTICS_KEY)) || {};
  all[shop] = req.body.analytics;
  await storage.set(ANALYTICS_KEY, all);
  res.json({ ok: true, analytics: all[shop] });
});

module.exports = router;
