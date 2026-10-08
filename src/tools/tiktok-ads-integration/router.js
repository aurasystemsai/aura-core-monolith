'use strict';

const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const tt = require('../../core/tiktokAds');

const router = express.Router();
const MODEL = 'gpt-4o-mini';

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      res.status(err.status || 502).json({ ok: false, error: err.message });
    }
  };
}

router.get('/status', withShop(async (req, res, { shop }) => {
  const c = tt.getConnection(shop);
  res.json({ ok: true, configured: tt.isConfigured(), connected: !!c, accountId: (c && c.accountId) || null });
}));

router.get('/connect', withShop(async (req, res, { shop }) => {
  if (!tt.isConfigured()) return res.status(503).json({ ok: false, error: 'TikTok connection is not set up on the server yet.' });
  res.json({ ok: true, url: tt.authUrl(req, shop) });
}));

router.post('/disconnect', withShop(async (req, res, { shop }) => {
  tt.disconnect(shop);
  res.json({ ok: true });
}));

router.get('/accounts', withShop(async (req, res, { shop }) => {
  if (!tt.getConnection(shop)) return res.status(400).json({ ok: false, error: 'Connect TikTok first.' });
  res.json({ ok: true, accounts: await tt.listAccounts(tt.accessToken(shop), tt.getConnection(shop).advertiserIds || []) });
}));

router.post('/select', withShop(async (req, res, { shop }) => {
  const id = String((req.body && req.body.accountId) || '').replace(/\D/g, '');
  if (!id) return res.status(400).json({ ok: false, error: 'Choose an ad account.' });
  if (!tt.getConnection(shop)) return res.status(400).json({ ok: false, error: 'Connect TikTok first.' });
  try { tt.saveSelection(shop, id); } catch (e) { return res.status(400).json({ ok: false, error: e.message }); }
  res.json({ ok: true });
}));

async function report(shop, days) {
  const c = tt.getConnection(shop);
  const fail = (m) => Object.assign(new Error(m), { status: 400 });
  if (!c) throw fail('Connect TikTok first.');
  if (!c.accountId) throw fail('Choose which ad account to read.');
  return tt.campaignReport(tt.accessToken(shop), c.accountId, days);
}

const r2 = (n) => Math.round(n * 100) / 100;
const totals = (rows) => {
  const t = rows.reduce((a, r) => ({ spend: a.spend + r.spend, clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions, conversions: a.conversions + r.conversions, value: a.value + r.conversionValue }), { spend: 0, clicks: 0, impressions: 0, conversions: 0, value: 0 });
  return { spend: r2(t.spend), clicks: t.clicks, impressions: t.impressions, conversions: t.conversions, conversionValue: 0, roas: 0 };
};

router.get('/campaigns', withShop(async (req, res, { shop }) => {
  const days = Number(req.query.days) || 30;
  const campaigns = await report(shop, days);
  res.json({ ok: true, days, campaigns, totals: totals(campaigns) });
}));

// Plain-English advice from the real numbers only. Charged only when AI answers.
router.post('/suggest', withShop(async (req, res, { shop }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const campaigns = await report(shop, Number(req.body && req.body.days) || 30);
  if (!campaigns.length) return res.status(400).json({ ok: false, error: 'There are no campaigns with data in this period.' });
  let advice;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.3, max_tokens: 700, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You review TikTok ad results for a small online shop owner who is a beginner. Use only the numbers given; never invent figures. No purchase value is available, so judge by spend, clicks, click-through rate, cost per click and conversions only. Give 3 to 5 specific, plain-English actions, each tied to a named campaign and the number that justifies it. Do not promise outcomes. Reply as JSON {"summary":"one sentence","actions":[{"campaign":"...","action":"...","reason":"..."}]}.' },
        { role: 'user', content: JSON.stringify(campaigns.slice(0, 25)) },
      ],
    });
    advice = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not review the campaigns: ${e.message}` });
  }
  const actions = (Array.isArray(advice.actions) ? advice.actions : []).slice(0, 6).map((a) => ({
    campaign: String(a.campaign || '').slice(0, 200), action: String(a.action || '').slice(0, 400), reason: String(a.reason || '').slice(0, 400),
  })).filter((a) => a.action);
  if (!actions.length) return res.status(502).json({ ok: false, error: 'AI returned no usable advice. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  res.json({ ok: true, summary: String(advice.summary || '').slice(0, 400), actions });
}));

module.exports = router;