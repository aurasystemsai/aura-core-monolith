// Technical SEO Auditor tool entry
const router = require('./router');
const { runTechnicalAudit } = require('./audit');

const key = 'technical-seo-auditor';
const meta = {
  id: key,
  name: 'Technical SEO Auditor',
  description: 'Checks your live storefront pages, robots.txt and sitemap for real technical SEO problems.',
};

async function run(input = {}, ctx = {}) {
  if (!ctx.shop || !ctx.token) throw new Error('A connected Shopify shop is required');
  return runTechnicalAudit(ctx.shop, ctx.token);
}

module.exports = { key, meta, run, router };
