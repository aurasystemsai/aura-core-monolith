'use strict';

// Purchase orders for Inventory & Cash (the Stocky replacement). Orders are stored per shop; Shopify is only
// changed when the merchant receives stock, and only after Shopify accepts it. Receiving adds the counted
// quantity to Shopify stock and can write the unit cost back so Profit Analytics has real costs.
const crypto = require('crypto');
const store = require('../../core/shopStore');
const mailer = require('../../core/mailer');

const KEY = 'inventory-pos';
const MAX_POS = 500;
const MAX_LINES = 200;
const VARIANT = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const round = (n) => Math.round(n * 100) / 100;

function normaliseLines(raw) {
  const lines = []; const seen = new Set();
  for (const l of Array.isArray(raw) ? raw.slice(0, MAX_LINES) : []) {
    const variantId = String((l && l.variantId) || '');
    const qty = Math.floor(Number(l && l.qty));
    const unitCost = l && l.unitCost !== '' && l.unitCost != null ? Number(l.unitCost) : null;
    if (!VARIANT.test(variantId) || seen.has(variantId)) return { error: 'Each line needs a valid, unique product variant.' };
    if (!Number.isFinite(qty) || qty < 1 || qty > 100000) return { error: 'Quantities must be whole numbers from 1 to 100,000.' };
    if (unitCost != null && (!Number.isFinite(unitCost) || unitCost < 0 || unitCost > 1000000)) return { error: 'A unit cost looks wrong.' };
    seen.add(variantId);
    lines.push({ variantId, title: clean(l.title, 200), sku: clean(l.sku, 80), qty, received: 0, unitCost: unitCost == null ? null : round(unitCost) });
  }
  if (!lines.length) return { error: 'Add at least one item.' };
  return { lines };
}

const statusOf = (po) => {
  if (po.status === 'cancelled') return 'cancelled';
  const got = po.lines.reduce((n, l) => n + l.received, 0);
  const want = po.lines.reduce((n, l) => n + l.qty, 0);
  if (got >= want) return 'received';
  if (got > 0) return 'partial';
  return po.sentAt ? 'sent' : 'draft';
};
const view = (po) => ({ ...po, status: statusOf(po), total: round(po.lines.reduce((n, l) => n + (l.unitCost || 0) * l.qty, 0)), costMissing: po.lines.some((l) => l.unitCost == null) });

function emailHtml(po, supplier, shopName) {
  const rows = po.lines.map((l) => `<tr><td>${mailer.esc(l.title)}</td><td>${mailer.esc(l.sku)}</td><td style="text-align:right">${l.qty}</td></tr>`).join('');
  const note = po.note ? `<p>${mailer.esc(po.note)}</p>` : '';
  const due = po.expectedDate ? `<p>Please deliver by ${mailer.esc(po.expectedDate)}.</p>` : '';
  return `<p>Hello ${mailer.esc(supplier.name)},</p><p>Please find purchase order <strong>${mailer.esc(po.number)}</strong> from ${mailer.esc(shopName)}.</p>`
    + `<table cellpadding="6" style="border-collapse:collapse"><tr><th align="left">Item</th><th align="left">SKU</th><th align="right">Qty</th></tr>${rows}</table>${due}${note}<p>Thank you.</p>`;
}

async function adjustStock(gql, shop, token, line, qty, updateCost) {
  const d = await gql(shop, token, 'query($id:ID!){ productVariant(id:$id){ inventoryItem{ id inventoryLevels(first:1){ nodes{ location{ id } } } } } }', { id: line.variantId });
  const item = d.productVariant && d.productVariant.inventoryItem;
  const location = item && item.inventoryLevels.nodes[0] && item.inventoryLevels.nodes[0].location.id;
  if (!item || !location) throw Object.assign(new Error(`${line.title || line.variantId} is not stocked at a location in Shopify.`), { status: 409 });
  const m = await gql(shop, token,
    'mutation($input:InventoryAdjustQuantitiesInput!){ inventoryAdjustQuantities(input:$input){ userErrors{ message } } }',
    { input: { name: 'available', reason: 'received', changes: [{ inventoryItemId: item.id, locationId: location, delta: qty }] } });
  const errs = m.inventoryAdjustQuantities.userErrors;
  if (errs && errs.length) throw Object.assign(new Error(errs[0].message), { status: 422 });
  let costSaved = false;
  if (updateCost && line.unitCost != null) {
    const c = await gql(shop, token, 'mutation($id:ID!,$input:InventoryItemInput!){ inventoryItemUpdate(id:$id,input:$input){ userErrors{ message } } }', { id: item.id, input: { cost: String(line.unitCost) } });
    costSaved = !(c.inventoryItemUpdate.userErrors || []).length;
  }
  return costSaved;
}

function mount(router, { withShop, gql }) {
  const read = (shop) => store.read(KEY, shop, []);
  const write = (shop, v) => store.write(KEY, shop, v);
  const supplierOf = (shop, id) => store.read('inventory-suppliers', shop, []).find((s) => s.id === id);

  router.get('/pos', withShop(async (req, res, { shop }) => {
    res.json({ ok: true, orders: read(shop).map(view), mailer: mailer.isConfigured() });
  }));

  router.post('/pos', withShop(async (req, res, { shop }) => {
    const b = req.body || {};
    const sup = supplierOf(shop, b.supplierId);
    if (!sup) return res.status(404).json({ ok: false, error: 'Choose one of your suppliers.' });
    const n = normaliseLines(b.lines);
    if (n.error) return res.status(400).json({ ok: false, error: n.error });
    const all = read(shop);
    const seq = all.reduce((m, p) => Math.max(m, Number(String(p.number).replace(/\D/g, '')) || 0), 0) + 1;
    const exp = clean(b.expectedDate, 10);
    if (exp && !/^\d{4}-\d{2}-\d{2}$/.test(exp)) return res.status(400).json({ ok: false, error: 'Expected date must look like 2026-12-31.' });
    const po = {
      id: crypto.randomUUID(), number: `PO-${String(seq).padStart(4, '0')}`, supplierId: sup.id, supplierName: sup.name, lines: n.lines,
      note: clean(b.note, 500), expectedDate: exp, createdAt: new Date().toISOString(), sentAt: null, status: 'open',
    };
    write(shop, [po, ...all].slice(0, MAX_POS));
    res.json({ ok: true, order: view(po) });
  }));

  const find = (shop, id) => { const all = read(shop); return { all, po: all.find((p) => p.id === id) }; };

  router.put('/pos/:id', withShop(async (req, res, { shop }) => {
    const { all, po } = find(shop, req.params.id);
    if (!po) return res.status(404).json({ ok: false, error: 'Purchase order not found.' });
    if (statusOf(po) !== 'draft') return res.status(409).json({ ok: false, error: 'Only a draft can be edited.' });
    const b = req.body || {};
    const n = normaliseLines(b.lines);
    if (n.error) return res.status(400).json({ ok: false, error: n.error });
    po.lines = n.lines; po.note = clean(b.note, 500);
    write(shop, all);
    res.json({ ok: true, order: view(po) });
  }));

  router.post('/pos/:id/send', withShop(async (req, res, { shop }) => {
    const { all, po } = find(shop, req.params.id);
    if (!po) return res.status(404).json({ ok: false, error: 'Purchase order not found.' });
    if (statusOf(po) === 'cancelled' || statusOf(po) === 'received') return res.status(409).json({ ok: false, error: 'This order is closed.' });
    const sup = supplierOf(shop, po.supplierId);
    if (!sup || !sup.email) return res.status(400).json({ ok: false, error: 'Add an email address to this supplier first.' });
    if (!mailer.isConfigured()) return res.status(503).json({ ok: false, error: 'Email is not set up on the server yet, so nothing was sent.' });
    await mailer.sendEmail({ to: sup.email, subject: `Purchase order ${po.number}`, html: emailHtml(po, sup, shop.replace('.myshopify.com', '')) });
    po.sentAt = new Date().toISOString();
    write(shop, all);
    res.json({ ok: true, order: view(po) });
  }));

  router.post('/pos/:id/cancel', withShop(async (req, res, { shop }) => {
    const { all, po } = find(shop, req.params.id);
    if (!po) return res.status(404).json({ ok: false, error: 'Purchase order not found.' });
    if (po.lines.some((l) => l.received > 0)) return res.status(409).json({ ok: false, error: 'Stock was already received on this order, so it cannot be cancelled.' });
    po.status = 'cancelled';
    write(shop, all);
    res.json({ ok: true, order: view(po) });
  }));

  router.delete('/pos/:id', withShop(async (req, res, { shop }) => {
    const { all, po } = find(shop, req.params.id);
    if (!po) return res.status(404).json({ ok: false, error: 'Purchase order not found.' });
    if (statusOf(po) !== 'draft' && statusOf(po) !== 'cancelled') return res.status(409).json({ ok: false, error: 'Only a draft or cancelled order can be deleted.' });
    write(shop, all.filter((p) => p.id !== po.id));
    res.json({ ok: true });
  }));

  // Receive stock: each line is added to Shopify first, and recorded here only once Shopify accepts it.
  router.post('/pos/:id/receive', withShop(async (req, res, { shop, token }) => {
    const { all, po } = find(shop, req.params.id);
    if (!po) return res.status(404).json({ ok: false, error: 'Purchase order not found.' });
    if (statusOf(po) === 'cancelled') return res.status(409).json({ ok: false, error: 'This order was cancelled.' });
    const b = req.body || {};
    const todo = [];
    for (const r of Array.isArray(b.receipts) ? b.receipts : []) {
      const line = po.lines.find((l) => l.variantId === (r && r.variantId));
      const qty = Math.floor(Number(r && r.qty));
      if (!line || !Number.isFinite(qty) || qty < 1) continue;
      if (qty > line.qty - line.received) return res.status(400).json({ ok: false, error: `Only ${line.qty - line.received} left to receive for ${line.title || 'that item'}.` });
      todo.push({ line, qty });
    }
    if (!todo.length) return res.status(400).json({ ok: false, error: 'Enter a quantity to receive.' });
    const done = []; let failure = null;
    for (const t of todo) {
      try {
        const costSaved = await adjustStock(gql, shop, token, t.line, t.qty, b.updateCost === true);
        t.line.received += t.qty;
        done.push({ variantId: t.line.variantId, qty: t.qty, costSaved });
      } catch (e) { failure = e; break; }
    }
    if (done.length) write(shop, all);
    if (failure) {
      const scope = /access denied|required access/i.test(failure.message);
      return res.status(scope ? 403 : failure.status || 500).json({
        ok: false, needsScopes: scope, received: done, order: view(po),
        error: scope ? 'Receiving stock needs inventory permission. Approve the updated permissions for AURA in your Shopify admin, then try again.' : failure.message,
      });
    }
    res.json({ ok: true, received: done, order: view(po) });
  }));
}

module.exports = { mount, _normaliseLines: normaliseLines, _statusOf: statusOf };
