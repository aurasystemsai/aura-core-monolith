// Minimal db placeholder for tests
module.exports = {
  get: () => ({}),
  list: () => [],
  create: (item) => item,
  update: (id, item) => item,
  delete: (id) => true,
};