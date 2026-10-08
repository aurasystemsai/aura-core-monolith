// Email Deliverability: real DNS checks (SPF, DKIM, DMARC, MX) for the store's domains and any domain you add.
// The score only reflects what is actually published in DNS; AI turns the gaps into a plain-language fix list.
const express = require('express');
const dns = require('dns').promises;
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'email-deliverability';
const MODEL = 'gpt-4o-mini';
const MAX_SAVED = 10;
const HOST_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const DKIM_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 'k2', 's1', 's2', 'resend', 'mail', 'dkim', 'mandrill', 'smtp', 'shopify'];

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

function normaliseDomain(v) {
  const d = String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
  return HOST_RE.test(d) ? d : null;
}

function withTimeout(p, ms = 5000) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms); });
  return Promise.race([p, timer]).finally(() => clearTimeout(t));
}
const txt = async (name) => {
  try { return (await withTimeout(dns.resolveTxt(name))).map((r) => r.join('')); } catch { return []; }
};

async function checkDomain(domain) {
  const [root, dmarcRecs, mx] = await Promise.all([
    txt(domain),
    txt('_dmarc.' + domain),
    withTimeout(dns.resolveMx(domain)).catch(() => []),
  ]);
  const spfRec = root.find((r) => /^v=spf1\b/i.test(r)) || null;
  const dmarcRec = dmarcRecs.find((r) => /^v=DMARC1/i.test(r)) || null;
  const dkimFound = [];
  await Promise.all(DKIM_SELECTORS.map(async (s) => {
    const r = await txt(`${s}._domainkey.${domain}`);
    if (r.some((x) => /v=DKIM1|k=rsa|p=/i.test(x))) dkimFound.push(s);
  }));

  const policy = dmarcRec ? ((dmarcRec.match(/\bp=(none|quarantine|reject)/i) || [])[1] || 'none').toLowerCase() : null;
  const spfStrict = spfRec ? /[-~]all\b/.test(spfRec) : false;
  const issues = [];
  if (!spfRec) issues.push({ severity: 'high', issue: 'No SPF record', fix: `Add a TXT record on ${domain}: v=spf1 include:<your email provider> ~all` });
  else if (!spfStrict) issues.push({ severity: 'medium', issue: 'SPF does not end in ~all or -all', fix: 'End your SPF record with ~all (or -all) so forged mail is rejected.' });
  if (!dkimFound.length) issues.push({ severity: 'medium', issue: 'No DKIM key found on common selectors', fix: 'Your email provider gives you a DKIM record to publish (a TXT record at <selector>._domainkey). If you already added one with a custom selector, it was not detected here.' });
  if (!dmarcRec) issues.push({ severity: 'high', issue: 'No DMARC record', fix: `Add a TXT record on _dmarc.${domain}: v=DMARC1; p=none; rua=mailto:you@${domain}` });
  else if (policy === 'none') issues.push({ severity: 'low', issue: 'DMARC policy is "none" (monitoring only)', fix: 'Once SPF and DKIM pass, move to p=quarantine, then p=reject.' });
  if (!mx.length) issues.push({ severity: 'low', issue: 'No MX records', fix: 'Replies to this domain would bounce. Add MX records if you want to receive mail here.' });

  let score = 0;
  if (spfRec) score += spfStrict ? 30 : 20;
  if (dkimFound.length) score += 30;
  if (dmarcRec) score += policy === 'reject' ? 30 : policy === 'quarantine' ? 25 : 15;
  if (mx.length) score += 10;
  const status = score >= 85 ? 'healthy' : score >= 55 ? 'warning' : 'critical';
  return {
    domain, status, score, checkedAt: new Date().toISOString(),
    spf: { found: !!spfRec, record: spfRec, strict: spfStrict },
    dkim: { found: dkimFound.length > 0, selectors: dkimFound.sort() },
    dmarc: { found: !!dmarcRec, record: dmarcRec, policy },
    mx: { found: mx.length > 0, count: mx.length },
    issues,
  };
}

async function storeDomains(shop, token) {
  const out = new Set();
  try {
    const d = await gql(shop, token, '{ shop { primaryDomain { host } } }');
    const h = normaliseDomain(d.shop.primaryDomain.host);
    if (h && !h.endsWith('.myshopify.com')) out.add(h);
  } catch { /* store domain is optional */ }
  const from = (process.env.EMAIL_FROM || '').match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  if (from && normaliseDomain(from[1]) && !/resend\.dev$/i.test(from[1])) out.add(normaliseDomain(from[1]));
  return [...out];
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), saved: store.read(TOOL, shop, []).length, sender: process.env.EMAIL_FROM || null });
}));

router.get('/domains', withShop(async (req, res, { shop, token }) => {
  const saved = store.read(TOOL, shop, []);
  const suggested = (await storeDomains(shop, token)).filter((d) => !saved.some((s) => s.domain === d));
  res.json({ ok: true, domains: saved, suggested });
}));

router.post('/check', withShop(async (req, res, { shop }) => {
  const domain = normaliseDomain((req.body || {}).domain);
  if (!domain) return res.status(400).json({ ok: false, error: 'Enter a domain like mystore.com.' });
  const result = await checkDomain(domain);
  const saved = store.read(TOOL, shop, []).filter((d) => d.domain !== domain);
  store.write(TOOL, shop, [result, ...saved].slice(0, MAX_SAVED));
  res.json({ ok: true, result });
}));

router.delete('/domains/:domain', withShop(async (req, res, { shop }) => {
  store.write(TOOL, shop, store.read(TOOL, shop, []).filter((d) => d.domain !== req.params.domain));
  res.json({ ok: true });
}));

router.post('/advise', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const domain = normaliseDomain((req.body || {}).domain);
  const found = store.read(TOOL, shop, []).find((d) => d.domain === domain);
  if (!found) return res.status(404).json({ ok: false, error: 'Check this domain first.' });
  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 500,
    messages: [
      { role: 'system', content: 'You help a non-technical shop owner fix email deliverability. Given real DNS results, write a short numbered action plan in plain English (max 6 steps), most important first. Only use facts given. Do not invent record values.' },
      { role: 'user', content: JSON.stringify({ domain: found.domain, score: found.score, spf: found.spf, dkim: found.dkim, dmarc: found.dmarc, mx: found.mx, issues: found.issues }) },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  res.json({ ok: true, advice: String(completion.choices[0].message.content || '').trim() });
}));

module.exports = router;
module.exports._checkDomain = checkDomain;
