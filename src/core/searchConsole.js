'use strict';

const crypto = require('crypto');
const store = require('./shopStore');

const TOOL = 'google-search-console';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

const isConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

function secret() {
  const s = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('Server is missing SESSION_SECRET.');
  return s;
}

function baseUrl(req) {
  const env = process.env.SHOPIFY_APP_URL || process.env.HOST_URL;
  return String(env || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

const redirectUri = (req) => `${baseUrl(req)}/google/callback`;

const b64 = (b) => Buffer.from(b).toString('base64url');
const mac = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

/** Signed, expiring state so the unauthenticated callback can tell which shop started the flow. */
function signState(shop) {
  const body = b64(JSON.stringify({ shop, exp: Date.now() + 10 * 60 * 1000, n: crypto.randomBytes(8).toString('hex') }));
  return `${body}.${mac(body)}`;
}

function verifyState(state) {
  const [body, sig] = String(state || '').split('.');
  if (!body || !sig) return null;
  const expected = mac(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.exp > Date.now() && typeof p.shop === 'string' ? p.shop : null;
  } catch { return null; }
}

const key = () => crypto.createHash('sha256').update(secret()).digest();

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.');
}

function decrypt(blob) {
  const [iv, tag, enc] = String(blob).split('.').map(p => Buffer.from(p, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

function authUrl(req, shop) {
  const qs = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: signState(shop),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;
}

async function tokenRequest(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, ...params }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google sign-in failed (${body.error || res.status})`);
  return body;
}

async function completeConnection(req, code, shop) {
  const t = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri(req) });
  if (!t.refresh_token) throw new Error('Google did not return offline access. Remove AURA from your Google account permissions and try again.');
  store.write(TOOL, shop, { refreshToken: encrypt(t.refresh_token), connectedAt: new Date().toISOString() });
}

const getConnection = (shop) => store.read(TOOL, shop, null);
const disconnect = (shop) => store.write(TOOL, shop, null);

async function accessToken(shop) {
  const c = getConnection(shop);
  if (!c || !c.refreshToken) throw new Error('Google Search Console is not connected.');
  const t = await tokenRequest({ refresh_token: decrypt(c.refreshToken), grant_type: 'refresh_token' });
  return t.access_token;
}

async function gget(token, url, options = {}) {
  const res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Search Console error (${(body.error && body.error.message) || res.status})`);
  return body;
}

const bare = (h) => String(h || '').toLowerCase().replace(/^www\./, '');

/** Picks the verified Search Console property that covers the given store domains. */
async function findSite(token, domains) {
  const { siteEntry = [] } = await gget(token, 'https://www.googleapis.com/webmasters/v3/sites');
  const wanted = domains.map(bare);
  const usable = siteEntry.filter(s => s.permissionLevel !== 'siteUnverifiedUser');
  for (const s of usable) {
    const host = s.siteUrl.startsWith('sc-domain:') ? s.siteUrl.slice(10) : (() => { try { return new URL(s.siteUrl).hostname; } catch { return ''; } })();
    if (wanted.includes(bare(host))) return s.siteUrl;
  }
  return null;
}

/** Real average position, clicks and impressions per query over the last N days. */
async function queryPositions(token, siteUrl, days = 28, limit = 200) {
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const body = await gget(token, `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: limit }),
  });
  return (body.rows || []).map(r => ({
    query: r.keys[0], clicks: r.clicks, impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10, position: Math.round(r.position * 10) / 10,
  }));
}

module.exports = {
  isConfigured, authUrl, verifyState, signState, completeConnection, getConnection, disconnect,
  accessToken, findSite, queryPositions, encrypt, decrypt,
};
