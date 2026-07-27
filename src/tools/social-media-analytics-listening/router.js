'use strict';
const express = require('express');
const router = express.Router();
const db = require('./db');
const { analyzeSocialMedia } = require('./socialMediaAnalyticsService');
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const OpenAI = require('openai');

router.use(verifyShopifySession);

router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'social-media-analytics-listening', v: '2.0.0' })));

router.get('/analyses', ah(async (req, res) => res.json({ ok: true, analyses: db.list() })));
router.get('/analyses/:id', ah(async (req, res) => {
  const item = db.get(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, analysis: item });
}));
router.post('/analyses', ah(async (req, res) => {
  const item = db.create(req.body || {});
  res.json({ ok: true, analysis: item });
}));
router.put('/analyses/:id', ah(async (req, res) => {
  const item = db.update(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, analysis: item });
}));
router.delete('/analyses/:id', ah(async (req, res) => {
  const result = db.delete(req.params.id);
  if (!result) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
}));

router.post('/analyze', requireCreditsOnMutation('analytics-insight'), ah(async (req, res) => {
  const { platform, query } = req.body;
  if (!platform) return res.status(400).json({ ok: false, error: 'platform required' });
  const result = await analyzeSocialMedia({ platform, query, ...req.body });
  res.json({ ok: true, result });
}));

router.post('/ai/suggest', requireCreditsOnMutation('analytics-insight'), ah(async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ ok: false, error: 'description required' });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: req.body.model || 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a social media analytics expert.' }, { role: 'user', content: description }],
    max_tokens: 512
  });
  res.json({ ok: true, suggestion: completion.choices[0].message.content });
}));

router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
