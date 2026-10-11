'use strict';
const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const { handleLocalSEOQuery } = require('./localSEOToolkitService');
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const router = express.Router();
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(verifyShopifySession);

router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'local-seo-toolkit', v: '2.0.0' })));
router.get('/onboarding', ah(async (req, res) => res.json({ ok: true, steps: ['Connect your local business data','Configure local SEO settings','Run your first optimization','Analyze results','Export or share reports'] })));

router.get('/locations', ah(async (req, res) => res.json({ ok: true, locations: db.list() })));
router.get('/locations/:id', ah(async (req, res) => {
  const loc = db.get(req.params.id);
  if (!loc) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, location: loc });
}));
router.post('/locations', ah(async (req, res) => {
  const loc = db.create(req.body || {});
  res.json({ ok: true, location: loc });
}));
router.put('/locations/:id', ah(async (req, res) => {
  const loc = db.update(req.params.id, req.body || {});
  if (!loc) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, location: loc });
}));
router.delete('/locations/:id', ah(async (req, res) => {
  const result = db.delete(req.params.id);
  if (!result) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
}));

router.post('/ai/suggest', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ ok: false, error: 'description required' });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: req.body.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a local SEO expert for e-commerce businesses.' },
      { role: 'user', content: description }
    ],
    max_tokens: 512
  });
  res.json({ ok: true, suggestion: completion.choices[0].message.content });
}));

router.post('/query', ah(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  const result = await handleLocalSEOQuery(query);
  res.json({ ok: true, result });
}));

router.get('/export', ah(async (req, res) => res.json({ ok: true, data: db.list() })));

router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
