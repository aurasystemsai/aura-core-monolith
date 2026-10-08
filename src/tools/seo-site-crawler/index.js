// SEO Site Crawler Tool Entry
const router = require('./router');
const { loadStoreEntities } = require('../../core/seoStoreData');
const { auditStore } = require('../../core/seoAnalyzers');

exports.meta = {
  id: 'seo-site-crawler',
  name: 'SEO Site Crawler',
  category: 'SEO',
  description: 'Audit your Shopify products, pages, collections and articles for SEO issues.'
};

exports.run = async function run(input = {}, ctx = {}) {
  if (!ctx.shop || !ctx.token) throw new Error('A connected Shopify shop is required');
  const { entities } = await loadStoreEntities(ctx.shop, ctx.token, { max: input.limit || 100 });
  return auditStore(entities);
};

exports.router = router;
