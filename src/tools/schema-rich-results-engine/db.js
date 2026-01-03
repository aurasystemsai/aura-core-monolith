// Minimal placeholder DB module for schema-rich-results-engine
module.exports = {
  list: () => [],
  get: (id) => null,
  create: (data) => data,
  update: (id, data) => data,
  delete: (id) => true
};
