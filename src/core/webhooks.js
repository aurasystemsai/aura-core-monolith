'use strict';

// Outbound webhooks: a merchant adds an https URL and AURA posts a signed JSON event to it when something happens.
// Safety: https on port 443 only, no redirects, 5 second timeout, and the address the hostname resolves to must be
// public. That check runs on every delivery (inside the socket lookup), so a hostname that later points at an
// internal address cannot be used to reach the server's network.
const crypto = require('crypto');
const dns = require('dns');
const https = require('https');
const net = require('net');
const store = require('./shopStore');

const TOOL = 'webhooks';
const EVENTS = ['change.applied', 'draft.created', 'test.ping'];
const MAX_ENDPOINTS = 5;
const MAX_LOG = 50;
const RETRY_DELAYS = [60 * 1000, 10 * 60 * 1000];
const AUTO_OFF_AFTER = 10;

function isPrivateIp(ip) {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(x);
    if (mapped) return isPrivateIp(mapped[1]);
    return x === '::' || x === '::1' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith('ff');
  }
  return true;
}

// dns.lookup stand-in that refuses non-public addresses.
function safeLookup(hostname, options, cb) {
  dns.lookup(hostname, { all: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return cb(Object.assign(new Error('That address is not allowed.'), { code: 'EBLOCKED' }));
    return options && options.all ? cb(null, addrs) : cb(null, addrs[0].address, addrs[0].family);
  });
}

function parseUrl(input) {
  let u;
  try { u = new URL(String(input || '').trim()); } catch { throw Object.assign(new Error('Enter a full web address starting with https://'), { status: 400 }); }
  if (u.protocol !== 'https:') throw Object.assign(new Error('The address must start with https://'), { status: 400 });
  if (u.username || u.password) throw Object.assign(new Error('Do not put a username or password in the address.'), { status: 400 });
  if (u.port && u.port !== '443') throw Object.assign(new Error('Only the standard https port is allowed.'), { status: 400 });
  if (net.isIP(u.hostname.replace(/^\[|\]$/g, '')) && isPrivateIp(u.hostname.replace(/^\[|\]$/g, ''))) throw Object.assign(new Error('That address is not allowed.'), { status: 400 });
  if (/^localhost$|\.local$|\.internal$/i.test(u.hostname)) throw Object.assign(new Error('That address is not allowed.'), { status: 400 });
  if (u.href.length > 500) throw Object.assign(new Error('That address is too long.'), { status: 400 });
  return u;
}

const load = (shop) => { const d = store.read(TOOL, shop, {}); return { endpoints: d.endpoints || [], log: d.log || [] }; };
const save = (shop, d) => store.write(TOOL, shop, d);
const publicView = (e) => ({ id: e.id, url: e.url, events: e.events, active: e.active, failures: e.failures, createdAt: e.createdAt });

function list(shop) {
  const d = load(shop);
  return { endpoints: d.endpoints.map(publicView), log: d.log, events: EVENTS.filter((e) => e !== 'test.ping'), max: MAX_ENDPOINTS };
}

// The signing secret is returned here once and is never shown again.
async function add(shop, input) {
  const d = load(shop);
  if (d.endpoints.length >= MAX_ENDPOINTS) throw Object.assign(new Error(`You can add up to ${MAX_ENDPOINTS} webhooks.`), { status: 400 });
  const u = parseUrl(input.url);
  await new Promise((resolve, reject) => safeLookup(u.hostname, {}, (err) => (err ? reject(Object.assign(new Error(err.code === 'EBLOCKED' ? 'That address is not allowed.' : 'We could not find that address.'), { status: 400 })) : resolve())));
  const wanted = Array.isArray(input.events) && input.events.length ? input.events.filter((e) => EVENTS.includes(e) && e !== 'test.ping') : EVENTS.filter((e) => e !== 'test.ping');
  if (!wanted.length) throw Object.assign(new Error('Choose at least one event.'), { status: 400 });
  const secret = 'whsec_' + crypto.randomBytes(24).toString('base64url');
  const endpoint = { id: crypto.randomUUID(), url: u.href, events: wanted, secret, active: true, failures: 0, createdAt: new Date().toISOString() };
  d.endpoints.push(endpoint);
  save(shop, d);
  return { ...publicView(endpoint), secret };
}

function remove(shop, id) {
  const d = load(shop);
  const before = d.endpoints.length;
  d.endpoints = d.endpoints.filter((e) => e.id !== id);
  if (d.endpoints.length === before) return false;
  save(shop, d);
  return true;
}

function setActive(shop, id, active) {
  const d = load(shop);
  const e = d.endpoints.find((x) => x.id === id);
  if (!e) return false;
  e.active = !!active;
  if (e.active) e.failures = 0;
  save(shop, d);
  return true;
}

const sign = (secret, t, body) => crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');

// Real network send. Replaceable in tests.
const transport = {
  send(urlString, headers, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(urlString);
      const req = https.request({ method: 'POST', hostname: u.hostname, port: 443, path: u.pathname + u.search, headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }, lookup: safeLookup, timeout: 5000 }, (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      req.on('timeout', () => req.destroy(new Error('Timed out')));
      req.on('error', reject);
      req.end(body);
    });
  },
};

function record(shop, endpointId, entry) {
  const d = load(shop);
  const e = d.endpoints.find((x) => x.id === endpointId);
  if (e) {
    if (entry.ok) e.failures = 0;
    else if (entry.final) { e.failures += 1; if (e.failures >= AUTO_OFF_AFTER) e.active = false; }
  }
  d.log = [{ at: new Date().toISOString(), endpointId, ...entry }, ...d.log].slice(0, MAX_LOG);
  save(shop, d);
}

async function deliver(shop, endpoint, event, payload, attempt = 0) {
  const body = JSON.stringify({ id: payload.id, event, shop, createdAt: payload.createdAt, data: payload.data });
  const t = Math.floor(Date.now() / 1000);
  const headers = { 'Content-Type': 'application/json', 'User-Agent': 'AURA-Webhooks/1', 'X-Aura-Event': event, 'X-Aura-Signature': `t=${t},v1=${sign(endpoint.secret, t, body)}` };
  let status = 0;
  let error = '';
  try { status = await transport.send(endpoint.url, headers, body); } catch (e) { error = e.code === 'EBLOCKED' ? 'Blocked: not a public address' : e.message; }
  const ok = status >= 200 && status < 300;
  const retry = !ok && attempt < RETRY_DELAYS.length;
  record(shop, endpoint.id, { event, ok, status, error: ok ? '' : error || `HTTP ${status}`, attempt: attempt + 1, final: !ok && !retry });
  if (retry) {
    const timer = setTimeout(() => {
      const fresh = load(shop).endpoints.find((x) => x.id === endpoint.id);
      if (fresh && fresh.active) deliver(shop, fresh, event, payload, attempt + 1).catch(() => {});
    }, RETRY_DELAYS[attempt]);
    if (timer.unref) timer.unref();
  }
  return { ok, status, error };
}

// Fire and forget: a slow or broken receiver must never slow down or fail the merchant's own action.
function emit(shop, event, data) {
  try {
    const targets = load(shop).endpoints.filter((e) => e.active && e.events.includes(event));
    if (!targets.length) return;
    const payload = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), data };
    targets.forEach((e) => deliver(shop, e, event, payload).catch(() => {}));
  } catch { /* webhooks never break the caller */ }
}

async function sendTest(shop, id) {
  const e = load(shop).endpoints.find((x) => x.id === id);
  if (!e) throw Object.assign(new Error('Webhook not found.'), { status: 404 });
  return deliver(shop, e, 'test.ping', { id: crypto.randomUUID(), createdAt: new Date().toISOString(), data: { message: 'This is a test from AURA.' } }, RETRY_DELAYS.length);
}

module.exports = { EVENTS, list, add, remove, setActive, emit, sendTest, sign, isPrivateIp, parseUrl, transport };
