// Simple in-memory DB for brands (replace with persistent DB in production)
let brands = [];

module.exports = {
  list: () => brands,
  get: (id) => brands.find(b => b.id === id),
  create: (data) => {
    const brand = { ...data, id: Date.now().toString() };
    brands.push(brand);
    return brand;
  },
  update: (id, data) => {
    const idx = brands.findIndex(b => b.id === id);
    if (idx === -1) return null;
    brands[idx] = { ...brands[idx], ...data };
    return brands[idx];
  },
  delete: (id) => {
    const idx = brands.findIndex(b => b.id === id);
    if (idx === -1) return false;
    brands.splice(idx, 1);
    return true;
  },
  import: (arr) => { brands = brands.concat(arr); },
  export: () => brands,
  clear: () => { brands = []; }
};
