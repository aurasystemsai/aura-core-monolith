'use strict';

// Each shop connects its own Meta (Facebook and Instagram) ad account. AURA only reads that shop's data.
const crypto = require('crypto');
const store = require('./shopStore');
const sc = require('./searchConsole');

const TOOL = 'facebook-ads-integration';
const VERSION = process.env.META_GRAPH_VERSION || 'v24.0';
const GRAPH = `https://graph.facebook.com/${VERSION}`;

const isConfigured = () => !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
const redirectUri = (req) => sc.redirectUri(req).replace(/\/google\/callback$/, '/meta/callback');

function authUrl(req, shop) {
  const qs = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: 'ads_read',
    state: sc.signState(shop, 'meta'),
  });
  return `https://www.facebook.com/${VERSION}/dialog/oauth?${qs}`;
}

async function graph(path, params = {}, token) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${GRAPH}/${path}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(30000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Meta error (${(body.error && body.error.message) || res.status})`);
  return body;
}

async function completeConnection(req, code, shop) {
  const short = await graph('oauth/access_token', {
    client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: redirectUri(req), code,
  });
  // Meta has no refresh tokens: the long-lived token lasts about 60 days, then the shop reconnects.
  const long = await graph('oauth/access_token', {
    grant_type: 'fb_exchange_token', client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, fb_exchange_token: short.access_token,
  });
  const expiresAt = long.expires_in ? new Date(Date.now() + Number(long.expires_in) * 1000).toISOString() : null;
  store.write(TOOL, shop, { token: sc.encrypt(long.access_token), expiresAt, connectedAt: new Date().toISOString(), accountId: null });
}

const getConnection = (shop) => store.read(TOOL, shop, null);
const disconnect = (shop) => store.write(TOOL, shop, null);
const expired = (c) => !!(c && c.expiresAt && new Date(c.expiresAt).getTime() < Date.now());

function saveSelection(shop, accountId) {
  const c = getConnection(shop);
  if (!c) throw new Error('Connect Meta first.');
  store.write(TOOL, shop, { ...c, accountId });
}

function accessToken(shop) {
  const c = getConnection(shop);
  if (!c || !c.token) throw new Error('Meta is not connected.');
  if (expired(c)) throw new Error('Your Meta connection has expired. Disconnect and connect again.');
  return sc.decrypt(c.token);
}

async function listAccounts(token) {
  const r = await graph('me/adaccounts', { fields: 'account_id,name,currency,account_status', limit: '50' }, token);
  return (r.data || []).map((a) => ({ id: String(a.account_id), name: a.name || String(a.account_id), currency: a.currency || '', active: a.account_status === 1 }));
}

const PRESETS = { 7: 'last_7d', 14: 'last_14d', 30: 'last_30d' };
const r2 = (n) => Math.round(n * 100) / 100;
const PURCHASE = ['omni_purchase', 'purchase'];
const pick = (list) => {
  for (const t of PURCHASE) { const f = (list || []).find((x) => x.action_type === t); if (f) return Number(f.value || 0); }
  return 0;
};

async function campaignReport(token, accountId, days) {
  const r = await graph(`act_${String(accountId).replace(/\D/g, '')}/insights`, {
    level: 'campaign', date_preset: PRESETS[days] || 'last_30d', limit: '100',
    fields: 'campaign_id,campaign_name,spend,clicks,impressions,actions,action_values',
  }, token);
  return (r.data || []).map((x) => {
    const spend = Number(x.spend || 0), clicks = Number(x.clicks || 0), impressions = Number(x.impressions || 0);
    const conversions = pick(x.actions), value = pick(x.action_values);
    return {
      id: x.campaign_id, name: x.campaign_name, spend: r2(spend), clicks, impressions, conversions, conversionValue: r2(value),
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      cpc: clicks ? r2(spend / clicks) : 0,
      roas: spend ? r2(value / spend) : 0,
    };
  }).sort((a, b) => b.spend - a.spend);
}

module.exports = {
  isConfigured, authUrl, completeConnection, getConnection, disconnect, saveSelection, accessToken, listAccounts, campaignReport, expired,
};