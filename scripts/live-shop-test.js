// Live smoke test of the SEO tools against a real (development) Shopify store.
// Usage: node scripts/live-shop-test.js            (read-only)
//        node scripts/live-shop-test.js --write    (also applies one reversible change)
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const envFile = path.join(__dirname, '..', '.env.test.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const shop = process.env.TEST_SHOP;
const token = process.env.TEST_SHOP_TOKEN;
if (!shop || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop) || !token || token.includes('replace_me')) {
  console.error('Set TEST_SHOP and TEST_SHOP_TOKEN in .env.test.local first.');
  process.exit(2);
}
process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-live-'));
const WRITE = process.argv.includes('--write');
const shopTokens = require('../src/core/shopTokens');
const realGet = shopTokens.getToken;
shopTokens.getToken = (s) => (s === shop ? token : realGet(s));

const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.session = { shop, shopifyToken: token }; req.deductCredits = async () => {}; next(); });
const tools = {
  crawler: 'seo-site-crawler', audit: 'technical-seo-auditor', schema: 'schema-rich-results-engine',
  links: 'internal-link-optimizer', onpage: 'on-page-seo-engine', rank: 'rank-visibility-tracker',
};
for (const [k, id] of Object.entries(tools)) app.use(`/${k}`, require(`../src/tools/${id}/router`));

const results = [];
async function step(name, fn) {
  try {
    const note = await fn();
    results.push({ name, ok: true, note });
    console.log(`PASS  ${name}${note ? ' - ' + note : ''}`);
  } catch (e) {
    results.push({ name, ok: false, note: e.message });
    console.log(`FAIL  ${name} - ${e.message}`);
  }
}
const need = (cond, msg) => { if (!cond) throw new Error(msg); };
const get = (p) => request(app).get(p);
const post = (p, b) => request(app).post(p).send(b || {});

(async () => {
  let items = [];
  await step('on-page: list store items', async () => {
    const r = await get('/onpage/items');
    need(r.body.ok, r.body.error);
    items = r.body.items;
    need(items.length, 'store returned no products/pages/articles');
    return `${items.length} items (${[...new Set(items.map(i => i.type))].join(', ')})`;
  });
  const product = items.find(i => i.type === 'product');
  const article = items.find(i => i.type === 'article');

  await step('crawler: crawl store', async () => {
    const r = await post('/crawler/crawl');
    need(r.body.ok, r.body.error);
    const x = r.body.result; need(x && x.pagesScanned > 0, 'crawl scanned no pages'); return `score ${x.score}, ${x.pagesScanned} pages, ${x.totalIssues} issues`;
  });
  await step('crawler: history', async () => { const r = await get('/crawler/history'); need(r.body.ok && r.body.history.length === 1, 'history missing'); });
  await step('technical audit: live storefront', async () => {
    const r = await post('/audit/audit');
    need(r.body.ok, r.body.error);
    const x = r.body.result; need(x && x.robots && x.sitemap, 'audit result incomplete'); return (x.warnings || []).join('; ') || `score ${x.score}`;
  });
  await step('internal links: analyze', async () => {
    const r = await post('/links/analyze');
    need(r.body.ok, r.body.error);
    return `${r.body.stats.pages} pages, ${r.body.suggestions.length} suggestions`;
  });
  await step('on-page: analyze product', async () => {
    need(product, 'no product in store');
    const r = await post('/onpage/analyze', { id: product.id, keyword: product.title.split(' ')[0] });
    need(r.body.ok, r.body.error);
    return `score ${r.body.result.score}`;
  });
  await step('schema: product JSON-LD validates', async () => {
    need(product, 'no product in store');
    const r = await post('/schema/generate', { type: 'Product', id: product.id });
    need(r.body.ok, r.body.error);
    need(r.body.validation.valid, JSON.stringify(r.body.validation.issues));
  });
  await step('schema: article JSON-LD validates', async () => {
    if (!article) return 'skipped: no blog article in store';
    const r = await post('/schema/generate', { type: 'Article', id: article.id });
    need(r.body.ok, r.body.error);
    need(r.body.validation.valid, JSON.stringify(r.body.validation.issues));
  });
  await step('rank: status', async () => { const r = await get('/rank/status'); need(r.body.ok, r.body.error); return r.body.configured ? 'provider connected' : 'no provider (expected)'; });

  if (process.env.OPENAI_API_KEY) {
    await step('AI on-page: optimize title + meta', async () => {
      const r = await post('/onpage/ai/optimize', { id: product.id, keyword: 'ceramic mug' });
      need(r.body.ok, r.body.error);
      const s = r.body.suggestion;
      need(/ceramic mug/i.test(s.seoTitle) && /ceramic mug/i.test(s.metaDescription), 'keyword missing from suggestion');
      return `"${s.seoTitle}" (${s.seoTitle.length}) -> projected ${r.body.projectedScore}`;
    });
    await step('AI schema: FAQ from product description', async () => {
      const mug = items.find(i => i.type === 'product' && /mug/i.test(i.title));
      const r = await post('/schema/ai/faq', { id: mug.id });
      need(r.body.ok, r.body.error);
      return `${r.body.questions.length} FAQs`;
    });
    await step('AI links: suggest for article', async () => {
      const r = await post('/links/ai/suggest', { sourceId: items.find(i => i.type === 'article' && /gift/i.test(i.title)).id });
      need(r.body.ok, r.body.error);
      need(r.body.suggestions.length > 0, 'no verified suggestions');
      return r.body.suggestions.map(s => `"${s.anchor}"`).join(', ');
    });
    await step('AI technical audit: action plan', async () => {
      const r = await post('/audit/ai/plan');
      need(r.body.ok, r.body.error);
      need(r.body.plan && r.body.plan.length > 20, 'empty plan');
      return `${r.body.plan.length} chars`;
    });
    await step('AI crawler: suggest product fixes', async () => {
      const c = await get('/crawler/history');
      const h = await get('/crawler/history/' + c.body.history[0].id);
      const urls = [...new Set(h.body.entry.result.issues.filter(i => /\/products\//.test(i.page)).map(i => i.page))].slice(0, 3);
      need(urls.length, 'crawl found no product issues to fix');
      const r = await post('/crawler/suggest-fixes', { urls });
      need(r.body.ok, r.body.error);
      need(r.body.fixes && r.body.fixes.length, 'no fixes returned');
      return `${r.body.fixes.length} fixes`;
    });
  } else {
    console.log('SKIP  AI steps: OPENAI_API_KEY not set in .env.test.local');
  }

  if (WRITE) {
    await step('on-page: apply SEO title, read back, restore', async () => {
      need(product, 'no product in store');
      const q = 'query($id:ID!){ product(id:$id){ seo{title description} } }';
      const read = async () => {
        const res = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, { method: 'POST', headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: { id: product.id } }) });
        return (await res.json()).data.product.seo;
      };
      const before = await read();
      const marker = `AURA live test ${Date.now() % 100000}`;
      const a = await post('/onpage/apply', { id: product.id, seoTitle: marker });
      need(a.body.ok, a.body.error);
      const after = await read();
      need(after.title === marker, `Shopify did not save the title (got "${after.title}")`);
      const b = await post('/onpage/apply', { id: product.id, seoTitle: before.title || product.title });
      need(b.body.ok, 'restore failed: ' + b.body.error);
      return 'saved, verified and restored';
    });

    await step('internal links: apply link, read back, restore', async () => {
      const gqlRaw = async (q, v) => {
        const res = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, { method: 'POST', headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: v }) });
        const j = await res.json();
        if (j.errors) throw new Error(JSON.stringify(j.errors));
        return j.data;
      };
      const an = await post('/links/analyze');
      const s = an.body.suggestions.find(x => x.sourceType === 'article');
      need(s, 'no article link suggestion to apply');
      const readBody = async () => (await gqlRaw('query($id:ID!){ article(id:$id){ body } }', { id: s.sourceId })).article.body;
      const before = await readBody();
      const a = await post('/links/apply', { suggestions: [s] });
      need(a.body.ok && a.body.success === 1, JSON.stringify(a.body));
      const after = await readBody();
      const restore = async () => gqlRaw('mutation($id:ID!,$b:HTML!){ articleUpdate(id:$id, article:{body:$b}){ userErrors{message} } }', { id: s.sourceId, b: before });
      try {
        need(after.includes('<a href='), 'link not present in saved article');
        need(after.replace(/<a href="[^"]*">|<\/a>/g, '') === before.replace(/<a href="[^"]*">|<\/a>/g, ''), 'article text changed beyond the link');
      } finally { await restore(); }
      need((await readBody()) === before, 'restore did not match original');
      return `"${s.anchor}" -> ${s.targetUrl.replace(/^https?:\/\/[^/]+/, '')}`;
    });
  }

  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed${WRITE ? '' : ' (read-only; use --write to test saving)'}`);
  process.exit(failed ? 1 : 0);
})();




