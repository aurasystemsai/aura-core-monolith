'use strict';

// Each shop connects its own TikTok Ads account. AURA only reads that shop's data.
const store = require('./shopStore');
const sc = require('./searchConsole');

const TOOL = 'tiktok-ads-integration';
const API = 'https://business-api.tiktok.com/open_api/v1.3';

const isConfigured = () => !!(process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET);
const redirectUri = (req) => sc.redirectUri(req).replace(/\/google\/callback$/, '/tiktok/callback');

function authUrl(req, shop) {
  const qs = new URLSearchParams({ app_id: process.env.TIKTOK_APP_ID, state: sc.signState(shop, 'tiktok'), redirect_uri: redirectUri(req) });
  return `https://business-api.tiktok.com/portal/auth?${qs}`;
}

async function call(path, { method = 'GET', params, body, token } = {}) {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${API}/${path}${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Access-Token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || (out.code !== undefined && out.code !== 0)) throw new Error(`TikTok error (${out.message || res.status})`);
  return out.data || {};
}

async function completeConnection(req, authCode, shop) {
  const d = await call('oauth2/access_token/', { method: 'POST', body: { app_id: process.env.TIKTOK_APP_ID, secret: process.env.TIKTOK_APP_SECRET, auth_code: authCode } });
  if (!d.access_token) throw new Error('TikTok did not return an access token.');
  store.write(TOOL, shop, {
    token: sc.encrypt(d.access_token), advertiserIds: (d.advertiser_ids || []).map(String).slice(0, 50),
    connectedAt: new Date().toISOString(), accountId: null,
  });
}

const getConnection = (shop) => store.read(TOOL, shop, null);
const disconnect = (shop) => store.write(TOOL, shop, null);

function saveSelection(shop, accountId) {
  const c = getConnection(shop);
  if (!c) throw new Error('Connect TikTok first.');
  if (!(c.advertiserIds || []).includes(accountId)) throw new Error('That ad account was not shared with AURA.');
  store.write(TOOL, shop, { ...c, accountId });
}

function accessToken(shop) {
  const c = getConnection(shop);
  if (!c || !c.token) throw new Error('TikTok is not connected.');
  return sc.decrypt(c.token);
}

async function listAccounts(token, ids) {
  if (!ids.length) return [];
  const d = await call('advertiser/info/', { token, params: { advertiser_ids: JSON.stringify(ids) } });
  const byId = new Map((d.list || []).map((a) => [String(a.advertiser_id), a]));
  return ids.map((id) => { const a = byId.get(id) || {}; return { id, name: a.name || id, currency: a.currency || '' }; });
}

const r2 = (n) => Math.round(n * 100) / 100;
const ymd = (d) => d.toISOString().slice(0, 10);

/** Campaign spend and results. TikTok purchase value is not requested, so no ROAS is shown. */
async function campaignReport(token, advertiserId, days) {
  const end = new Date();
  const start = new Date(end.getTime() - ([7, 14, 30].includes(days) ? days : 30) * 86400000);
  const d = await call('report/integrated/get/', {
    token,
    params: {
      advertiser_id: advertiserId, report_type: 'BASIC', data_level: 'AUCTION_CAMPAIGN',
      dimensions: JSON.stringify(['campaign_id']), metrics: JSON.stringify(['campaign_name', 'spend', 'impressions', 'clicks', 'conversion']),
      start_date: ymd(start), end_date: ymd(end), page_size: '100',
    },
  });
  return (d.list || []).map((x) => {
    const m = x.metrics || {};
    const spend = Number(m.spend || 0), clicks = Number(m.clicks || 0), impressions = Number(m.impressions || 0);
    return {
      id: String(x.dimensions && x.dimensions.campaign_id), name: m.campaign_name || '', spend: r2(spend), clicks, impressions,
      conversions: Number(m.conversion || 0),
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      cpc: clicks ? r2(spend / clicks) : 0,
    };
  }).sort((a, b) => b.spend - a.spend);
}

module.exports = { isConfigured, authUrl, completeConnection, getConnection, disconnect, saveSelection, accessToken, listAccounts, campaignReport };