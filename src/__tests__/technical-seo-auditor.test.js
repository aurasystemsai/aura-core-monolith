const os = require('os');
const path = require('path');
const fs = require('fs');
process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-tech-'));

const express = require('express');
const request = require('supertest');
const { checkPage, checkRobotsTxt, checkSitemap } = require('../core/technicalChecks');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));

const GOOD = `<!doctype html><html lang="en"><head><title>Blue Mug | Handmade Ceramics</title>
<meta name="description" content="${'Beautiful handmade ceramic mug. '.repeat(4)}">
<meta name="viewport" content="width=device-width"><link rel="canonical" href="https://a.com/products/p">
<meta property="og:title" content="x"><meta property="og:image" content="y">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Mug"}</script>
</head><body><h1>Blue Mug</h1><img src="a.jpg" alt="mug"></body></html>`;

describe('checkPage', () => {
  test('a healthy product page has no findings', () => {
    const r = checkPage({ url: 'https://a.com/products/p', status: 200, html: GOOD, kind: 'product', ms: 200 });
    expect(r.findings).toEqual([]);
    expect(r.structuredDataTypes).toContain('Product');
  });
  test('detects noindex, missing title, bad JSON-LD, http, multiple H1', () => {
    const html = '<html><head><meta name="robots" content="noindex"><script type="application/ld+json">{bad</script></head><body><h1>a</h1><h1>b</h1><img src="x"></body></html>';
    const ids = checkPage({ url: 'http://a.com/', status: 200, html, kind: 'home' }).findings.map(f => f.id);
    expect(ids).toEqual(expect.arrayContaining(['https', 'title-missing', 'noindex', 'jsonld-invalid', 'h1', 'img-alt', 'viewport']));
  });
  test('honours x-robots-tag header and non-200 status', () => {
    const ids = checkPage({ url: 'https://a.com/', status: 404, headers: { 'x-robots-tag': 'noindex' }, html: GOOD, kind: 'page' }).findings.map(f => f.id);
    expect(ids).toEqual(expect.arrayContaining(['status', 'noindex']));
  });
});

describe('robots and sitemap', () => {
  test('robots blocking all is high severity', () => {
    const r = checkRobotsTxt({ status: 200, text: 'User-agent: *\nDisallow: /\n' });
    expect(r.blocksAll).toBe(true);
    expect(r.findings.map(f => f.id)).toContain('robots-blocks-all');
  });
  test('robots with sitemap and specific disallows is fine', () => {
    const r = checkRobotsTxt({ status: 200, text: 'User-agent: *\nDisallow: /cart\nSitemap: https://a.com/sitemap.xml' });
    expect(r.findings).toEqual([]);
    expect(r.sitemaps).toHaveLength(1);
  });
  test('missing files are reported', () => {
    expect(checkRobotsTxt({ status: 404, text: '' }).exists).toBe(false);
    expect(checkSitemap({ status: 404, text: '' }).findings[0].id).toBe('sitemap-missing');
    expect(checkSitemap({ status: 200, text: '<urlset><url><loc>a</loc></url></urlset>' }).urlCount).toBe(1);
  });
});

function app(session) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = session; next(); });
  a.use('/api/technical-seo-auditor', require('../tools/technical-seo-auditor/router'));
  return a;
}

function mockFetch({ password = false } = {}) {
  const hdr = (h) => ({ get: (k) => h[k.toLowerCase()], forEach: (fn) => Object.entries(h).forEach(([k, v]) => fn(v, k)) });
  global.fetch = jest.fn(async (url, opts = {}) => {
    if (String(url).includes('graphql.json')) {
      const q = JSON.parse(opts.body).query;
      if (q.includes('primaryDomain')) return { ok: true, json: async () => ({ data: { shop: { primaryDomain: { url: 'https://shop.example.com' } } } }) };
      const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
      if (q.includes('products(')) {
        return { ok: true, json: async () => ({ data: { products: { ...empty, nodes: [{ id: 'gid://shopify/Product/1', handle: 'p', title: 'Mug', descriptionHtml: '', status: 'ACTIVE', seo: {}, media: { nodes: [] } }] } } }) };
      }
      const key = /(\w+)\(first/.exec(q)[1];
      return { ok: true, json: async () => ({ data: { [key]: empty } }) };
    }
    const u = String(url);
    if (password) return { status: 302, headers: hdr({ location: 'https://shop.example.com/password' }), text: async () => '' };
    if (u.endsWith('/password')) return { status: 200, headers: hdr({}), text: async () => 'Enter store password' };
    if (u.endsWith('/robots.txt')) return { status: 200, headers: hdr({}), text: async () => 'User-agent: *\nDisallow: /cart\nSitemap: https://shop.example.com/sitemap.xml' };
    if (u.endsWith('/sitemap.xml')) return { status: 200, headers: hdr({}), text: async () => '<urlset><url><loc>a</loc></url></urlset>' };
    return { status: 200, headers: hdr({}), text: async () => GOOD };
  });
}

describe('technical-seo-auditor router', () => {
  const session = { shop: 'a.myshopify.com', shopifyToken: 'tok' };

  test('requires a connected shop', async () => {
    expect((await request(app(undefined)).post('/api/technical-seo-auditor/audit')).status).toBe(401);
  });

  test('audits the primary domain and stores history', async () => {
    mockFetch();
    const r = await request(app(session)).post('/api/technical-seo-auditor/audit').send({});
    expect(r.status).toBe(200);
    expect(r.body.result.base).toBe('https://shop.example.com');
    expect(r.body.result.pages.map(p => p.kind)).toEqual(expect.arrayContaining(['home', 'product']));
    expect(r.body.result.robots.exists).toBe(true);
    expect(r.body.result.sitemap.urlCount).toBe(1);
    expect(typeof r.body.result.score).toBe('number');
    const h = await request(app(session)).get('/api/technical-seo-auditor/history');
    expect(h.body.history.length).toBeGreaterThan(0);
    expect((await request(app(session)).get(`/api/technical-seo-auditor/history/${r.body.id}`)).body.entry.id).toBe(r.body.id);
    expect((await request(app(session)).get('/api/technical-seo-auditor/history/none')).status).toBe(404);
  });

  test('never requests private addresses', async () => {
    mockFetch();
    await request(app(session)).post('/api/technical-seo-auditor/audit').send({});
    const pageCalls = global.fetch.mock.calls.map(c => String(c[0])).filter(u => !u.includes('graphql'));
    expect(pageCalls.every(u => u.startsWith('https://shop.example.com'))).toBe(true);
  });

  test('reports password-protected storefronts instead of fake results', async () => {
    mockFetch({ password: true });
    global.fetch.mockImplementation(async (url, opts = {}) => {
      const u = String(url);
      const hdr = (h) => ({ get: (k) => h[k.toLowerCase()], forEach: () => {} });
      if (u.includes('graphql.json')) {
        const q = JSON.parse(opts.body).query;
        if (q.includes('primaryDomain')) return { ok: true, json: async () => ({ data: { shop: { primaryDomain: { url: 'https://shop.example.com' } } } }) };
        const key = /(\w+)\(first/.exec(q)[1];
        return { ok: true, json: async () => ({ data: { [key]: { pageInfo: { hasNextPage: false }, nodes: [] } } }) };
      }
      if (u.endsWith('/password')) return { status: 200, headers: hdr({}), text: async () => 'Enter store password' };
      return { status: 302, headers: hdr({ location: '/password' }), text: async () => '' };
    });
    const r = await request(app(session)).post('/api/technical-seo-auditor/audit').send({});
    expect(r.body.result.warnings[0]).toMatch(/password/i);
    expect(r.body.result.score).toBeNull();
  });
});
