'use strict';

const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const ads = require('../../core/googleAds');

const router = express.Router();
const MODEL = 'gpt-4o-mini';

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      res.status(502).json({ ok: false, error: err.message });
    }
  };
}

router.get('/status', withShop(async (req, res, { shop }) => {
  const c = ads.getConnection(shop);
  res.json({ ok: true, configured: ads.isConfigured(), connected: !!c, customerId: (c && c.customerId) || null });
}));

router.get('/connect', withShop(async (req, res, { shop }) => {
  if (!ads.isConfigured()) return res.status(503).json({ ok: false, error: 'Google connection is not set up on the server yet.' });
  res.json({ ok: true, url: ads.authUrl(req, shop) });
}));

router.post('/disconnect', withShop(async (req, res, { shop }) => {
  ads.disconnect(shop);
  res.json({ ok: true });
}));

router.get('/accounts', withShop(async (req, res, { shop }) => {
  if (!ads.getConnection(shop)) return res.status(400).json({ ok: false, error: 'Connect Google Ads first.' });
  const token = await ads.accessToken(shop);
  res.json({ ok: true, accounts: await ads.listAccounts(token) });
}));

router.post('/select', withShop(async (req, res, { shop }) => {
  const customerId = ads.digits(req.body && req.body.customerId);
  const loginCustomerId = ads.digits(req.body && req.body.loginCustomerId);
  if (customerId.length !== 10) return res.status(400).json({ ok: false, error: 'Choose an ad account.' });
  if (!ads.getConnection(shop)) return res.status(400).json({ ok: false, error: 'Connect Google Ads first.' });
  ads.saveSelection(shop, customerId, loginCustomerId.length === 10 ? loginCustomerId : null);
  res.json({ ok: true });
}));

async function report(shop, days) {
  const c = ads.getConnection(shop);
  if (!c) { const e = new Error('Connect Google Ads first.'); e.status = 400; throw e; }
  if (!c.customerId) { const e = new Error('Choose which ad account to read.'); e.status = 400; throw e; }
  const token = await ads.accessToken(shop);
  return ads.campaignReport(token, c.customerId, c.loginCustomerId, days);
}

const r2 = (n) => Math.round(n * 100) / 100;
const totals = (rows) => {
  const t = rows.reduce((a, r) => ({ spend: a.spend + r.spend, clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions, conversions: a.conversions + r.conversions, value: a.value + r.conversionValue }), { spend: 0, clicks: 0, impressions: 0, conversions: 0, value: 0 });
  return { spend: r2(t.spend), clicks: t.clicks, impressions: t.impressions, conversions: Math.round(t.conversions * 10) / 10, conversionValue: r2(t.value), roas: t.spend ? r2(t.value / t.spend) : 0 };
};

router.get('/campaigns', withShop(async (req, res, { shop }) => {
  const days = Number(req.query.days) || 30;
  try {
    const campaigns = await report(shop, days);
    res.json({ ok: true, days, campaigns, totals: totals(campaigns) });
  } catch (e) {
    res.status(e.status || 502).json({ ok: false, error: e.message });
  }
}));

// Plain-English advice from the real numbers only. Charged only when AI answers.
router.post('/suggest', withShop(async (req, res, { shop }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  let campaigns;
  try {
    campaigns = await report(shop, Number(req.body && req.body.days) || 30);
  } catch (e) {
    return res.status(e.status || 502).json({ ok: false, error: e.message });
  }
  if (!campaigns.some((c) => c.spend > 0 || c.impressions > 0 || c.clicks > 0)) return res.status(400).json({ ok: false, error: 'There are no campaigns with data in this period.' });
  let advice;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.3, max_tokens: 700, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You review Google Ads results for a small online shop owner who is a beginner. Use only the numbers given; never invent figures. Give 3 to 5 specific, plain-English actions, each tied to a named campaign and the number that justifies it. Do not promise outcomes. Reply as JSON {"summary":"one sentence","actions":[{"campaign":"...","action":"...","reason":"..."}]}.' },
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