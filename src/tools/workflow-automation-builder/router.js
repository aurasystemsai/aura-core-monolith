// Automations: simple "when this is true in my store, do that" rules. Each rule checks real Shopify data
// (low stock, lapsed customers, big orders, new orders) and then either emails you a summary or tags the
// matching customers/products in Shopify. Rules run when you press Run (or call /run-all); there is no
// background scheduler yet, so nothing happens by itself. AI only suggests rule ideas from your own store numbers.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const mailer = require('../../core/mailer');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TOOL = 'workflow-automation-builder';
const RULES = 'automation-rules';
const RUNS = 'automation-runs';
const DAY = 86400000;
const MAX_RULES = 50;
const MAX_MATCHES = 250;

const TRIGGERS = {
  low_stock: { label: 'Product stock is low', param: 'Stock at or below', def: 5, kind: 'product' },
  lapsed_customers: { label: 'Customer has not ordered for a while', param: 'Days since last order', def: 90, kind: 'customer' },
  big_order: { label: 'Order total is large (last 7 days)', param: 'Order total at least', def: 200, kind: 'order' },
  new_orders: { label: 'New orders (last 24 hours)', param: 'At least this many orders', def: 1, kind: 'order' },
};
const ACTIONS = { email_me: 'Email me a summary', tag: 'Tag the matches in Shopify' };

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

function validate(body) {
  const trigger = clean(body.trigger, 40);
  if (!TRIGGERS[trigger]) return { error: 'Choose a trigger.' };
  const action = clean(body.action, 20);
  if (!ACTIONS[action]) return { error: 'Choose an action.' };
  const name = clean(body.name, 80) || TRIGGERS[trigger].label;
  const threshold = body.threshold === '' || body.threshold == null ? TRIGGERS[trigger].def : num(body.threshold);
  if (threshold < 0 || threshold > 1000000) return { error: 'Threshold is out of range.' };
  const rule = { name, trigger, threshold, action };
  if (action === 'email_me') {
    const email = clean(body.email, 200);
    if (!mailer.isEmail(email)) return { error: 'Enter the email address to send the summary to.' };
    rule.email = email;
  } else {
    const tag = clean(body.tag, 40).replace(/[,\s]+/g, '-');
    if (!tag) return { error: 'Enter a tag name.' };
    if (TRIGGERS[trigger].kind === 'order') return { error: 'Tagging works for product and customer triggers only.' };
    rule.tag = tag;
  }
  return { rule };
}

// Each finder returns [{ id, label }] from live store data.
const finders = {
  async low_stock(shop, token, t) {
    const d = await gql(shop, token, '{ products(first: 250, query: "status:active") { nodes { id title variants(first: 100) { nodes { inventoryQuantity } } } } }');
    // Product-level totalInventory reads 0 when inventory isn't tracked, so add up the variants instead.
    return d.products.nodes
      .map((p) => ({ p, qty: p.variants.nodes.reduce((s, v) => s + Math.max(0, num(v.inventoryQuantity)), 0) }))
      .filter((x) => x.qty <= t)
      .map((x) => ({ id: x.p.id, label: `${x.p.title} (${x.qty} left)` }));
  },
  async lapsed_customers(shop, token, t, now) {
    const d = await gql(shop, token, '{ customers(first: 250) { nodes { id displayName lastOrder { createdAt: processedAt } numberOfOrders } } }');
    return d.customers.nodes
      .filter((c) => c.lastOrder && now - Date.parse(c.lastOrder.createdAt) >= t * DAY)
      .map((c) => ({ id: c.id, label: `${c.displayName || 'Customer'} (last order ${Math.floor((now - Date.parse(c.lastOrder.createdAt)) / DAY)} days ago)` }));
  },
  async big_order(shop, token, t, now) {
    const since = new Date(now - 7 * DAY).toISOString();
    const d = await gql(shop, token, 'query($f: String) { orders(first: 100, query: $f) { nodes { id name totalPriceSet { shopMoney { amount currencyCode } } } } }', { f: `processed_at:>=${since}` });
    return d.orders.nodes.filter((o) => num(o.totalPriceSet.shopMoney.amount) >= t)
      .map((o) => ({ id: o.id, label: `${o.name}: ${o.totalPriceSet.shopMoney.currencyCode} ${num(o.totalPriceSet.shopMoney.amount).toFixed(2)}` }));
  },
  async new_orders(shop, token, t, now) {
    const since = new Date(now - DAY).toISOString();
    const d = await gql(shop, token, 'query($f: String) { orders(first: 100, query: $f) { nodes { id name } } }', { f: `processed_at:>=${since}` });
    return d.orders.nodes.length >= t ? d.orders.nodes.map((o) => ({ id: o.id, label: o.name })) : [];
  },
};

async function runRule(rule, ctx, now = Date.now()) {
  const { shop, token } = ctx;
  const matches = (await finders[rule.trigger](shop, token, rule.threshold, now)).slice(0, MAX_MATCHES);
  const run = { id: crypto.randomUUID(), ruleId: rule.id, name: rule.name, at: new Date(now).toISOString(), matched: matches.length, preview: matches.slice(0, 10).map((m) => m.label), action: rule.action, outcome: '' };
  if (!matches.length) { run.outcome = 'Nothing matched, so nothing was done.'; return run; }
  if (rule.action === 'email_me') {
    const list = matches.slice(0, 50).map((m) => `<li>${mailer.esc(m.label)}</li>`).join('');
    const r = await mailer.sendEmail({ to: rule.email, subject: `AURA: ${rule.name} (${matches.length})`, html: `<p>${matches.length} matched "${mailer.esc(rule.name)}":</p><ul>${list}</ul>` });
    run.outcome = r.sent ? `Emailed ${rule.email}.` : `Email is not set up on this server, so nothing was sent (${rule.email}).`;
    run.dryRun = !r.sent;
  } else {
    let done = 0; let failed = 0;
    for (const m of matches) {
      try {
        const d = await gql(shop, token, 'mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }', { id: m.id, tags: [rule.tag] });
        if (d.tagsAdd.userErrors && d.tagsAdd.userErrors.length) failed++; else done++;
      } catch (e) { failed++; }
    }
    run.outcome = `Tagged ${done} with "${rule.tag}"${failed ? `, ${failed} failed (check the app has write access)` : ''}.`;
  }
  return run;
}

router.get('/meta', withShop(async (req, res) => {
  res.json({ ok: true, triggers: TRIGGERS, actions: ACTIONS, ai: !!process.env.OPENAI_API_KEY, scheduler: false });
}));

router.get('/rules', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, rules: store.read(TOOL, shop, {})[RULES] || [], runs: store.read(TOOL, shop, {})[RUNS] || [] });
}));

router.post('/rules', withShop(async (req, res, { shop }) => {
  const v = validate(req.body || {});
  if (v.error) return res.status(400).json({ ok: false, error: v.error });
  const data = store.read(TOOL, shop, {});
  const rules = data[RULES] || [];
  if (rules.length >= MAX_RULES) return res.status(400).json({ ok: false, error: `You can have up to ${MAX_RULES} rules.` });
  const rule = { id: crypto.randomUUID(), ...v.rule, createdAt: new Date().toISOString() };
  data[RULES] = [...rules, rule];
  store.write(TOOL, shop, data);
  res.json({ ok: true, rule });
}));

router.delete('/rules/:id', withShop(async (req, res, { shop }) => {
  const data = store.read(TOOL, shop, {});
  const before = (data[RULES] || []).length;
  data[RULES] = (data[RULES] || []).filter((r) => r.id !== req.params.id);
  if (data[RULES].length === before) return res.status(404).json({ ok: false, error: 'Rule not found.' });
  store.write(TOOL, shop, data);
  res.json({ ok: true });
}));

async function execute(shop, ctx, rules) {
  const out = [];
  for (const rule of rules) {
    let run;
    try { run = await runRule(rule, ctx); } catch (e) { run = { id: crypto.randomUUID(), ruleId: rule.id, name: rule.name, at: new Date().toISOString(), matched: 0, preview: [], action: rule.action, outcome: `Failed: ${e.message}`, failed: true }; }
    out.push(run);
  }
  const data = store.read(TOOL, shop, {});
  data[RUNS] = [...out.reverse(), ...(data[RUNS] || [])].slice(0, 50);
  store.write(TOOL, shop, data);
  return data[RUNS].slice(0, out.length);
}

router.post('/rules/:id/run', withShop(async (req, res, ctx) => {
  const rule = (store.read(TOOL, ctx.shop, {})[RULES] || []).find((r) => r.id === req.params.id);
  if (!rule) return res.status(404).json({ ok: false, error: 'Rule not found.' });
  const [run] = await execute(ctx.shop, ctx, [rule]);
  res.json({ ok: true, run });
}));

router.post('/run-all', withShop(async (req, res, ctx) => {
  const rules = store.read(TOOL, ctx.shop, {})[RULES] || [];
  if (!rules.length) return res.status(400).json({ ok: false, error: 'Add a rule first.' });
  res.json({ ok: true, runs: await execute(ctx.shop, ctx, rules) });
}));

// AI looks at counts from the store and suggests which rules are worth adding.
router.post('/suggest', withShop(async (req, res, ctx) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const facts = {};
  for (const key of Object.keys(TRIGGERS)) {
    try { facts[key] = (await finders[key](ctx.shop, ctx.token, TRIGGERS[key].def, Date.now())).length; } catch (e) { facts[key] = null; }
  }
  const lines = Object.entries(facts).map(([k, n]) => `${TRIGGERS[k].label} (${TRIGGERS[k].param} ${TRIGGERS[k].def}): ${n === null ? 'unknown' : n + ' matches right now'}`).join('\n');
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 400,
    messages: [{ role: 'system', content: 'You help a small shop owner choose automation rules. Use only the numbers given. Recommend 2-3 rules from the list with one sentence each on why. Plain text, no markdown.' }, { role: 'user', content: lines }],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  res.json({ ok: true, facts, suggestion: (resp.choices[0].message.content || '').trim() });
}));

module.exports = router;
module.exports._validate = validate;
module.exports._runRule = runRule;