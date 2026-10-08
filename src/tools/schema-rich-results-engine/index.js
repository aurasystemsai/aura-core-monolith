// Schema & Rich Results Engine tool entry
const { validateSchema } = require('../../core/schemaBuilder');

const key = 'schema-rich-results-engine';
const meta = {
  id: key,
  name: 'Schema & Rich Results Engine',
  description: 'Generate JSON-LD from your real Shopify data and validate it for Google rich results.',
};

async function run(input = {}) {
  if (!input.schema) throw new Error('schema (JSON-LD object or string) is required');
  return validateSchema(input.schema);
}

module.exports = { key, meta, run };
