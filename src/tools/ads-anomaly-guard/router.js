'use strict';

// Ads Anomaly Guard: compares each campaign's last 7 days with its own weekly average over the
// 23 days before. Plain rules on real ad data, so it costs no credits.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const google = require('../../core/googleAds');
const meta = require('../../core/metaAds');
const tiktok = require('../../core/tiktokAds');

const router = express.Router();
const BASE_WEEKS = 23 / 7;
const r2 = (n) => Math.round(n * 100) / 100;

const PLATFORMS = [
  { id: 'google', name: 'Google Ads', mod: google, ready: (c) => !!c.customerId,
    fetch: async (shop, c, days) => google.campaignReport(await google.accessToken(shop), c.customerId, c.loginCustomerId, days) },
  { id: 'meta', name: 'Meta Ads', mod: meta, ready: (c) => !!c.accountId,
    fetch: async (shop, c, days) => meta.campaignReport(meta.accessToken(shop), c.accountId, days) },
  { id: 'tiktok', name: 'TikTok Ads', mod: tiktok, ready: (c) => !!c.accountId,
    fetch: async (shop, c, days) => tiktok.campaignReport(tiktok.accessToken(shop), c.accountId, days) },
];

// Pure rules. recent = last 7 days, month = last 30 days (includes the recent week).
function analyse(recent, month) {
  const byId = new Map(month.map((m) => [String(m.id), m]));
  const out = [];
  for (const r of recent) {
    const m = byId.get(String(r.id));
    if (!m) continue;
    const base = {
      spend: Math.max(0, m.spend - r.spend) / BASE_WEEKS,
      conversions: Math.max(0, m.conversions - r.conversions) / BASE_WEEKS,
      value: Math.max(0, m.conversionValue - r.conversionValue) / BASE_WEEKS,
      clicks: Math.max(0, m.clicks - r.clicks) / BASE_WEEKS,
    };
    const found = [];
    const add = (severity, code, message) => found.push({ severity, code, message });
    if (base.spend >= 5 && r.spend >= base.spend * 2 && r.spend - base.spend >= 10) {
      add('high', 'spend_spike', `Spent ${r2(r.spend)} this week against a normal ${r2(base.spend)}.`);
    }
    if (base.spend >= 5 && base.conversions >= 1 && r.spend >= base.spend * 0.5 && r.conversions === 0) {
      add('high', 'no_conversions', `Spent ${r2(r.spend)} this week with no conversions. It normally gets about ${r2(base.conversions)} a week.`);
    }
    const baseRoas = base.spend ? base.value / base.spend : 0;
    const roas = r.spend ? r.conversionValue / r.spend : 0;
    if (baseRoas >= 1 && r.spend >= 10 && roas <= baseRoas * 0.6 && r.conversions > 0) {
      add('medium', 'roas_drop', `Return on spend fell to ${r2(roas)} from a normal ${r2(baseRoas)}.`);
    }
    if (base.clicks >= 20 && r.clicks <= base.clicks * 0.4 && m.status === 'ENABLED') {
      add('medium', 'traffic_drop', `Only ${r.clicks} clicks this week against a normal ${Math.round(base.clicks)}.`);
    }
    if (found.length) out.push({ campaignId: r.id, campaign: r.name, spend: r.spend, baselineSpend: r2(base.spend), issues: found });
  }
  const rank = { high: 0, medium: 1 };
  return out.sort((a, b) => Math.min(...a.issues.map((i) => rank[i.severity])) - Math.min(...b.issues.map((i) => rank[i.severity])) || b.spend - a.spend);
}

router.get('/check', async (req, res) => {
  const ctx = getShopContext(req);
  if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
  const { shop } = ctx;
  const platforms = [];
  for (const p of PLATFORMS) {
    const conn = p.mod.getConnection(shop);
    if (!conn) { platforms.push({ id: p.id, name: p.name, state: 'not_connected', alerts: [] }); continue; }
    if (!p.ready(conn)) { platforms.push({ id: p.id, name: p.name, state: 'no_account', alerts: [] }); continue; }
    try {
      const [recent, month] = await Promise.all([p.fetch(shop, conn, 7), p.fetch(shop, conn, 30)]);
      platforms.push({ id: p.id, name: p.name, state: 'ok', campaigns: recent.length, alerts: analyse(recent, month) });
    } catch (e) {
      platforms.push({ id: p.id, name: p.name, state: 'error', error: e.message, alerts: [] });
    }
  }
  res.json({ ok: true, checkedAt: new Date().toISOString(), platforms });
});

module.exports = router;
module.exports._analyse = analyse;