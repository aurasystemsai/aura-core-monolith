const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const store = require('../../core/shopStore');
const { runTechnicalAudit } = require('./audit');

const router = express.Router();
const TOOL = 'technical-seo-auditor';

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  };
}

router.post('/audit', withShop(async (req, res, { shop, token }) => {
  const result = await runTechnicalAudit(shop, token);
  const entry = store.pushCapped(TOOL, shop, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), result }, 20);
  if (req.deductCredits) await req.deductCredits({ action: 'seo-scan' });
  res.json({ ok: true, id: entry.id, createdAt: entry.createdAt, result });
}));

router.get('/history', withShop(async (req, res, { shop }) => {
  const history = store.read(TOOL, shop, []).map(h => ({
    id: h.id, createdAt: h.createdAt, score: h.result.score, totalFindings: h.result.totalFindings,
  }));
  res.json({ ok: true, history });
}));

router.get('/history/:id', withShop(async (req, res, { shop }) => {
  const entry = store.read(TOOL, shop, []).find(h => h.id === req.params.id);
  if (!entry) return res.status(404).json({ ok: false, error: 'Audit not found' });
  res.json({ ok: true, entry });
}));

// AI action plan built only from the stored findings of one of this shop's audits.
router.post('/ai/plan', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const list = store.read(TOOL, shop, []);
  const entry = req.body && req.body.id ? list.find(h => h.id === req.body.id) : list[0];
  if (!entry) return res.status(404).json({ ok: false, error: 'Run an audit first.' });

  const r = entry.result;
  const findings = [
    ...r.pages.flatMap(p => p.findings.map(f => `[${f.severity}] ${p.kind} ${p.url}: ${f.title} - ${f.detail}`)),
    ...r.robots.findings.map(f => `[${f.severity}] robots.txt: ${f.title}`),
    ...r.sitemap.findings.map(f => `[${f.severity}] sitemap: ${f.title}`),
  ].slice(0, 60);
  if (!findings.length) return res.json({ ok: true, plan: 'No technical issues were found in this audit.' });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 900,
    messages: [
      { role: 'system', content: 'You are a Shopify technical SEO expert. Using ONLY the findings provided, write a short prioritised action plan. For each item say what to change in the Shopify theme or admin. Do not invent issues.' },
      { role: 'user', content: findings.join('\n') },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini', action: 'seo-analysis' });
  res.json({ ok: true, plan: (completion.choices[0].message.content || '').trim() });
}));

module.exports = router;
