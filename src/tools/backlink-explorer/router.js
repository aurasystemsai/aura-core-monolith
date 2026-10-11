'use strict';

// Link building: a tracker for links you have won, checked live on the page that should carry them,
// plus AI-written outreach emails. There is no backlink index here, so nothing is estimated.
const crypto = require('crypto');
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const { safeFetchText } = require('../../core/safeFetch');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'link-building';
const MODEL = 'gpt-4o-mini';
const MAX_LINKS = 200;
const KINDS = {
  supplier: 'a supplier or brand whose products the store sells, asking for a link from their "where to buy" or stockists page',
  blogger: 'a blogger or reviewer, offering a product or a useful page for them to mention',
  directory: 'the owner of a relevant directory or resource list, asking to be added',
  broken: 'a site owner with a broken link on their page, politely suggesting the store\'s page as a replacement',
  mention: 'a site that mentions the store by name without linking, asking them to add a link',
};

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const bad = (res, error) => res.status(400).json({ ok: false, error });
const load = (shop) => store.read(TOOL, shop, []);

function toUrl(input) {
  let s = String(input || '').trim();
  if (!s || s.length > 500) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { const u = new URL(s); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.toString() : null; } catch (e) { return null; }
}
const host = (u) => new URL(u).hostname.toLowerCase().replace(/^www\./, '');
const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

// The store's own address(es): the public domain and the myshopify one.
async function ownHosts(shop, token) {
  const hosts = new Set([shop.toLowerCase()]);
  try {
    const d = await gql(shop, token, '{ shop { primaryDomain { host } } }', {});
    if (d.shop && d.shop.primaryDomain && d.shop.primaryDomain.host) hosts.add(d.shop.primaryDomain.host.toLowerCase().replace(/^www\./, ''));
  } catch (e) { /* the myshopify host still works */ }
  return [...hosts];
}

// Reads the page and looks for a real <a> pointing at one of the store's hosts.
async function inspect(sourceUrl, hosts, target) {
  const base = { checkedAt: new Date().toISOString() };
  let r;
  try { r = await safeFetchText(sourceUrl, { timeoutMs: 12000, maxBytes: 2 * 1024 * 1024 }); } catch (e) {
    return { ...base, status: 'unreachable', note: 'The page could not be opened.' };
  }
  if (r.status >= 400) return { ...base, status: 'unreachable', note: `The page returned an error (${r.status}).` };
  const wanted = target ? target.replace(/\/+$/, '') : null;
  for (const m of r.text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = (m[1].match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    let abs;
    try { abs = new URL(decode(href), r.finalUrl); } catch (e) { continue; }
    const h = abs.hostname.toLowerCase().replace(/^www\./, '');
    if (!hosts.includes(h)) continue;
    if (wanted && abs.toString().replace(/\/+$/, '') !== wanted) continue;
    const rel = ((m[1].match(/\brel=["']([^"']+)["']/i) || [])[1] || '').toLowerCase();
    const flag = ['sponsored', 'ugc', 'nofollow'].find((x) => rel.includes(x));
    const anchor = decode(m[2].replace(/<[^>]*>/g, ' ')) || '(image or empty)';
    return { ...base, status: flag ? 'nofollow' : 'live', rel: flag || '', anchor: anchor.slice(0, 120), pointsTo: abs.toString().slice(0, 300), note: flag ? `The link is there but marked "${flag}", so it passes little or no ranking value.` : 'The link is there and passes ranking value.' };
  }
  return { ...base, status: 'missing', note: wanted ? 'That page is reachable but has no link to the page you chose.' : 'That page is reachable but has no link to your store.' };
}

const summary = (list) => ({ total: list.length, live: list.filter((l) => l.status === 'live').length, nofollow: list.filter((l) => l.status === 'nofollow').length, missing: list.filter((l) => l.status === 'missing').length, unreachable: list.filter((l) => l.status === 'unreachable').length });

router.get('/links', withShop(async (req, res, { shop }) => {
  const links = load(shop);
  res.json({ ok: true, links, summary: summary(links) });
}));

router.post('/links', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const source = toUrl(b.source);
  if (!source) return bad(res, 'Enter the address of the page that links to you, for example blog.example.com/best-shoes.');
  const target = b.target ? toUrl(b.target) : null;
  if (b.target && !target) return bad(res, 'The page they should link to is not a valid address.');
  const hosts = await ownHosts(shop, token);
  if (hosts.includes(host(source))) return bad(res, 'That page is on your own store. Enter a page on another site.');
  if (target && !hosts.includes(host(target))) return bad(res, 'The page they should link to must be on your store.');
  const list = load(shop);
  if (list.length >= MAX_LINKS) return bad(res, `You can track up to ${MAX_LINKS} links. Remove one first.`);
  if (list.some((l) => l.source === source)) return bad(res, 'You are already tracking that page.');
  const result = await inspect(source, hosts, target);
  const entry = { id: crypto.randomUUID(), source, site: host(source), target: target || '', note: String(b.note || '').slice(0, 200), addedAt: new Date().toISOString(), ...result };
  store.write(TOOL, shop, [entry, ...list]);
  res.json({ ok: true, link: entry });
}));

// Re-check one link, or every link when no id is sent (capped so a request stays quick).
router.post('/links/check', withShop(async (req, res, { shop, token }) => {
  const id = req.body && req.body.id;
  const list = load(shop);
  const todo = id ? list.filter((l) => l.id === id) : list.slice(0, 25);
  if (id && !todo.length) return res.status(404).json({ ok: false, error: 'That link is no longer tracked.' });
  const hosts = await ownHosts(shop, token);
  const done = await Promise.all(todo.map(async (l) => [l.id, await inspect(l.source, hosts, l.target || null)]));
  const byId = new Map(done);
  const next = load(shop).map((l) => (byId.has(l.id) ? { ...l, rel: '', anchor: '', ...byId.get(l.id) } : l));
  store.write(TOOL, shop, next);
  res.json({ ok: true, links: next, summary: summary(next), checked: done.length });
}));

router.delete('/links/:id', withShop(async (req, res, { shop }) => {
  const list = load(shop);
  if (!list.some((l) => l.id === req.params.id)) return res.status(404).json({ ok: false, error: 'That link is no longer tracked.' });
  store.write(TOOL, shop, list.filter((l) => l.id !== req.params.id));
  res.json({ ok: true });
}));

// Real pages from the store to promote.
router.get('/pages', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, `{ shop { name primaryDomain { url } }
    collections(first:20, sortKey:UPDATED_AT, reverse:true){ nodes{ title handle } }
    products(first:20, sortKey:UPDATED_AT, reverse:true){ nodes{ title handle onlineStoreUrl status } } }`, {});
  const home = d.shop.primaryDomain && d.shop.primaryDomain.url;
  const root = (home || '').replace(/\/+$/, '');
  const pick = (kind, nodes, dir) => nodes.filter((n) => n.status !== 'DRAFT' && n.status !== 'ARCHIVED' && (n.onlineStoreUrl || root)).map((n) => ({ kind, title: n.title, url: n.onlineStoreUrl || `${root}/${dir}/${n.handle}` }));
  res.json({ ok: true, storeName: d.shop.name, pages: [...(home ? [{ kind: 'Home page', title: d.shop.name, url: home }] : []), ...pick('Collection', d.collections.nodes, 'collections'), ...pick('Product', d.products.nodes, 'products')] });
}));

router.post('/outreach', withShop(async (req, res) => {
  const b = req.body || {};
  if (!KINDS[b.kind]) return bad(res, 'Choose who you are writing to.');
  const pageUrl = toUrl(b.pageUrl);
  if (!pageUrl) return bad(res, 'Choose the page of yours you want them to link to.');
  const site = String(b.site || '').trim().slice(0, 120);
  if (!site) return bad(res, 'Enter their site or name.');
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not available right now. You can write the email yourself.' });
  const ask = `Write a short, friendly outreach email from a small online store owner to ${KINDS[b.kind]}.
Store: ${String(b.storeName || 'the store').slice(0, 80)}. Their site: ${site}. Page we would like linked: ${pageUrl} (${String(b.pageTitle || '').slice(0, 120)}).
Extra detail from the owner: ${String(b.note || 'none').slice(0, 400)}.
Rules: under 120 words, plain and personal, one clear ask, no flattery, no claims about traffic or rankings, no invented facts. Reply as JSON: {"subject":"...","body":"..."}. Sign off with [Your name].`;
  const resp = await client.chat.completions.create({ model: MODEL, temperature: 0.5, max_tokens: 350, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: ask }] });
  let out = {};
  try { out = JSON.parse(resp.choices[0].message.content); } catch (e) { /* handled below */ }
  const subject = String(out.subject || '').trim().slice(0, 150);
  const body = String(out.body || '').trim();
  if (!subject || body.length < 40) return res.status(502).json({ ok: false, error: 'AI did not return a usable email. Try again, you were not charged.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'email-gen' });
  res.json({ ok: true, subject, body });
}));

module.exports = router;
