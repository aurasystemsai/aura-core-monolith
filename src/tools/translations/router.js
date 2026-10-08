'use strict';

// Translations: real Shopify product text translated into the store's enabled languages.
// AI writes the draft, the owner can edit it, and every save can be undone.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'translations';
const LOG = 'log';
const MODEL = 'gpt-4o-mini';
const KEYS = ['title', 'body_html', 'meta_title', 'meta_description'];
const GID = /^gid:\/\/shopify\/Product\/\d+$/;
const LOCALE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Translations needs new permissions. Open AURA from your Shopify admin and approve the updated permissions, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const bad = (status, message) => Object.assign(new Error(message), { status });

async function targetLocales(shop, token) {
  const d = await gql(shop, token, '{ shopLocales { locale name primary published } }');
  return d.shopLocales.filter((l) => !l.primary);
}

async function requireLocale(shop, token, locale) {
  if (!LOCALE.test(String(locale || ''))) throw bad(400, 'Choose a language.');
  const found = (await targetLocales(shop, token)).find((l) => l.locale === locale);
  if (!found) throw bad(400, 'That language is not enabled in your store. Add it under Settings, Languages in Shopify first.');
  return found;
}

const LIST = `query($first:Int!, $after:String, $locale:String!) { translatableResources(resourceType: PRODUCT, first: $first, after: $after) {
  pageInfo { hasNextPage endCursor }
  nodes { resourceId translatableContent { key value digest } translations(locale: $locale) { key value outdated } } } }`;

const ONE = `query($id:ID!, $locale:String!) { translatableResource(resourceId: $id) {
  resourceId translatableContent { key value digest } translations(locale: $locale) { key value outdated } } }`;

const clean = (v) => String(v || '');
const sourceOf = (node) => Object.fromEntries((node.translatableContent || []).filter((c) => KEYS.includes(c.key) && clean(c.value).trim()).map((c) => [c.key, c]));

function coverage(node) {
  const src = sourceOf(node);
  const have = new Map((node.translations || []).map((t) => [t.key, t]));
  const keys = Object.keys(src);
  const done = keys.filter((k) => have.has(k) && !have.get(k).outdated && clean(have.get(k).value).trim());
  const outdated = keys.filter((k) => have.has(k) && have.get(k).outdated);
  return { total: keys.length, done: done.length, outdated: outdated.length, title: clean(src.title && src.title.value) };
}

router.get('/status', withShop(async (req, res, { shop, token }) => {
  res.json({ ok: true, locales: await targetLocales(shop, token) });
}));

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const locale = String(req.query.locale || '');
  await requireLocale(shop, token, locale);
  const after = req.query.after ? String(req.query.after) : null;
  const d = await gql(shop, token, LIST, { first: 50, after, locale });
  const r = d.translatableResources;
  const products = r.nodes.map((n) => ({ id: n.resourceId, ...coverage(n) })).filter((p) => p.total > 0);
  res.json({ ok: true, locale, products, next: r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null });
}));

const stripUnsafe = (html) => String(html || '')
  .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript:/gi, '');

// Writes a draft translation. Charged only when AI really answers.
router.post('/suggest', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const id = String((req.body && req.body.id) || '');
  if (!GID.test(id)) return res.status(400).json({ ok: false, error: 'Choose a product.' });
  const lang = await requireLocale(shop, token, req.body && req.body.locale);
  const d = await gql(shop, token, ONE, { id, locale: lang.locale });
  if (!d.translatableResource) return res.status(404).json({ ok: false, error: 'That product was not found.' });
  const src = sourceOf(d.translatableResource);
  if (!Object.keys(src).length) return res.status(400).json({ ok: false, error: 'This product has no text to translate.' });
  const input = Object.fromEntries(Object.entries(src).map(([k, c]) => [k, c.value.slice(0, 6000)]));
  let out;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.2, max_tokens: 3000, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You translate online-shop product text into ${lang.name} (${lang.locale}). Translate faithfully: never add, remove or change facts, sizes, numbers, brand names or claims. Keep every HTML tag and attribute exactly as given and translate only the visible text. Keep brand and product model names untranslated. Reply as JSON with exactly the same keys as the input.` },
        { role: 'user', content: JSON.stringify(input) },
      ],
    });
    out = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not translate: ${e.message}` });
  }
  const have = new Map((d.translatableResource.translations || []).map((t) => [t.key, t]));
  const items = Object.keys(src).map((key) => {
    let value = clean(out[key]).trim();
    if (key === 'body_html') value = stripUnsafe(value);
    if (key === 'meta_title') value = value.slice(0, 70);
    if (key === 'meta_description') value = value.slice(0, 320);
    return { key, source: src[key].value, value, current: have.has(key) ? have.get(key).value : '' };
  }).filter((i) => i.value);
  if (!items.length) return res.status(502).json({ ok: false, error: 'AI returned no translation. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'product-description' });
  res.json({ ok: true, id, locale: lang.locale, items });
}));

router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (!GID.test(String(b.id || ''))) return res.status(400).json({ ok: false, error: 'Choose a product.' });
  const lang = await requireLocale(shop, token, b.locale);
  const wanted = (Array.isArray(b.items) ? b.items : []).filter((i) => i && KEYS.includes(i.key) && clean(i.value).trim());
  if (!wanted.length) return res.status(400).json({ ok: false, error: 'There is nothing to save.' });
  if (wanted.some((i) => clean(i.value).length > 20000)) return res.status(400).json({ ok: false, error: 'A translation is too long.' });
  const d = await gql(shop, token, ONE, { id: b.id, locale: lang.locale });
  const res0 = d.translatableResource;
  if (!res0) return res.status(404).json({ ok: false, error: 'That product was not found.' });
  // Digests come from Shopify, never from the browser, so a stale or forged one cannot be used.
  const src = sourceOf(res0);
  const items = wanted.filter((i) => src[i.key]);
  if (!items.length) return res.status(400).json({ ok: false, error: 'None of those fields exist on this product.' });
  const previous = (res0.translations || []).filter((t) => items.some((i) => i.key === t.key)).map((t) => ({ key: t.key, value: t.value }));
  const translations = items.map((i) => ({ locale: lang.locale, key: i.key, value: i.key === 'body_html' ? stripUnsafe(i.value) : clean(i.value), translatableContentDigest: src[i.key].digest }));
  const m = await gql(shop, token, 'mutation($id:ID!, $t:[TranslationInput!]!){ translationsRegister(resourceId:$id, translations:$t){ translations{ key } userErrors{ message } } }', { id: b.id, t: translations });
  const errs = m.translationsRegister.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), resourceId: b.id, title: clean(src.title && src.title.value), locale: lang.locale, keys: items.map((i) => i.key), previous, reverted: false };
  const data = store.read(TOOL, shop, {});
  data[LOG] = [entry, ...(data[LOG] || [])].slice(0, 300);
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
}));

router.get('/log', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, log: store.read(TOOL, shop, {})[LOG] || [] });
}));

router.post('/revert', withShop(async (req, res, { shop, token }) => {
  const data = store.read(TOOL, shop, {});
  const entry = (data[LOG] || []).find((e) => e.id === (req.body && req.body.id));
  if (!entry) return res.status(404).json({ ok: false, error: 'Change not found.' });
  if (entry.reverted) return res.status(400).json({ ok: false, error: 'That change was already undone.' });
  const d = await gql(shop, token, ONE, { id: entry.resourceId, locale: entry.locale });
  const src = d.translatableResource ? sourceOf(d.translatableResource) : {};
  const had = new Map(entry.previous.map((p) => [p.key, p.value]));
  const restore = entry.keys.filter((k) => had.has(k) && src[k]).map((k) => ({ locale: entry.locale, key: k, value: had.get(k), translatableContentDigest: src[k].digest }));
  const remove = entry.keys.filter((k) => !restore.some((r) => r.key === k));
  if (restore.length) {
    const m = await gql(shop, token, 'mutation($id:ID!, $t:[TranslationInput!]!){ translationsRegister(resourceId:$id, translations:$t){ userErrors{ message } } }', { id: entry.resourceId, t: restore });
    const errs = m.translationsRegister.userErrors || [];
    if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  }
  if (remove.length) {
    const m = await gql(shop, token, 'mutation($id:ID!, $k:[String!]!, $l:[String!]!){ translationsRemove(resourceId:$id, translationKeys:$k, locales:$l){ userErrors{ message } } }', { id: entry.resourceId, k: remove, l: [entry.locale] });
    const errs = m.translationsRemove.userErrors || [];
    if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  }
  entry.reverted = true; entry.revertedAt = new Date().toISOString();
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
}));

module.exports = router;
module.exports._stripUnsafe = stripUnsafe;
module.exports._coverage = coverage;