'use strict';
const express = require('express');
const router = express.Router();
const db = require('./db');
const { handlePortalQuery } = require('./selfServicePortalService');
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const OpenAI = require('openai');

router.use(verifyShopifySession);

router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'self-service-portal', v: '2.0.0' })));

router.get('/requests', ah(async (req, res) => res.json({ ok: true, requests: db.list() })));
router.get('/requests/:id', ah(async (req, res) => {
  const item = db.get(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, request: item });
}));
router.post('/requests', ah(async (req, res) => {
  const item = db.create(req.body || {});
  res.json({ ok: true, request: item });
}));
router.put('/requests/:id', ah(async (req, res) => {
  const item = db.update(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, request: item });
}));
router.delete('/requests/:id', ah(async (req, res) => {
  const result = db.delete(req.params.id);
  if (!result) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
}));

router.post('/ai/suggest', requireCreditsOnMutation('generic-ai'), ah(async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ ok: false, error: 'description required' });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: req.body.model || 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a self-service portal expert for e-commerce.' }, { role: 'user', content: description }],
    max_tokens: 512
  });
  res.json({ ok: true, suggestion: completion.choices[0].message.content });
}));

router.post('/query', ah(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  const result = await handlePortalQuery(query);
  res.json({ ok: true, result });
}));

router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
