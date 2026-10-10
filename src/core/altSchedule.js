'use strict';

// Scheduled alt-text drafts. On the merchant's chosen schedule, AI looks at product images with missing or poor
// alt text and writes drafts. Nothing is changed in Shopify: drafts wait for the merchant to approve them.
// Credits are charged per image described, at the time the draft is written, and the job stops when credits run out.
const crypto = require('crypto');
const store = require('./shopStore');
const shopTokens = require('./shopTokens');
const credits = require('./creditLedger');
const { getOpenAIClient } = require('./openaiClient');
const alt = require('../tools/image-alt-media-seo/alt');
const webhooks = require('./webhooks');

const TOOL = 'alt-schedule';
const DAY = 24 * 60 * 60 * 1000;
const FREQUENCIES = [1, 7, 30];
const MAX_PER_RUN = 10;
const MAX_DRAFTS = 100;
const MAX_PAGES = 4;

const defaults = () => ({ enabled: false, everyDays: 7, perRun: 5, lastRun: null, lastNote: '', drafts: [] });
const load = (shop) => ({ ...defaults(), ...store.read(TOOL, shop, {}) });
const save = (shop, s) => store.write(TOOL, shop, s);

function update(shop, input) {
  const s = load(shop);
  if (input.enabled !== undefined) s.enabled = !!input.enabled;
  if (input.everyDays !== undefined) {
    const n = Number(input.everyDays);
    if (!FREQUENCIES.includes(n)) throw Object.assign(new Error('Choose daily, weekly or monthly.'), { status: 400 });
    s.everyDays = n;
  }
  if (input.perRun !== undefined) {
    const n = Math.floor(Number(input.perRun));
    if (!(n >= 1 && n <= MAX_PER_RUN)) throw Object.assign(new Error(`Choose between 1 and ${MAX_PER_RUN} images per run.`), { status: 400 });
    s.perRun = n;
  }
  save(shop, s);
  return s;
}

const isDue = (s, now) => s.enabled && (!s.lastRun || now - new Date(s.lastRun).getTime() >= s.everyDays * DAY);

async function runForShop(shop) {
  const s = load(shop);
  const finish = (note, added = 0) => { s.lastRun = new Date().toISOString(); s.lastNote = note; save(shop, s); return { ok: true, note, added }; };
  const token = shopTokens.getToken(shop);
  if (!token) return finish('Skipped: the store is not connected.');
  const client = getOpenAIClient();
  if (!client) return finish('Skipped: AI is not available right now.');

  const waiting = new Set(s.drafts.map((d) => d.mediaId));
  const todo = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES && todo.length < s.perRun; page += 1) {
    const r = await alt.loadImages(shop, token, after);
    r.images.filter((i) => i.problem && !waiting.has(i.id)).forEach((i) => { if (todo.length < s.perRun) todo.push(i); });
    if (!r.hasMore) break;
    after = r.cursor;
  }
  if (!todo.length) return finish('Nothing to fix: every image checked has good alt text.');

  let added = 0;
  let note = '';
  for (const img of todo) {
    const check = await credits.checkCredits(shop, 'alt-text', alt.MODEL);
    if (!check.allowed) { note = 'Stopped early: not enough credits.'; break; }
    try {
      const text = await alt.describeImage(client, img.url, img.productTitle);
      if (!text) continue;
      const paid = await credits.deductCredits(shop, 'alt-text', { model: alt.MODEL, source: 'schedule' });
      if (paid && paid.ok === false) { note = 'Stopped early: not enough credits.'; break; }
      s.drafts.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), mediaId: img.id, productId: img.productId, label: img.productTitle, url: img.url, from: img.alt, alt: text });
      added += 1;
      webhooks.emit(shop, 'draft.created', { tool: 'image-alt-text', draftId: s.drafts[0].id, productId: img.productId, mediaId: img.id, alt: text });
    } catch (e) {
      note = `Some images could not be read: ${e.message}`;
    }
  }
  s.drafts = s.drafts.slice(0, MAX_DRAFTS);
  return finish(note || `Wrote ${added} draft${added === 1 ? '' : 's'} for you to review.`, added);
}

async function tick(now = Date.now()) {
  const shops = Object.keys(shopTokens.loadAll() || {});
  for (const shop of shops) {
    try { if (isDue(load(shop), now)) await runForShop(shop); } catch (e) { console.error('[alt-schedule]', shop, e.message); }
  }
}

let timer = null;
function start() {
  if (timer || process.env.NODE_ENV === 'test') return;
  timer = setInterval(() => { tick().catch(() => {}); }, 60 * 60 * 1000);
  if (timer.unref) timer.unref();
}

function removeDraft(shop, id) {
  const s = load(shop);
  const draft = s.drafts.find((d) => d.id === id);
  if (draft) { s.drafts = s.drafts.filter((d) => d.id !== id); save(shop, s); }
  return draft || null;
}

module.exports = { load, update, runForShop, tick, start, removeDraft, isDue, FREQUENCIES, MAX_PER_RUN };
