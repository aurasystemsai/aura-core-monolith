// Rank & Visibility Tracker tool entry
const provider = require('../../core/rankProvider');

const meta = {
  id: 'rank-visibility-tracker',
  name: 'Rank & Visibility Tracker',
  description: 'Tracks your real Google positions for chosen keywords over time. Requires a connected rank data provider.',
};

async function run(input = {}, ctx = {}) {
  if (!ctx.domain) throw new Error('A store domain is required');
  return provider.checkRank(String(input.keyword || ''), ctx.domain, input.country);
}

module.exports = { key: 'rank-visibility-tracker', meta, run };
