'use strict';

// Self-serve help for merchants: a contact form that lands in the owner's inbox, plus data export and deletion.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../core/shopContext');
const store = require('../core/shopStore');
const privacy = require('../core/dataPrivacy');
const mailer = require('../core/mailer');

const router = express.Router();
const INBOX_CAP = 500;
const MAX_PER_HOUR = 5;
const sent = new Map();
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ').trim().slice(0, n);
const SECRET_KEY = /token|secret|password|api[-_]?key|authorization/i;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

function tooMany(shop) {
  const now = Date.now();
  const recent = (sent.get(shop) || []).filter((t) => now - t < 3600 * 1000);
  sent.set(shop, recent);
  if (recent.length >= MAX_PER_HOUR) return true;
  recent.push(now);
  return false;
}

// Keeps what the merchant created but never credentials stored next to it.
function withoutSecrets(node) {
  if (Array.isArray(node)) return node.map(withoutSecrets);
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).filter(([k]) => !SECRET_KEY.test(k)).map(([k, v]) => [k, withoutSecrets(v)]));
  }
  return node;
}

router.post('/contact', withShop(async (req, res, { shop }) => {
  const message = clean(req.body && req.body.message, 4000);
  const subject = clean(req.body && req.body.subject, 120) || 'Help request';
  const email = clean(req.body && req.body.email, 254);
  if (message.length < 10) return res.status(400).json({ ok: false, error: 'Tell us a little more so we can help (at least 10 characters).' });
  if (email && !mailer.isEmail(email)) return res.status(400).json({ ok: false, error: 'That email address does not look right.' });
  if (tooMany(shop)) return res.status(429).json({ ok: false, error: 'You have sent a few requests already. Please wait an hour or reply to the earlier email.' });

  const entry = { id: crypto.randomUUID(), shop, email, subject, message, tool: clean(req.body && req.body.tool, 60), at: new Date().toISOString() };
  store.pushCapped('support-inbox', 'all', entry, INBOX_CAP);

  let emailed = false;
  const to = process.env.SUPPORT_EMAIL;
  if (to && mailer.isEmail(to)) {
    try {
      const r = await mailer.sendEmail({
        to, replyTo: email || undefined, subject: `[AURA help] ${subject} (${shop})`,
        html: `<p><b>Shop:</b> ${mailer.esc(shop)}<br><b>Reply to:</b> ${mailer.esc(email || 'not given')}<br><b>Tool:</b> ${mailer.esc(entry.tool || 'n/a')}</p><p>${mailer.esc(message).replace(/\n/g, '<br>')}</p>`,
      });
      emailed = !!r.sent;
    } catch (err) { console.error('[help] could not email support request:', err.message); }
  }
  res.json({ ok: true, id: entry.id, emailed });
}));

// Which setup steps this shop has really done, worked out from what it has saved.
const SETUP_FILES = {
  seoFix: ['product-seo-history', 'product-feed', 'image-alt-media-seo', 'translations'],
  storefront: ['size-guides', 'popups', 'back-in-stock'],
};
router.get('/setup', withShop(async (req, res, { shop }) => {
  const names = privacy.shopFiles(shop).map((f) => require('path').basename(f).toLowerCase());
  const has = (tools) => tools.some((t) => names.some((n) => n.startsWith(`${t}-`)));
  res.json({ ok: true, steps: { connected: true, seoFix: has(SETUP_FILES.seoFix), storefront: has(SETUP_FILES.storefront) } });
}));

// Everything stored for this shop, one JSON download, without credentials.
router.get('/my-data', withShop(async (req, res, { shop }) => {
  const fs = require('fs');
  const path = require('path');
  const out = { shop, exportedAt: new Date().toISOString(), files: {} };
  privacy.shopFiles(shop).forEach((f) => {
    try { out.files[path.basename(f).replace(/\.json$/i, '')] = withoutSecrets(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { /* unreadable file is skipped */ }
  });
  res.setHeader('Content-Disposition', `attachment; filename="aura-data-${shop}.json"`);
  res.json({ ok: true, ...out });
}));

// The shop must type its own domain, so a stray click cannot wipe its data. The Shopify connection stays in place.
router.post('/delete-my-data', withShop(async (req, res, { shop }) => {
  if (clean(req.body && req.body.confirm, 120).toLowerCase() !== shop) {
    return res.status(400).json({ ok: false, error: `Type ${shop} to confirm.` });
  }
  res.json({ ok: true, files_deleted: privacy.deleteShopData(shop) });
}));

module.exports = router;
