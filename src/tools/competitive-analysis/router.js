'use strict';

// Competitive analysis: reads a competitor's public page and your own page, and compares what is
// actually on them (title, description, headings, schema, images, speed). No third-party estimates.
// The AI summary is optional and the only step that costs credits.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { safeFetchText } = require('../../core/safeFetch');

const router = express.Router();
const MODEL = 'gpt-4o-mini';

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

function toUrl(input) {
  let s = String(input || '').trim();
  if (!s || s.length > 500) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.toString() : null; } catch (e) { return null; }
}

const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const strip = (h) => decode(h.replace(/<[^>]*>/g, ' '));
const meta = (html, re) => { const m = html.match(re); return m ? decode(m[1]) : ''; };

// Pulls the on-page signals that search engines read, straight from the HTML.
function signals(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ');
  const heads = (tag) => [...body.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map((m) => strip(m[1])).filter(Boolean);
  const types = new Set();
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => { if (Array.isArray(n)) return n.forEach(walk); if (n && typeof n === 'object') { [].concat(n['@type'] || []).forEach((t) => types.add(String(t))); walk(n['@graph']); } };
      walk(JSON.parse(m[1]));
    } catch (e) { /* ignore broken JSON-LD */ }
  }
  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const withAlt = imgs.filter((t) => /\balt=["'][^"']+["']/i.test(t)).length;
  const text = strip(body);
  const title = meta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = meta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || meta(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const h1 = heads('h1');
  const h2 = heads('h2');
  return {
    title, titleLength: title.length,
    description, descriptionLength: description.length,
    canonical: meta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    ogImage: !!meta(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i),
    h1, h2: h2.slice(0, 12), h2Count: h2.length,
    schemaTypes: [...types].sort(),
    images: imgs.length, imagesWithAlt: withAlt,
    words: text ? text.split(' ').length : 0,
    internalLinks: (body.match(/<a\b[^>]+href=["'](?:\/|#)/gi) || []).length,
  };
}

async function read(url) {
  const r = await safeFetchText(url, { timeoutMs: 12000, maxBytes: 1.5 * 1024 * 1024 });
  if (/\/password\/?$/i.test(new URL(r.finalUrl).pathname)) { const e = new Error('That page is behind a password, so nothing can be read. Use your live store address.'); e.status = 422; throw e; }
  if (r.status >= 400) { const e = new Error(`${new URL(url).hostname} returned an error (${r.status}).`); e.status = 422; throw e; }
  if (!/<html|<head|<body/i.test(r.text)) { const e = new Error('That address did not return a web page.'); e.status = 422; throw e; }
  return { url: r.finalUrl, ms: r.ms, status: r.status, bytes: Buffer.byteLength(r.text), ...signals(r.text) };
}

function fail(res, err, which) {
  const m = /private|blocked|not allowed|invalid/i.test(err.message) ? 'That address cannot be read.' : err.message;
  return res.status(err.status || 422).json({ ok: false, error: `${which}: ${m}` });
}

// What the two pages show, plus plain observations that follow from the numbers.
function observe(mine, theirs) {
  const out = [];
  const add = (level, text) => out.push({ level, text });
  if (!mine.title) add('fix', 'Your page has no title.');
  else if (mine.titleLength > 60) add('fix', `Your title is ${mine.titleLength} characters, so it may be cut off in search results (about 60 fits).`);
  if (!mine.description) add('fix', 'Your page has no meta description.');
  else if (mine.descriptionLength > 160) add('fix', `Your description is ${mine.descriptionLength} characters, so it may be cut off (about 160 fits).`);
  if (mine.h1.length !== 1) add('fix', mine.h1.length ? `Your page has ${mine.h1.length} main headings; one is the usual.` : 'Your page has no main heading (H1).');
  const missing = theirs.schemaTypes.filter((t) => !mine.schemaTypes.includes(t));
  if (missing.length) add('gap', `They mark up ${missing.join(', ')} for search engines and you do not.`);
  if (theirs.words > mine.words * 1.5 && theirs.words - mine.words > 150) add('gap', `They have about ${theirs.words} words on the page against your ${mine.words}.`);
  if (mine.images && mine.imagesWithAlt / mine.images < 0.9) add('fix', `${mine.images - mine.imagesWithAlt} of your ${mine.images} images have no alt text.`);
  if (mine.ms > theirs.ms * 1.5 && mine.ms - theirs.ms > 400) add('gap', `Your page took ${mine.ms} ms to respond against their ${theirs.ms} ms.`);
  if (mine.h2Count < theirs.h2Count) add('gap', `They split the page into ${theirs.h2Count} sections (H2) and you have ${mine.h2Count}.`);
  if (!mine.ogImage) add('fix', 'Your page has no share image, so links look plain on social media.');
  if (!out.length) add('good', 'Nothing stands out. Your page covers the same basics as theirs.');
  return out;
}

router.post('/compare', withShop(async (req, res, { shop }) => {
  const body = req.body || {};
  const theirsUrl = toUrl(body.competitor);
  if (!theirsUrl) return res.status(400).json({ ok: false, error: 'Enter the competitor page address, for example example.com/products/shoes.' });
  const mineUrl = toUrl(body.mine) || `https://${shop}`;
  let theirs;
  let mine;
  try { theirs = await read(theirsUrl); } catch (e) { return fail(res, e, 'Competitor'); }
  try { mine = await read(mineUrl); } catch (e) { return fail(res, e, 'Your page'); }
  res.json({ ok: true, mine, theirs, observations: observe(mine, theirs) });
}));

router.post('/advice', withShop(async (req, res) => {
  const { mine, theirs } = req.body || {};
  const okSide = (s) => s && typeof s === 'object' && typeof s.title === 'string';
  if (!okSide(mine) || !okSide(theirs)) return res.status(400).json({ ok: false, error: 'Compare two pages first.' });
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not available right now. The comparison above still stands.' });
  const brief = (s) => JSON.stringify({ title: String(s.title).slice(0, 200), description: String(s.description || '').slice(0, 300), h1: [].concat(s.h1 || []).slice(0, 3), h2: [].concat(s.h2 || []).slice(0, 10), schema: [].concat(s.schemaTypes || []).slice(0, 15), words: Number(s.words) || 0 });
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 450,
    messages: [{ role: 'user', content: `You compare two web pages for a Shopify store owner. Use only the facts below, do not invent traffic, rankings or keywords. Give 4 to 5 short, specific changes the owner could make to their own page, most useful first, one per line starting with "- ".\n\nMY PAGE: ${brief(mine)}\n\nCOMPETITOR PAGE: ${brief(theirs)}` }],
  });
  const tips = String(resp.choices[0].message.content || '').split('\n').map((l) => l.replace(/^[-*\d.\s]+/, '').trim()).filter((l) => l.length > 10).slice(0, 6);
  if (!tips.length) return res.status(502).json({ ok: false, error: 'AI did not return usable advice. Try again, you were not charged.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'competitive-analysis' });
  res.json({ ok: true, tips });
}));

module.exports = router;
