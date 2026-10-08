// On-Page SEO Engine tool entry
const { analyzeOnPage } = require('../../core/onPage');
const { loadStoreEntities } = require('../../core/seoStoreData');

const meta = {
  id: 'on-page-seo-engine',
  name: 'On-Page SEO Engine',
  description: 'Scores any product, page, collection or article against a target keyword and applies AI-written title and meta tags.',
};

async function run(input = {}, ctx = {}) {
  if (!ctx.shop || !ctx.token) throw new Error('A connected Shopify shop is required');
  const { entities } = await loadStoreEntities(ctx.shop, ctx.token, { max: 100 });
  const entity = entities.find(e => e.id === input.id);
  if (!entity) throw new Error('Page not found');
  return analyzeOnPage(entity, input.keyword);
}

module.exports = { key: 'on-page-seo-engine', meta, run };
