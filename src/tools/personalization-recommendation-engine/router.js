'use strict';
const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const { queryPersonalization } = require('./personalizationRecommendationService');
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const router = express.Router();
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(verifyShopifySession);

router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'personalization-recommendation-engine', v: '2.0.0' })));

router.get('/recommendations', ah(async (req, res) => res.json({ ok: true, recommendations: db.list() })));

router.get('/recommendations/:id', ah(async (req, res) => {
  const rec = db.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, recommendation: rec });
}));

router.post('/recommendations', ah(async (req, res) => {
  const rec = db.create(req.body || {});
  res.json({ ok: true, recommendation: rec });
}));

router.put('/recommendations/:id', ah(async (req, res) => {
  const rec = db.update(req.params.id, req.body || {});
  if (!rec) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, recommendation: rec });
}));

router.delete('/recommendations/:id', ah(async (req, res) => {
  const result = db.delete(req.params.id);
  if (!result) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
}));

router.post('/ai/suggest', requireCreditsOnMutation('analytics-insight'), ah(async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ ok: false, error: 'description required' });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: req.body.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a personalization recommendation expert for e-commerce.' },
      { role: 'user', content: description }
    ],
    max_tokens: 512
  });
  res.json({ ok: true, suggestion: completion.choices[0].message.content });
}));

router.post('/query', ah(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  const result = await queryPersonalization(query);
  res.json({ ok: true, result });
}));

router.get('/onboarding', ah(async (req, res) => res.json({ ok: true, steps: [
  'Connect your personalization data',
  'Configure recommendation settings',
  'Run your first recommendation',
  'Analyze results',
  'Export or share recommendations',
] })));

router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
