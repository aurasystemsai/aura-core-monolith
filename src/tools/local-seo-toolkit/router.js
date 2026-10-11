'use strict';

// Local SEO: reads your real Shopify locations and builds LocalBusiness structured data for each one.
// Opening hours, phone and business type are things Shopify does not hold, so you enter them here.
// Nothing is estimated: each check is true or false for the data we actually have.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');
const { safeFetchText } = require('../../core/safeFetch');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'local-seo';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPES = ['LocalBusiness', 'Store', 'ClothingStore', 'ShoeStore', 'JewelryStore', 'HomeGoodsStore', 'SportingGoodsStore', 'ElectronicsStore', 'FurnitureStore', 'BookStore', 'HealthAndBeautyBusiness', 'Restaurant', 'CafeOrCoffeeShop', 'Bakery', 'PetStore', 'GroceryStore'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Local SEO needs permission to read your store locations. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const load = (shop) => store.read(TOOL, shop, {});

function cleanHours(input) {
  const out = {};
  for (const d of DAYS) {
    const h = input && input[d];
    if (h && TIME.test(h.open) && TIME.test(h.close) && h.open < h.close) out[d] = { open: h.open, close: h.close };
  }
  return out;
}

function buildSchema(loc, extra, site) {
  const a = loc.address || {};
  const s = { '@context': 'https://schema.org', '@type': TYPES.includes(extra.type) ? extra.type : 'LocalBusiness', name: loc.name };
  if (site.url) s.url = site.url;
  const phone = extra.phone || a.phone;
  if (phone) s.telephone = phone;
  if (extra.priceRange) s.priceRange = extra.priceRange;
  s.address = { '@type': 'PostalAddress' };
  if (a.address1) s.address.streetAddress = [a.address1, a.address2].filter(Boolean).join(', ');
  if (a.city) s.address.addressLocality = a.city;
  if (a.provinceCode || a.province) s.address.addressRegion = a.provinceCode || a.province;
  if (a.zip) s.address.postalCode = a.zip;
  if (a.countryCode) s.address.addressCountry = a.countryCode;
  if (a.latitude != null && a.longitude != null) s.geo = { '@type': 'GeoCoordinates', latitude: a.latitude, longitude: a.longitude };
  const specs = Object.entries(extra.hours || {}).map(([day, h]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: day, opens: h.open, closes: h.close }));
  if (specs.length) s.openingHoursSpecification = specs;
  return s;
}

function checks(loc, extra, schema) {
  const a = loc.address || {};
  const list = [
    { ok: !!(a.address1 && a.city && a.zip && a.countryCode), label: 'Full street address, city, postcode and country', fix: 'Complete the address for this location in Shopify under Settings, Locations.' },
    { ok: !!(extra.phone || a.phone), label: 'Phone number', fix: 'Add a phone number below.' },
    { ok: Object.keys(extra.hours || {}).length > 0, label: 'Opening hours', fix: 'Add the days you are open below.' },
    { ok: a.latitude != null && a.longitude != null, label: 'Map position (latitude and longitude)', fix: 'Shopify has no map position for this address. It is optional, but helps Google place you.' },
    { ok: schema['@type'] !== 'LocalBusiness', label: 'A specific business type', fix: 'Pick the type that fits you best, for example Clothing store.' },
  ];
  return list;
}

async function shopInfo(shop, token) {
  const d = await gql(shop, token, `{ shop{ name primaryDomain{ url } } locations(first:20){ nodes{ id name isActive address{ address1 address2 city zip province provinceCode countryCode phone latitude longitude } } } }`);
  return { name: d.shop.name, url: d.shop.primaryDomain && d.shop.primaryDomain.url, locations: d.locations.nodes.filter((l) => l.isActive) };
}

router.get('/overview', withShop(async (req, res, { shop, token }) => {
  const site = await shopInfo(shop, token);
  const saved = load(shop);
  const locations = site.locations.map((l) => {
    const extra = saved[l.id] || {};
    const schema = buildSchema(l, extra, site);
    const list = checks(l, extra, schema);
    return { id: l.id, name: l.name, address: l.address, extra: { type: extra.type || '', phone: extra.phone || '', priceRange: extra.priceRange || '', hours: extra.hours || {} }, schema, checks: list, passed: list.filter((c) => c.ok).length };
  });
  res.json({ ok: true, shopName: site.name, siteUrl: site.url || '', types: TYPES, days: DAYS, locations });
}));

router.put('/locations/:id', withShop(async (req, res, { shop, token }) => {
  const id = decodeURIComponent(req.params.id);
  if (!/^gid:\/\/shopify\/Location\/\d+$/.test(id)) return res.status(400).json({ ok: false, error: 'Unknown location.' });
  const site = await shopInfo(shop, token);
  if (!site.locations.some((l) => l.id === id)) return res.status(404).json({ ok: false, error: 'That location was not found in your store.' });
  const b = req.body || {};
  const phone = String(b.phone || '').trim();
  if (phone && !/^[+()\d\s.-]{6,25}$/.test(phone)) return res.status(400).json({ ok: false, error: 'Enter the phone number with digits only, for example +44 20 7946 0000.' });
  const priceRange = String(b.priceRange || '').trim().slice(0, 20);
  if (b.type && !TYPES.includes(b.type)) return res.status(400).json({ ok: false, error: 'Choose a business type from the list.' });
  const all = load(shop);
  all[id] = { type: b.type || '', phone, priceRange, hours: cleanHours(b.hours) };
  store.write(TOOL, shop, all);
  res.json({ ok: true });
}));

// Looks for LocalBusiness data already on your live home page.
router.get('/site-check', withShop(async (req, res, { shop, token }) => {
  const site = await shopInfo(shop, token);
  if (!site.url) return res.status(422).json({ ok: false, error: 'Your store has no web address to check yet.' });
  let r;
  try { r = await safeFetchText(site.url, { timeoutMs: 12000, maxBytes: 1.5 * 1024 * 1024 }); } catch (e) { return res.status(422).json({ ok: false, error: `Could not open ${site.url}: ${e.message}` }); }
  if (/\/password\/?$/i.test(new URL(r.finalUrl).pathname)) return res.status(422).json({ ok: false, error: 'Your store is behind a password, so the page cannot be read. Check again once it is live.' });
  const types = [];
  for (const m of r.text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { if (n['@type']) types.push(...[].concat(n['@type'])); if (n['@graph']) walk(n['@graph']); } };
      walk(JSON.parse(m[1]));
    } catch { /* ignore invalid JSON-LD */ }
  }
  const local = types.filter((t) => TYPES.includes(t) || /Store$|Business$/.test(t));
  res.json({ ok: true, url: r.finalUrl, found: local.length > 0, types: [...new Set(types)].slice(0, 20), localTypes: [...new Set(local)] });
}));

module.exports = router;
