'use strict';

// Each shop connects its own Google Ads account by OAuth. AURA only ever reads that shop's data.
const store = require('./shopStore');
const sc = require('./searchConsole');

const TOOL = 'google-ads-integration';
const SCOPE = 'https://www.googleapis.com/auth/adwords';
const VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v25';

const isConfigured = sc.isConfigured;
const authUrl = (req, shop) => sc.authUrl(req, shop, SCOPE, 'google-ads');

async function completeConnection(req, code, shop) {
  const t = await sc.tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: sc.redirectUri(req) });
  if (!t.refresh_token) throw new Error('Google did not return offline access. Remove AURA from your Google account permissions and try again.');
  store.write(TOOL, shop, { refreshToken: sc.encrypt(t.refresh_token), connectedAt: new Date().toISOString(), customerId: null, loginCustomerId: null });
}

const getConnection = (shop) => store.read(TOOL, shop, null);
const disconnect = (shop) => store.write(TOOL, shop, null);

function saveSelection(shop, customerId, loginCustomerId) {
  const c = getConnection(shop);
  if (!c) throw new Error('Connect Google Ads first.');
  store.write(TOOL, shop, { ...c, customerId, loginCustomerId: loginCustomerId || null });
}

async function accessToken(shop) {
  const c = getConnection(shop);
  if (!c || !c.refreshToken) throw new Error('Google Ads is not connected.');
  const t = await sc.tokenRequest({ refresh_token: sc.decrypt(c.refreshToken), grant_type: 'refresh_token' });
  return t.access_token;
}

async function call(token, path, { method = 'GET', body, loginCustomerId } = {}) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) headers['developer-token'] = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;
  const res = await fetch(`https://googleads.googleapis.com/${VERSION}/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Ads error (${(data.error && data.error.message) || res.status})`);
  return data;
}

const digits = (s) => String(s || '').replace(/\D/g, '');

async function listAccounts(token) {
  const { resourceNames = [] } = await call(token, 'customers:listAccessibleCustomers');
  const out = [];
  for (const rn of resourceNames.slice(0, 50)) {
    const id = digits(rn);
    try {
      const r = await call(token, `customers/${id}/googleAds:search`, {
        method: 'POST', loginCustomerId: id,
        body: { query: 'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager FROM customer LIMIT 1' },
      });
      const c = (r.results && r.results[0] && r.results[0].customer) || {};
      out.push({ id, name: c.descriptiveName || id, currency: c.currencyCode || '', manager: !!c.manager });
    } catch {
      out.push({ id, name: id, currency: '', manager: false });
    }
  }
  return out;
}

const RANGES = { 7: 'LAST_7_DAYS', 14: 'LAST_14_DAYS', 30: 'LAST_30_DAYS' };

/** Campaign results for the chosen account. Money is converted from micros. */
async function campaignReport(token, customerId, loginCustomerId, days) {
  const range = RANGES[days] || 'LAST_30_DAYS';
  const r = await call(token, `customers/${digits(customerId)}/googleAds:search`, {
    method: 'POST', loginCustomerId: loginCustomerId || undefined,
    body: {
      query: `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date DURING ${range} AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC LIMIT 100`,
    },
  });
  return (r.results || []).map((x) => {
    const m = x.metrics || {};
    const spend = Number(m.costMicros || 0) / 1e6;
    const value = Number(m.conversionsValue || 0);
    const clicks = Number(m.clicks || 0);
    const impressions = Number(m.impressions || 0);
    return {
      id: x.campaign.id, name: x.campaign.name, status: x.campaign.status,
      spend: Math.round(spend * 100) / 100, clicks, impressions,
      conversions: Math.round(Number(m.conversions || 0) * 10) / 10,
      conversionValue: Math.round(value * 100) / 100,
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      cpc: clicks ? Math.round((spend / clicks) * 100) / 100 : 0,
      roas: spend ? Math.round((value / spend) * 100) / 100 : 0,
    };
  });
}

module.exports = {
  isConfigured, authUrl, completeConnection, getConnection, disconnect, saveSelection,
  accessToken, listAccounts, campaignReport, digits,
};
