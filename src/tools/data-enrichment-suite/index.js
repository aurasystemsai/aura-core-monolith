'use strict';

const engine = require('./engines/data-enrichment-engine');

module.exports = {
  meta: {
    id: 'data-enrichment-suite',
    name: 'Data Enrichment Suite',
    category: 'Personalization',
  },
  async run(input = {}) {
    return { ok: true, profile: engine.profileDataset(input.type, input.records) };
  },
};