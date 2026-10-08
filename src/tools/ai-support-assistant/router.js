// Support Assistant: a per-shop support inbox plus a knowledge base (your policies and FAQs). AI triages each
// message and drafts a reply using ONLY your knowledge base. If nothing in it covers the question, the draft says
// so and the ticket is flagged for a human. Nothing is sent to customers from here; you copy the reply out.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TICKETS = 'support-tickets';
const KB = 'support-kb';
const STATUSES = ['open', 'waiting', 'resolved'];
const STOP = new Set(['the', 'and', 'for', 'with', 'you', 'your', 'our', 'are', 'how', 'can', 'what', 'when', 'was', 'not', 'have', 'has', 'any', 'this', 'that', 'from', 'about', 'please', 'would', 'could']);

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const tokens = (t) => new Set(String(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '') || w));
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };

// Best knowledge-base entries for a message, by shared words. Zero-overlap entries are never returned.
function matchKb(kb, text, limit = 3) {
  const q = tokens(text);
  return kb.map((e) => {
    const t = tokens(e.title + ' ' + e.body); const tw = tokens(e.title);
    let s = 0; q.forEach((w) => { if (t.has(w)) s += tw.has(w) ? 2 : 1; });
    return { e, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
}

router.get('/state', withShop(async (req, res, { shop }) => {
  const tickets = store.read(TICKETS, shop, []); const kb = store.read(KB, shop, []);
  res.json({ ok: true, ai: !!getOpenAIClient(), tickets, kb, summary: { open: tickets.filter((t) => t.status === 'open').length, needsHuman: tickets.filter((t) => t.status !== 'resolved' && t.needsHuman).length, kbEntries: kb.length } });
}));

router.post('/kb', withShop(async (req, res, { shop }) => {
  const title = clean((req.body || {}).title, 150); const body = clean((req.body || {}).body, 4000);
  if (!title || !body) return res.status(400).json({ ok: false, error: 'Title and answer are both required.' });
  const entry = { id: crypto.randomUUID(), title, body, createdAt: new Date().toISOString() };
  store.write(KB, shop, [entry, ...store.read(KB, shop, [])].slice(0, 200));
  res.json({ ok: true, entry });
}));

router.delete('/kb/:id', withShop(async (req, res, { shop }) => {
  const kb = store.read(KB, shop, []);
  store.write(KB, shop, kb.filter((e) => e.id !== req.params.id));
  res.json({ ok: true });
}));

// Pull your real store pages (shipping, returns, FAQ...) in as knowledge.
router.post('/kb/import-pages', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, '{ pages(first: 50) { nodes { id title body } } }');
  const kb = store.read(KB, shop, []);
  const have = new Set(kb.map((e) => e.source).filter(Boolean));
  const added = [];
  d.pages.nodes.forEach((p) => {
    const text = clean(String(p.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), 4000);
    if (!text || have.has(p.id)) return;
    added.push({ id: crypto.randomUUID(), title: clean(p.title, 150), body: text, source: p.id, createdAt: new Date().toISOString() });
  });
  store.write(KB, shop, [...added, ...kb].slice(0, 200));
  res.json({ ok: true, added: added.length, skipped: d.pages.nodes.length - added.length });
}));

router.post('/tickets', withShop(async (req, res, { shop }) => {
  const message = clean((req.body || {}).message, 5000);
  if (!message) return res.status(400).json({ ok: false, error: 'The customer message is required.' });
  const t = { id: crypto.randomUUID(), customer: clean(req.body.customer, 120) || 'Customer', subject: clean(req.body.subject, 200) || message.slice(0, 60), message, status: 'open', category: '', urgency: '', needsHuman: false, reply: '', createdAt: new Date().toISOString() };
  store.write(TICKETS, shop, [t, ...store.read(TICKETS, shop, [])].slice(0, 500));
  res.json({ ok: true, ticket: t });
}));

router.patch('/tickets/:id', withShop(async (req, res, { shop }) => {
  const list = store.read(TICKETS, shop, []); const t = list.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ ok: false, error: 'Ticket not found.' });
  const b = req.body || {};
  if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return res.status(400).json({ ok: false, error: 'Status must be open, waiting or resolved.' }); t.status = b.status; }
  if (b.reply !== undefined) t.reply = clean(b.reply, 5000);
  store.write(TICKETS, shop, list);
  res.json({ ok: true, ticket: t });
}));

router.delete('/tickets/:id', withShop(async (req, res, { shop }) => {
  store.write(TICKETS, shop, store.read(TICKETS, shop, []).filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

router.post('/tickets/:id/draft', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const list = store.read(TICKETS, shop, []); const t = list.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ ok: false, error: 'Ticket not found.' });
  const used = matchKb(store.read(KB, shop, []), t.subject + ' ' + t.message);
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 600, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You help a small shop answer customers. Return JSON {"category":"shipping|returns|order|product|payment|other","urgency":"low|normal|high","answerable":boolean,"reply":string}. Write the reply ONLY from the provided knowledge. If the knowledge does not answer the question, set answerable to false and write a short polite holding reply that promises a follow-up; never invent policies, dates, prices or order details. Do not mention the knowledge base.' },
      { role: 'user', content: JSON.stringify({ customerMessage: t.message, knowledge: used.map((e) => ({ title: e.title, text: e.body.slice(0, 1500) })) }) },
    ],
  });
  const o = parseJson(out.choices[0].message.content);
  if (!o) return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  t.category = clean(o.category, 20); t.urgency = ['low', 'normal', 'high'].includes(o.urgency) ? o.urgency : 'normal';
  t.needsHuman = used.length === 0 || o.answerable === false; t.reply = clean(o.reply, 5000);
  store.write(TICKETS, shop, list);
  res.json({ ok: true, ticket: t, usedKnowledge: used.map((e) => e.title) });
}));

module.exports = router;
module.exports._matchKb = matchKb;

