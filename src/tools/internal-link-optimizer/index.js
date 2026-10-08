// Internal Link Optimizer tool entry
const { analyzeLinks } = require('../../core/internalLinks');
const { loadStoreEntities } = require('../../core/seoStoreData');

const key = 'internal-link-optimizer';
const meta = {
  id: key,
  name: 'Internal Link Optimizer',
  description: 'Maps internal links across your products, pages, collections and articles and applies link suggestions.',
};

async function run(input = {}, ctx = {}) {
  if (!ctx.shop || !ctx.token) throw new Error('A connected Shopify shop is required');
  const { entities } = await loadStoreEntities(ctx.shop, ctx.token, { max: input.limit || 100 });
  return analyzeLinks(entities, [ctx.shop.toLowerCase()]);
}

module.exports = { key, meta, run };
